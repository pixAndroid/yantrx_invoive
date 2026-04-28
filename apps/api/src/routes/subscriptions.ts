import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createOrder, verifyPaymentSignature } from '@yantrix/billing';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

type PlanBillingType = 'daily' | 'yearly' | 'monthly';

/** Classifies a plan as daily, yearly, or monthly based on its slug and pricing fields. */
function getPlanBillingType(plan: { slug: string; price: number; dailyPrice: number | null; yearlyPrice: number | null }): PlanBillingType {
  const slug = plan.slug.toLowerCase();
  // Daily plans store their price in dailyPrice with price === 0
  if (slug === 'daily' || (plan.dailyPrice !== null && plan.price === 0)) return 'daily';
  // Yearly plans store their price in yearlyPrice with price === 0 and no dailyPrice
  if (slug === 'yearly' || (plan.yearlyPrice !== null && plan.price === 0 && plan.dailyPrice === null)) return 'yearly';
  return 'monthly';
}

/** Returns endDate and amount to charge based on plan billing period. */
function getPlanBillingDetails(plan: { slug: string; price: number; dailyPrice: number | null; yearlyPrice: number | null; durationDays: number | null }) {
  const now = new Date();
  const billingType = getPlanBillingType(plan);

  // Determine the effective charge amount based on billing period type.
  // Daily and yearly plans store the real price in dailyPrice/yearlyPrice
  // while price is 0, so we must pick the right field regardless of durationDays.
  const amount =
    billingType === 'daily' ? (plan.dailyPrice ?? plan.price) :
    billingType === 'yearly' ? (plan.yearlyPrice ?? plan.price) :
    plan.price;

  // Determine the subscription end-date.
  // An explicit durationDays on the plan takes precedence for the duration.
  if (plan.durationDays !== null && plan.durationDays > 0) {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.durationDays);
    return { endDate, amount };
  }
  if (billingType === 'daily') {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 1);
    return { endDate, amount };
  }
  if (billingType === 'yearly') {
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return { endDate, amount };
  }
  // default: monthly
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);
  return { endDate, amount };
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

    // Auto-renew free plan when no premium plan is active and the free plan is expired
    const activeStatuses = ['ACTIVE', 'TRIAL'] as const;
    const activePremiumSub = await prisma.subscription.findFirst({
      where: {
        businessId,
        status: { in: activeStatuses },
        plan: { slug: { not: 'free' } },
      },
    });

    if (!activePremiumSub) {
      const expiredFreeSub = await prisma.subscription.findFirst({
        where: {
          businessId,
          status: 'EXPIRED',
          plan: { slug: 'free' },
        },
        orderBy: { endDate: 'desc' },
        include: { plan: true },
      });

      if (expiredFreeSub) {
        // Check there is no already-active free subscription (edge case guard)
        const activeFreeSub = await prisma.subscription.findFirst({
          where: { businessId, status: { in: activeStatuses }, plan: { slug: 'free' } },
        });

        if (!activeFreeSub) {
          const { endDate: newEndDate, amount: newAmount } = getPlanBillingDetails(expiredFreeSub.plan);
          await prisma.subscription.create({
            data: {
              businessId,
              planId: expiredFreeSub.planId,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: newEndDate,
              amount: newAmount,
            },
          });
          await prisma.business.update({
            where: { id: businessId },
            data: { planId: expiredFreeSub.planId },
          });
        }
      }
    }

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
      contact: business?.phone || req.user!.phone || '',
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
