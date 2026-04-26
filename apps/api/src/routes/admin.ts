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
    const { isActive, sortOrder } = req.body;
    const data: { isActive?: boolean; sortOrder?: number } = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const mod = await prisma.module.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: mod });
  } catch (error) { next(error); }
});

/** Returns endDate and amount based on the plan's billing period. */
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
    const { endDate: planEndDate, amount: planAmount } = getPlanBillingDetails(plan);
    const sub = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { planId, status: 'ACTIVE', startDate: new Date(), endDate: planEndDate, amount: planAmount },
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

// ─── Tools CMS ────────────────────────────────────────────────────────────

router.get('/tools', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const visibility = req.query.visibility as string;
    const toolType = req.query.toolType as string;
    const featured = req.query.featured as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { shortDescription: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (toolType) where.toolType = toolType;
    if (featured !== undefined && featured !== '') where.featured = featured === 'true';

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.tool.count({ where }),
    ]);

    res.json({
      success: true,
      data: tools,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.get('/tools/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tool = await prisma.tool.findUnique({ where: { id: req.params.id } });
    if (!tool) { res.status(404).json({ success: false, error: 'Tool not found' }); return; }
    res.json({ success: true, data: tool });
  } catch (error) { next(error); }
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

router.post('/tools', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, slug, shortDescription, fullDescription, logoUrl, bannerUrl, screenshots,
      category, tags, status, visibility, featured, toolType, internalRoute, externalUrl,
      customHtml, customCss, customJs, ctaText, ctaUrl, pricingType, seoTitle, seoDescription,
      sortOrder,
    } = req.body;

    if (!title) { res.status(400).json({ success: false, error: 'title is required' }); return; }

    const finalSlug = (slug || generateSlug(title)).toLowerCase().replace(/\s+/g, '-');

    const existing = await prisma.tool.findUnique({ where: { slug: finalSlug } });
    if (existing) { res.status(400).json({ success: false, error: 'A tool with this slug already exists' }); return; }

    const tool = await prisma.tool.create({
      data: {
        title,
        slug: finalSlug,
        shortDescription: shortDescription || null,
        fullDescription: fullDescription || null,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
        screenshots: screenshots || [],
        category: category || null,
        tags: tags || [],
        status: status || 'DRAFT',
        visibility: visibility || 'PUBLIC',
        featured: featured || false,
        toolType: toolType || 'INTERNAL_APP',
        internalRoute: internalRoute || null,
        externalUrl: externalUrl || null,
        customHtml: customHtml || null,
        customCss: customCss || null,
        customJs: customJs || null,
        ctaText: ctaText || null,
        ctaUrl: ctaUrl || null,
        pricingType: pricingType || 'FREE',
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        sortOrder: sortOrder != null ? parseInt(sortOrder) : 0,
        createdBy: req.user?.id || null,
      },
    });

    res.status(201).json({ success: true, data: tool });
  } catch (error) { next(error); }
});

router.put('/tools/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.tool.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Tool not found' }); return; }

    const allowedFields = [
      'title', 'slug', 'shortDescription', 'fullDescription', 'logoUrl', 'bannerUrl',
      'screenshots', 'category', 'tags', 'status', 'visibility', 'featured', 'toolType',
      'internalRoute', 'externalUrl', 'customHtml', 'customCss', 'customJs', 'ctaText',
      'ctaUrl', 'pricingType', 'seoTitle', 'seoDescription', 'sortOrder',
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }
    if (data.sortOrder !== undefined) data.sortOrder = parseInt(data.sortOrder);

    // System tools: prevent slug changes, unpublishing, or making private
    if (existing.isSystem) {
      if (data.slug && data.slug !== existing.slug) {
        res.status(403).json({ success: false, error: 'Cannot change slug of a system tool' });
        return;
      }
      if (data.status && data.status !== 'PUBLISHED') {
        res.status(403).json({ success: false, error: 'System tools must remain published' });
        return;
      }
      if (data.visibility && data.visibility !== 'PUBLIC') {
        res.status(403).json({ success: false, error: 'System tools must remain public' });
        return;
      }
    }

    // If slug is being changed, check for uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.tool.findUnique({ where: { slug: data.slug } });
      if (slugConflict) { res.status(400).json({ success: false, error: 'A tool with this slug already exists' }); return; }
    }

    const tool = await prisma.tool.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: tool });
  } catch (error) { next(error); }
});

