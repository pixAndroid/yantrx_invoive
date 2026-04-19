import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

// ─── CRM Dashboard ──────────────────────────────────────────────────────────

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalLeads, newLeadsThisMonth, wonLeads, lostLeads, totalDeals, openDeals, totalDealValue, recentLeads, recentActivities] = await Promise.all([
      prisma.lead.count({ where: { businessId } }),
      prisma.lead.count({ where: { businessId, createdAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { businessId, status: 'WON' } }),
      prisma.lead.count({ where: { businessId, status: 'LOST' } }),
      prisma.deal.count({ where: { businessId } }),
      prisma.deal.count({ where: { businessId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } }),
      prisma.deal.aggregate({ where: { businessId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } }, _sum: { value: true } }),
      prisma.lead.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.cRMActivity.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 5, include: { lead: { select: { name: true } }, deal: { select: { title: true } } } }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: { businessId },
      _count: true,
    });

    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      where: { businessId },
      _count: true,
      _sum: { value: true },
    });

    res.json({
      success: true,
      data: {
        totalLeads,
        newLeadsThisMonth,
        wonLeads,
        lostLeads,
        conversionRate,
        totalDeals,
        openDeals,
        openDealValue: totalDealValue._sum.value || 0,
        leadsByStatus: leadsByStatus.map(l => ({ status: l.status, count: l._count })),
        dealsByStage: dealsByStage.map(d => ({ stage: d.stage, count: d._count, value: d._sum.value || 0 })),
        recentLeads,
        recentActivities,
      },
    });
  } catch (error) { next(error); }
});

// ─── Leads ───────────────────────────────────────────────────────────────────

router.get('/leads', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { search, status, source, limit = '100', page = '1' } = req.query;
    const take = Math.min(parseInt(limit as string) || 100, 200);
    const skip = (parseInt(page as string) - 1) * take;
    const where: any = { businessId };

    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { _count: { select: { activities: true, deals: true } } },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ success: true, data: leads, meta: { total, page: parseInt(page as string), limit: take } });
  } catch (error) { next(error); }
});

router.post('/leads', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { name, email, phone, company, source, status, value, notes, tags, expectedCloseDate } = req.body;
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }

    const lead = await prisma.lead.create({
      data: {
        businessId,
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: source || 'OTHER',
        status: status || 'NEW',
        value: value ? parseFloat(value) : null,
        notes: notes || null,
        tags: tags || [],
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      },
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) { next(error); }
});

router.get('/leads/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, businessId },
      include: {
        activities: { orderBy: { createdAt: 'desc' } },
        deals: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) { res.status(404).json({ success: false, error: 'Lead not found' }); return; }
    res.json({ success: true, data: lead });
  } catch (error) { next(error); }
});

router.put('/leads/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.lead.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Lead not found' }); return; }

    const { name, email, phone, company, source, status, value, notes, tags, expectedCloseDate } = req.body;

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        company: company !== undefined ? company : existing.company,
        source: source ?? existing.source,
        status: status ?? existing.status,
        value: value !== undefined ? (value ? parseFloat(value) : null) : existing.value,
        notes: notes !== undefined ? notes : existing.notes,
        tags: tags ?? existing.tags,
        expectedCloseDate: expectedCloseDate !== undefined ? (expectedCloseDate ? new Date(expectedCloseDate) : null) : existing.expectedCloseDate,
        convertedAt: status === 'WON' && existing.status !== 'WON' ? new Date() : existing.convertedAt,
      },
    });

    res.json({ success: true, data: lead });
  } catch (error) { next(error); }
});

router.delete('/leads/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.lead.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Lead not found' }); return; }

    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) { next(error); }
});

// ─── Deals ───────────────────────────────────────────────────────────────────

router.get('/deals', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { stage, leadId } = req.query;
    const where: any = { businessId };
    if (stage) where.stage = stage;
    if (leadId) where.leadId = leadId;

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        lead: { select: { id: true, name: true, company: true } },
        _count: { select: { activities: true } },
      },
    });

    res.json({ success: true, data: deals });
  } catch (error) { next(error); }
});

router.post('/deals', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { title, leadId, value, stage, probability, expectedCloseDate, notes } = req.body;
    if (!title) { res.status(400).json({ success: false, error: 'title is required' }); return; }

    if (leadId) {
      const lead = await prisma.lead.findFirst({ where: { id: leadId, businessId } });
      if (!lead) { res.status(404).json({ success: false, error: 'Lead not found' }); return; }
    }

    const deal = await prisma.deal.create({
      data: {
        businessId,
        title,
        leadId: leadId || null,
        value: value ? parseFloat(value) : null,
        stage: stage || 'PROSPECTING',
        probability: probability ? parseInt(probability) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes: notes || null,
      },
    });

    res.status(201).json({ success: true, data: deal });
  } catch (error) { next(error); }
});

router.put('/deals/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.deal.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Deal not found' }); return; }

    const { title, leadId, value, stage, probability, expectedCloseDate, notes } = req.body;

    const isClosed = stage && ['CLOSED_WON', 'CLOSED_LOST'].includes(stage);
    const wasClosed = ['CLOSED_WON', 'CLOSED_LOST'].includes(existing.stage);

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        title: title ?? existing.title,
        leadId: leadId !== undefined ? leadId : existing.leadId,
        value: value !== undefined ? (value ? parseFloat(value) : null) : existing.value,
        stage: stage ?? existing.stage,
        probability: probability !== undefined ? parseInt(probability) : existing.probability,
        expectedCloseDate: expectedCloseDate !== undefined ? (expectedCloseDate ? new Date(expectedCloseDate) : null) : existing.expectedCloseDate,
        closedAt: isClosed && !wasClosed ? new Date() : existing.closedAt,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    res.json({ success: true, data: deal });
  } catch (error) { next(error); }
});

router.delete('/deals/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.deal.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Deal not found' }); return; }

    await prisma.deal.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deal deleted' });
  } catch (error) { next(error); }
});

// ─── Activities ───────────────────────────────────────────────────────────────

router.get('/activities', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { leadId, dealId, type, limit = '50', page = '1' } = req.query;
    const take = Math.min(parseInt(limit as string) || 50, 200);
    const skip = (parseInt(page as string) - 1) * take;
    const where: any = { businessId };

    if (leadId) where.leadId = leadId;
    if (dealId) where.dealId = dealId;
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      prisma.cRMActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          lead: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      prisma.cRMActivity.count({ where }),
    ]);

    res.json({ success: true, data: activities, meta: { total, page: parseInt(page as string), limit: take } });
  } catch (error) { next(error); }
});

router.post('/activities', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { type, subject, description, leadId, dealId, dueDate } = req.body;
    if (!subject) { res.status(400).json({ success: false, error: 'subject is required' }); return; }

    const activity = await prisma.cRMActivity.create({
      data: {
        businessId,
        type: type || 'NOTE',
        subject,
        description: description || null,
        leadId: leadId || null,
        dealId: dealId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.user!.id,
      },
    });

    res.status(201).json({ success: true, data: activity });
  } catch (error) { next(error); }
});

router.patch('/activities/:id/complete', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.cRMActivity.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Activity not found' }); return; }

    const activity = await prisma.cRMActivity.update({
      where: { id: req.params.id },
      data: { completedAt: new Date() },
    });

    res.json({ success: true, data: activity });
  } catch (error) { next(error); }
});

export default router;
