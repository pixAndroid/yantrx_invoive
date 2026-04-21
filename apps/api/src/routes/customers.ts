import { Router, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
], validate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const search = req.query.search as string;

    const where = {
      businessId,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
          { gstin: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Customer name required'),
  body('email').optional().isEmail(),
  body('gstin').optional().isLength({ min: 15, max: 15 }).withMessage('GSTIN must be 15 characters'),
], validate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    // Enforce customer limit per plan
    const business = await prisma.business.findUnique({ where: { id: businessId }, include: { plan: true } });

    // Determine whether the subscription is currently active
    const now = new Date();
    const activeSub = await prisma.subscription.findFirst({
      where: { businessId, status: { in: ['ACTIVE', 'TRIAL'] }, endDate: { gte: now } },
      orderBy: { startDate: 'desc' },
    });

    // If no active subscription, fall back to free-plan limits
    const effectivePlan = activeSub
      ? business?.plan
      : (await prisma.plan.findUnique({ where: { slug: 'free' } })) ??
        (await prisma.plan.findFirst({ where: { price: 0 }, orderBy: { price: 'asc' } }));

    if (effectivePlan && effectivePlan.customerLimit > 0) {
      const customerCount = await prisma.customer.count({ where: { businessId, isActive: true } });
      if (customerCount >= effectivePlan.customerLimit) {
        const planLabel = activeSub ? effectivePlan.name : 'free tier';
        res.status(403).json({
          success: false,
          error: `Customer limit reached. Your ${planLabel} allows ${effectivePlan.customerLimit} customer${effectivePlan.customerLimit === 1 ? '' : 's'}. Please ${activeSub ? 'upgrade' : 'renew your plan'} to add more customers.`,
        });
        return;
      }
    }

    const customer = await prisma.customer.create({
      data: { ...req.body, businessId },
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) { next(error); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }
    res.json({ success: true, data: customer });
  } catch (error) { next(error); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { businessId: _bId, ...updateData } = req.body;
    const customer = await prisma.customer.updateMany({
      where: { id: req.params.id, businessId: req.user!.businessId! },
      data: updateData,
    });
    if (customer.count === 0) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }
    const updated = await prisma.customer.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.customer.updateMany({
      where: { id: req.params.id, businessId: req.user!.businessId! },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) { next(error); }
});

export default router;
