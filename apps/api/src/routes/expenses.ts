import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

// GET /expenses — list with optional filters
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { category, startDate, endDate, search, limit = '100', page = '1' } = req.query;
    const take = Math.min(parseInt(limit as string) || 100, 200);
    const skip = (parseInt(page as string) - 1) * take;

    const where: any = { businessId };
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { vendor: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { date: 'desc' }, take, skip }),
      prisma.expense.count({ where }),
    ]);

    res.json({ success: true, data: expenses, meta: { total, page: parseInt(page as string), limit: take } });
  } catch (error) { next(error); }
});

// GET /expenses/stats — summary stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth, total, byCategory] = await Promise.all([
      prisma.expense.aggregate({ where: { businessId, date: { gte: startOfMonth } }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { businessId, date: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { businessId }, _sum: { amount: true }, _count: true }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { businessId },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalAmount: total._sum.amount || 0,
        totalCount: total._count,
        thisMonthAmount: thisMonth._sum.amount || 0,
        thisMonthCount: thisMonth._count,
        lastMonthAmount: lastMonth._sum.amount || 0,
        byCategory: byCategory.map(c => ({ category: c.category, amount: c._sum.amount || 0, count: c._count })),
      },
    });
  } catch (error) { next(error); }
});

// POST /expenses — create
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { category, amount, description, date, vendor, gstAmount, isReimbursable, tags, receipt } = req.body;
    if (!category || !amount || parseFloat(amount) <= 0) {
      res.status(400).json({ success: false, error: 'category and a positive amount are required' });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        businessId,
        category,
        amount: parseFloat(amount),
        description: description || null,
        date: date ? new Date(date) : new Date(),
        vendor: vendor || null,
        gstAmount: gstAmount ? parseFloat(gstAmount) : null,
        isReimbursable: isReimbursable === true || isReimbursable === 'true',
        tags: tags || [],
        receipt: receipt || null,
      },
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) { next(error); }
});

// PUT /expenses/:id — update
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Expense not found' }); return; }

    const { category, amount, description, date, vendor, gstAmount, isReimbursable, tags, receipt } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        category: category ?? existing.category,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        description: description !== undefined ? description : existing.description,
        date: date ? new Date(date) : existing.date,
        vendor: vendor !== undefined ? vendor : existing.vendor,
        gstAmount: gstAmount !== undefined ? parseFloat(gstAmount) : existing.gstAmount,
        isReimbursable: isReimbursable !== undefined ? (isReimbursable === true || isReimbursable === 'true') : existing.isReimbursable,
        tags: tags ?? existing.tags,
        receipt: receipt !== undefined ? receipt : existing.receipt,
      },
    });

    res.json({ success: true, data: expense });
  } catch (error) { next(error); }
});

// DELETE /expenses/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Expense not found' }); return; }

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) { next(error); }
});

export default router;
