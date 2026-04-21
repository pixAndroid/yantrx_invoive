import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// Public endpoint — no authentication required
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        dailyPrice: true,
        yearlyPrice: true,
        currency: true,
        invoiceLimit: true,
        customerLimit: true,
        productLimit: true,
        userLimit: true,
        features: true,
        isFeatured: true,
        sortOrder: true,
      },
    });
    res.json({ success: true, data: plans });
  } catch (error) { next(error); }
});

export default router;
