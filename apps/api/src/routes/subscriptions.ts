import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }
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

    // TODO: Create Razorpay order and return payment link
    const sub = await prisma.subscription.create({
      data: {
        businessId,
        planId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: plan.price,
      },
      include: { plan: true },
    });

    await prisma.business.update({ where: { id: businessId }, data: { planId } });

    res.status(201).json({ success: true, data: sub });
  } catch (error) { next(error); }
});

export default router;
