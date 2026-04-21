import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id, isActive: true },
      include: { business: { include: { plan: true } } },
    });
    res.json({ success: true, data: memberships.map(m => m.business) });
  } catch (error) { next(error); }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Business name required'),
], validate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const freePlan = await prisma.plan.findFirst({ where: { slug: 'free' } });
    const business = await prisma.business.create({
      data: {
        ...req.body,
        ownerId: req.user!.id,
        planId: freePlan?.id,
      },
    });
    await prisma.membership.create({
      data: {
        userId: req.user!.id,
        businessId: business.id,
        role: 'OWNER',
        permissions: JSON.stringify(['*']),
        joinedAt: new Date(),
      },
    });
    res.status(201).json({ success: true, data: business });
  } catch (error) { next(error); }
});

router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Use the active subscription's startDate as the billing-period start so that
    // upgrading a plan resets the invoice count immediately.
    const activeSub = await prisma.subscription.findFirst({
      where: { businessId, status: { in: ['ACTIVE', 'TRIAL'] }, endDate: { gte: now } },
      orderBy: { startDate: 'desc' },
    });
    const invoiceCountFrom = activeSub?.startDate ?? startOfMonth;

    const [totalRevenue, invoicesThisMonth, activeCustomers, pendingAgg] = await Promise.all([
      prisma.invoice.aggregate({
        where: { businessId, isPaid: true },
        _sum: { total: true },
      }),
      prisma.invoice.count({
        where: { businessId, createdAt: { gte: invoiceCountFrom } },
      }),
      prisma.customer.count({ where: { businessId } }),
      prisma.invoice.aggregate({
        where: { businessId, isPaid: false, status: { not: 'DRAFT' } },
        _sum: { amountDue: true },
        _count: { id: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.total || 0,
        invoicesThisMonth,
        activeCustomers,
        pendingAmount: pendingAgg._sum.amountDue || 0,
        pendingInvoicesCount: pendingAgg._count.id || 0,
      },
    });
  } catch (error) { next(error); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const membership = await prisma.membership.findFirst({
      where: { userId: req.user!.id, businessId: req.params.id, isActive: true },
    });
    if (!membership) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }
    const business = await prisma.business.findUnique({
      where: { id: req.params.id },
      include: { plan: true, branches: true, subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!business) { res.status(404).json({ success: false, error: 'Business not found' }); return; }
    res.json({ success: true, data: business });
  } catch (error) { next(error); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const membership = await prisma.membership.findFirst({
      where: { userId: req.user!.id, businessId: id, isActive: true, role: { in: ['OWNER', 'SUPER_ADMIN'] } },
    });
    if (!membership) { res.status(403).json({ success: false, error: 'Access denied' }); return; }

    const {
      id: _id,
      ownerId: _ownerId,
      planId: _planId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      owner: _owner,
      plan: _plan,
      branches: _branches,
      memberships: _memberships,
      customers: _customers,
      products: _products,
      invoices: _invoices,
      payments: _payments,
      expenses: _expenses,
      subscriptions: _subscriptions,
      modules: _modules,
      auditLogs: _auditLogs,
      notifications: _notifications,
      apiKeys: _apiKeys,
      reviews: _reviews,
      ...updateData
    } = req.body;
    const business = await prisma.business.update({ where: { id }, data: updateData });
    res.json({ success: true, data: business });
  } catch (error) { next(error); }
});

export default router;
