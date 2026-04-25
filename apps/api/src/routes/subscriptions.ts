import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createOrder, verifyPaymentSignature } from '@yantrix/billing';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

/** Returns endDate and amount to charge based on plan billing period. */
function getPlanBillingDetails(plan: { slug: string; price: number; dailyPrice: number | null; yearlyPrice: number | null; durationDays: number | null }) {
  const now = new Date();
  // If the plan has an explicit durationDays, always use that.
  if (plan.durationDays !== null && plan.durationDays > 0) {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.durationDays);
    return { endDate, amount: plan.price };
  }
  const slug = plan.slug.toLowerCase();
  // A plan is treated as daily when its slug is 'daily' OR when it has a dailyPrice
  // with no monthly base price (price === 0).
  if (slug === 'daily' || (plan.dailyPrice !== null && plan.price === 0)) {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 1);
    return { endDate, amount: plan.dailyPrice ?? plan.price };
  }
  // A plan is treated as yearly when its slug is 'yearly' OR when it has a yearlyPrice
  // with no monthly base price (price === 0) and no daily price.
  if (slug === 'yearly' || (plan.yearlyPrice !== null && plan.price === 0 && plan.dailyPrice === null)) {
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return { endDate, amount: plan.yearlyPrice ?? plan.price };
  }
  // default: monthly
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);
  return { endDate, amount: plan.price };
}

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    // Auto-expire any subscriptions whose endDate has passed
    await prisma.subscription.updateMany({
      where: { businessId, status: { in: ['ACTIVE', 'TRIAL'] }, endDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const subs = await prisma.subscription.findMany({
      where: { businessId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: subs });
  } catch (error) { next(error); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { planId } = req.body;
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }

    // Cancel any existing active/trial subscriptions before creating the new one
    await prisma.subscription.updateMany({
      where: { businessId, status: { in: ['ACTIVE', 'TRIAL'] } },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'Changed plan' },
    });

    const { endDate: planEndDate, amount: planAmount } = getPlanBillingDetails(plan);

    const sub = await prisma.subscription.create({
      data: {
        businessId,
        planId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: planEndDate,
        amount: planAmount,
      },
      include: { plan: true },
    });

    await prisma.business.update({ where: { id: businessId }, data: { planId } });

    res.status(201).json({ success: true, data: sub });
  } catch (error) { next(error); }
});

// Create a Razorpay order for a plan subscription
router.post('/razorpay-order', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { planId } = req.body;
    if (!planId) { res.status(400).json({ success: false, error: 'planId is required' }); return; }

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      res.status(500).json({ success: false, error: 'Payment gateway is not configured. Please contact support.' });
      return;
    }

    const [plan, business] = await Promise.all([
      prisma.plan.findUnique({ where: { id: planId } }),
      prisma.business.findUnique({ where: { id: businessId }, select: { name: true, email: true, phone: true } }),
    ]);
    if (!plan) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }

    const { amount: planAmount } = getPlanBillingDetails(plan);
    if (planAmount <= 0) { res.status(400).json({ success: false, error: 'Cannot create payment order for free plan' }); return; }

    const order = await createOrder({
      amount: planAmount,
      currency: 'INR',
      receipt: `sub_${businessId.slice(0, 8)}_${Date.now()}`,
      notes: { businessId, planId, planName: plan.name },
    });

    const prefill = {
      name: req.user!.name || business?.name || '',
      email: req.user!.email || business?.email || '',
      contact: req.user!.phone || business?.phone || '',
    };

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        prefill,
      },
    });
  } catch (error) { next(error); }
});

// Verify Razorpay payment and activate subscription
router.post('/verify-payment', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!planId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, error: 'Missing required payment fields' });
      return;
    }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid payment signature' });
      return;
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }

    // Cancel any existing active/trial subscriptions before creating the new one
    await prisma.subscription.updateMany({
      where: { businessId, status: { in: ['ACTIVE', 'TRIAL'] } },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'Upgraded to new plan' },
    });

    const { endDate: planEndDate, amount: planAmount } = getPlanBillingDetails(plan);

    const sub = await prisma.subscription.create({
      data: {
        businessId,
        planId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: planEndDate,
        razorpayOrderId: razorpay_order_id,
        amount: planAmount,
        metadata: { razorpay_payment_id, razorpay_signature },
      },
      include: { plan: true },
    });

    await prisma.business.update({ where: { id: businessId }, data: { planId } });

    res.status(201).json({ success: true, data: sub });
  } catch (error) { next(error); }
});

export default router;
