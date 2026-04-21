import { Router, Response, NextFunction } from 'express';
import { authenticate, requireSuperAdmin, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

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
    const role = req.query.role as string;
    const isActiveStr = req.query.isActive as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (role) where.role = role;
    if (isActiveStr !== undefined && isActiveStr !== '') where.isActive = isActiveStr === 'true';

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
    const search = req.query.search as string;
    const plan = req.query.plan as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { gstin: { contains: search, mode: 'insensitive' as const } },
        { owner: { name: { contains: search, mode: 'insensitive' as const } } },
        { owner: { email: { contains: search, mode: 'insensitive' as const } } },
      ];
    }
    if (plan) where.plan = { slug: plan };

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { plan: true, owner: { select: { name: true, email: true } }, _count: { select: { invoices: true, customers: true } } },
      }),
      prisma.business.count({ where }),
    ]);

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
    const search = req.query.search as string;
    const status = req.query.status as string;
    const planId = req.query.planId as string;

    // Auto-expire any subscriptions whose endDate has passed (across all businesses)
    await prisma.subscription.updateMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] }, endDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const where: any = {};
    if (search) {
      where.OR = [
        { business: { name: { contains: search, mode: 'insensitive' as const } } },
        { plan: { name: { contains: search, mode: 'insensitive' as const } } },
      ];
    }
    if (status) where.status = status;
    if (planId) where.planId = planId;

    const [subs, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, name: true } },
          plan: { select: { id: true, name: true, price: true } },
        },
      }),
      prisma.subscription.count({ where }),
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

const MS_THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

router.delete('/plans/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.plan.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) { next(error); }
});

router.put('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, role } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: updateData });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

router.post('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, role, password } = req.body;
    if (!name) { res.status(400).json({ success: false, error: 'Name is required' }); return; }
    if (!email) { res.status(400).json({ success: false, error: 'Email is required' }); return; }
    if (!password || password.length < 8) { res.status(400).json({ success: false, error: 'Password must be at least 8 characters' }); return; }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(400).json({ success: false, error: 'Email already in use' }); return; }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: role || 'STAFF',
        password: hashedPassword,
        isActive: true,
        isVerified: true,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, isVerified: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
});

router.post('/modules', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, slug, isCore, sortOrder, requiredPlan } = req.body;
    if (!name || !slug) { res.status(400).json({ success: false, error: 'name and slug required' }); return; }
    const mod = await prisma.module.create({ data: { name, slug, isCore: isCore || false, isActive: true, sortOrder: sortOrder || 0, requiredPlan: requiredPlan || null } });
    res.status(201).json({ success: true, data: mod });
  } catch (error) { next(error); }
});

router.delete('/modules/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const mod = await prisma.module.findUnique({ where: { id: req.params.id } });
    if (!mod) { res.status(404).json({ success: false, error: 'Module not found' }); return; }
    if (mod.isCore) { res.status(400).json({ success: false, error: 'Cannot delete core modules' }); return; }
    await prisma.module.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Module deleted' });
  } catch (error) { next(error); }
});

router.put('/businesses/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, isActive, planId } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (planId !== undefined) updateData.planId = planId;
    const business = await prisma.business.update({ where: { id: req.params.id }, data: updateData });
    res.json({ success: true, data: business });
  } catch (error) { next(error); }
});

router.post('/subscriptions/:id/assign-plan', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body;
    if (!planId) { res.status(400).json({ success: false, error: 'planId required' }); return; }
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }
    const sub = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { planId, status: 'ACTIVE', startDate: new Date(), endDate: new Date(Date.now() + MS_THIRTY_DAYS), amount: plan.price },
      include: { plan: true, business: { select: { id: true, name: true } } },
    });
    await prisma.business.update({ where: { id: sub.businessId }, data: { planId } });
    res.json({ success: true, data: sub });
  } catch (error) { next(error); }
});

router.put('/subscriptions/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate && !endDate) {
      res.status(400).json({ success: false, error: 'startDate or endDate required' });
      return;
    }
    const existing = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Subscription not found' }); return; }

    const updateData: any = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) {
      updateData.endDate = new Date(endDate);
      // Automatically re-activate if the new endDate is in the future and sub was expired
      if (new Date(endDate) > new Date() && existing.status === 'EXPIRED') {
        updateData.status = 'ACTIVE';
      }
      // Mark as expired if new endDate is now in the past
      if (new Date(endDate) <= new Date() && (existing.status === 'ACTIVE' || existing.status === 'TRIAL')) {
        updateData.status = 'EXPIRED';
      }
    }

    const sub = await prisma.subscription.update({
      where: { id: req.params.id },
      data: updateData,
      include: { plan: true, business: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: sub });
  } catch (error) { next(error); }
});

// ─── Invoice Templates ─────────────────────────────────────────────────────

router.get('/invoice-templates', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.invoiceTemplate.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
});

router.post('/invoice-templates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, html, css, isDefault, sortOrder } = req.body;
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }
    if (!html) { res.status(400).json({ success: false, error: 'html is required' }); return; }

    if (isDefault) {
      await prisma.invoiceTemplate.updateMany({ data: { isDefault: false } });
    }

    const template = await prisma.invoiceTemplate.create({
      data: { name, html, css: css || null, isDefault: isDefault || false, sortOrder: sortOrder || 0, isActive: true },
    });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
});

router.put('/invoice-templates/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, html, css, isDefault, isActive, sortOrder } = req.body;
    const existing = await prisma.invoiceTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Template not found' }); return; }

    if (isDefault) {
      await prisma.invoiceTemplate.updateMany({ where: { id: { not: req.params.id } }, data: { isDefault: false } });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (html !== undefined) data.html = html;
    if (css !== undefined) data.css = css;
    if (isDefault !== undefined) data.isDefault = isDefault;
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const template = await prisma.invoiceTemplate.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
});

router.delete('/invoice-templates/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.invoiceTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Template not found' }); return; }
    if (existing.isDefault) { res.status(400).json({ success: false, error: 'Cannot delete the default template' }); return; }
    await prisma.invoiceTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) { next(error); }
});

router.post('/invoice-templates/:id/set-default', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.invoiceTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Template not found' }); return; }
    await prisma.invoiceTemplate.updateMany({ data: { isDefault: false } });
    const template = await prisma.invoiceTemplate.update({ where: { id: req.params.id }, data: { isDefault: true } });
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
});

export default router;