router.delete('/tools/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.tool.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Tool not found' }); return; }
    if (existing.isSystem) { res.status(403).json({ success: false, error: 'System tools cannot be deleted' }); return; }
    await prisma.tool.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Tool deleted' });
  } catch (error) { next(error); }
});

router.post('/tools/:id/duplicate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const original = await prisma.tool.findUnique({ where: { id: req.params.id } });
    if (!original) { res.status(404).json({ success: false, error: 'Tool not found' }); return; }

    // Generate a unique slug for the copy
    let newSlug = `${original.slug}-copy`;
    let counter = 1;
    while (await prisma.tool.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${original.slug}-copy-${counter++}`;
    }

    const { id, createdAt, updatedAt, viewCount, clickCount, ...rest } = original;
    const duplicate = await prisma.tool.create({
      data: {
        ...rest,
        slug: newSlug,
        title: `${original.title} (Copy)`,
        status: 'DRAFT',
        createdBy: req.user?.id || null,
      },
    });
    res.status(201).json({ success: true, data: duplicate });
  } catch (error) { next(error); }
});

// ─── Contact Enquiries ────────────────────────────────────────────────────

router.get('/enquiries', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { subject: { contains: search, mode: 'insensitive' as const } },
        { message: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [enquiries, total] = await Promise.all([
      prisma.contactEnquiry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contactEnquiry.count({ where }),
    ]);

    res.json({
      success: true,
      data: enquiries,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.put('/enquiries/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const enquiry = await prisma.contactEnquiry.findUnique({ where: { id: req.params.id } });
    if (!enquiry) { res.status(404).json({ success: false, error: 'Enquiry not found' }); return; }
    const updated = await prisma.contactEnquiry.update({
      where: { id: req.params.id },
      data: { status: 'READ' },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.put('/enquiries/:id/replied', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const enquiry = await prisma.contactEnquiry.findUnique({ where: { id: req.params.id } });
    if (!enquiry) { res.status(404).json({ success: false, error: 'Enquiry not found' }); return; }
    const updated = await prisma.contactEnquiry.update({
      where: { id: req.params.id },
      data: { status: 'REPLIED' },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.delete('/enquiries/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const enquiry = await prisma.contactEnquiry.findUnique({ where: { id: req.params.id } });
    if (!enquiry) { res.status(404).json({ success: false, error: 'Enquiry not found' }); return; }
    await prisma.contactEnquiry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (error) { next(error); }
});

// ─── Home Page Header Config ──────────────────────────────────────────────

const HOME_HEADER_KEY = 'home_header';

router.get('/settings/home-header', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: HOME_HEADER_KEY } });
    res.json({ success: true, data: config ?? { key: HOME_HEADER_KEY } });
  } catch (error) { next(error); }
});

router.put('/settings/home-header', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const ALLOWED_FIELDS = [
      'badgeText', 'titleLine1', 'titleGradientText', 'description',
      'primaryBtnLabel', 'secondaryBtnLabel',
      'stat1Value', 'stat1Label', 'stat2Value', 'stat2Label', 'stat3Value', 'stat3Label',
    ];

    const data: Record<string, string | null> = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field] ?? null;
      }
    }

    const config = await prisma.siteConfig.upsert({
      where: { key: HOME_HEADER_KEY },
      create: { key: HOME_HEADER_KEY, ...data },
      update: data,
    });
    res.json({ success: true, data: config });
  } catch (error) { next(error); }
});

// ─── About Page Stats Config ──────────────────────────────────────────────

const ABOUT_STATS_KEY = 'about_stats';

const ABOUT_STATS_DEFAULTS = {
  stat1Value: '10+',
  stat1Label: 'Products Built',
  stat2Value: '500+',
  stat2Label: 'Businesses Served',
  stat3Value: '5+',
  stat3Label: 'Industries Covered',
  stat4Value: '3+',
  stat4Label: 'Years Building',
};

router.get('/settings/about-stats', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: ABOUT_STATS_KEY } });
    res.json({ success: true, data: config ?? { key: ABOUT_STATS_KEY, ...ABOUT_STATS_DEFAULTS } });
  } catch (error) { next(error); }
});

router.put('/settings/about-stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const ALLOWED_FIELDS = [
      'stat1Value', 'stat1Label', 'stat2Value', 'stat2Label',
      'stat3Value', 'stat3Label', 'stat4Value', 'stat4Label',
    ];

    const data: Record<string, string | null> = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field] ?? null;
      }
    }

    const config = await prisma.siteConfig.upsert({
      where: { key: ABOUT_STATS_KEY },
      create: { key: ABOUT_STATS_KEY, ...data },
      update: data,
    });
    res.json({ success: true, data: config });
  } catch (error) { next(error); }
});

// ─── Team Members Settings ────────────────────────────────────────────────

router.get('/settings/team-members', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: members });
  } catch (error) { next(error); }
});

router.post('/settings/team-members', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, role, bio, imageUrl, displayOrder } = req.body;
    if (!name || !role || !bio) {
      res.status(400).json({ success: false, error: 'name, role, and bio are required' });
      return;
    }
    const member = await prisma.teamMember.create({
      data: {
        name: String(name),
        role: String(role),
        bio: String(bio),
        imageUrl: imageUrl ? String(imageUrl) : null,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      },
    });
    res.json({ success: true, data: member });
  } catch (error) { next(error); }
});

router.put('/settings/team-members/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, role, bio, imageUrl, displayOrder, isActive } = req.body;
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = String(name);
    if (role !== undefined) data.role = String(role);
    if (bio !== undefined) data.bio = String(bio);
    if (imageUrl !== undefined) data.imageUrl = imageUrl ? String(imageUrl) : null;
    if (displayOrder !== undefined) data.displayOrder = Number(displayOrder);
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    const member = await prisma.teamMember.update({ where: { id }, data });
    res.json({ success: true, data: member });
  } catch (error) { next(error); }
});

router.delete('/settings/team-members/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.teamMember.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ─── Contact Details Settings ─────────────────────────────────────────────

const CONTACT_DETAILS_KEY = 'contact_details';

const CONTACT_DETAILS_DEFAULTS = {
  contactEmail: 'support@yantrix.in',
  contactPhone: '+91 80 4567 8900',
  contactPhoneHref: 'tel:+918045678900',
  officeCompanyName: 'Yantrix Technologies Pvt. Ltd.',
  officeFloor: '4th Floor, Innovate Hub',
  officeStreet: '80 Feet Road, Koramangala',
  officeCity: 'Bengaluru',
  officeState: 'Karnataka 560034',
  officePinCode: '',
  officeCountry: 'India',
  officeWebsite: 'yantrix.in',
  hoursMondayFriday: '9 AM – 8 PM IST',
  hoursSaturday: '10 AM – 6 PM IST',
  hoursSunday: 'Email only',
  hoursNote: 'Extended support hours during GST filing deadlines (20th – 22nd of each month).',
};

router.get('/settings/contact', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: CONTACT_DETAILS_KEY } });
    res.json({ success: true, data: config ?? { key: CONTACT_DETAILS_KEY, ...CONTACT_DETAILS_DEFAULTS } });
  } catch (error) { next(error); }
});

router.put('/settings/contact', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const ALLOWED_FIELDS = [
      'contactEmail', 'contactPhone', 'contactPhoneHref',
      'officeCompanyName', 'officeFloor', 'officeStreet', 'officeCity',
      'officeState', 'officePinCode', 'officeCountry', 'officeWebsite',
      'hoursMondayFriday', 'hoursSaturday', 'hoursSunday', 'hoursNote',
    ];

    const data: Record<string, string | null> = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field] ?? null;
      }
    }

    const config = await prisma.siteConfig.upsert({
      where: { key: CONTACT_DETAILS_KEY },
      create: { key: CONTACT_DETAILS_KEY, ...data },
      update: data,
    });
    res.json({ success: true, data: config });
  } catch (error) { next(error); }
});

export default router;
