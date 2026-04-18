import { Router, Response, NextFunction } from 'express';
import { authenticate, requireSuperAdmin, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/stats', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalBusinesses, totalInvoices, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.invoice.count(),
      prisma.invoice.aggregate({ where: { isPaid: true }, _sum: { total: true } }),
    ]);
    res.json({ success: true, data: { totalUsers, totalBusinesses, totalInvoices, totalRevenue: totalRevenue._sum.total || 0 } });
  } catch (error) { next(error); }
});

router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const search = req.query.search as string;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, isVerified: true, lastLoginAt: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.put('/users/:id/suspend', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'User suspended', data: user });
  } catch (error) { next(error); }
});

router.put('/users/:id/activate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
    });
    res.json({ success: true, message: 'User activated', data: user });
  } catch (error) { next(error); }
});

router.get('/businesses', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const businesses = await prisma.business.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { plan: true, owner: { select: { name: true, email: true } }, _count: { select: { invoices: true, customers: true } } },
    });
    const total = await prisma.business.count();
    res.json({
      success: true,
      data: businesses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.get('/plans', async (_req, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: plans });
  } catch (error) { next(error); }
});

router.post('/plans', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.create({ data: req.body });
    res.status(201).json({ success: true, data: plan });
  } catch (error) { next(error); }
});

router.put('/plans/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.plan.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: plan });
  } catch (error) { next(error); }
});

router.get('/reviews', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, avatar: true } } },
    });
    res.json({ success: true, data: reviews });
  } catch (error) { next(error); }
});

router.put('/reviews/:id/approve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true, adminReply: req.body.reply, repliedAt: req.body.reply ? new Date() : undefined },
    });
    res.json({ success: true, data: review });
  } catch (error) { next(error); }
});

router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '50');
    const logs = await prisma.auditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    const total = await prisma.auditLog.count();
    res.json({
      success: true,
      data: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.get('/subscriptions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const [subs, total] = await Promise.all([
      prisma.subscription.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, name: true } },
          plan: { select: { id: true, name: true, price: true } },
        },
      }),
      prisma.subscription.count(),
    ]);
    res.json({
      success: true,
      data: subs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.get('/modules', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const modules = await prisma.module.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: modules });
  } catch (error) { next(error); }
});

router.put('/modules/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.body;
    const mod = await prisma.module.update({
      where: { id: req.params.id },
      data: { isActive },
    });
    res.json({ success: true, data: mod });
  } catch (error) { next(error); }
});

export default router;
