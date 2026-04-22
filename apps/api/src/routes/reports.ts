import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenueData,
      lastMonthRevenueData,
      invoicesThisMonth,
      invoicesLastMonth,
      totalCustomers,
      newCustomersThisMonth,
      pendingInvoices,
      overdueInvoices,
      recentInvoices,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { businessId, isPaid: true },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { businessId, isPaid: true, paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { total: true },
      }),
      prisma.invoice.count({ where: { businessId, createdAt: { gte: startOfMonth } } }),
      prisma.invoice.count({ where: { businessId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.customer.count({ where: { businessId, isActive: true } }),
      prisma.customer.count({ where: { businessId, createdAt: { gte: startOfMonth } } }),
      prisma.invoice.aggregate({
        where: { businessId, status: 'SENT' },
        _sum: { amountDue: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { businessId, status: 'OVERDUE' },
        _sum: { amountDue: true },
        _count: true,
      }),
      prisma.invoice.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
      prisma.$queryRaw<Array<{ month: string; revenue: number; invoices: bigint }>>`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
          COALESCE(SUM(total), 0)::float as revenue,
          COUNT(*)::bigint as invoices
        FROM invoices
        WHERE "businessId" = ${businessId}
          AND EXTRACT(YEAR FROM "createdAt") = EXTRACT(YEAR FROM NOW())
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `,
    ]);

    const totalRevenue = totalRevenueData._sum.total || 0;
    const lastMonthRevenue = lastMonthRevenueData._sum.total || 0;
    const revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const invoicesGrowth = invoicesLastMonth > 0 ? ((invoicesThisMonth - invoicesLastMonth) / invoicesLastMonth) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalRevenueGrowth: Math.round(revenueGrowth),
        invoicesCount: invoicesThisMonth,
        invoicesGrowth: Math.round(invoicesGrowth),
        customersCount: totalCustomers,
        customersGrowth: newCustomersThisMonth,
        pendingAmount: pendingInvoices._sum.amountDue || 0,
        pendingCount: pendingInvoices._count,
        overdueAmount: overdueInvoices._sum.amountDue || 0,
        overdueCount: overdueInvoices._count,
        recentInvoices,
        monthlyRevenue: monthlyRevenue.map(r => ({ ...r, invoices: Number(r.invoices) })),
      },
    });
  } catch (error) { next(error); }
});

router.get('/gst-summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { month, year } = req.query;
    const targetYear = parseInt(year as string || String(new Date().getFullYear()));
    const targetMonth = parseInt(month as string || String(new Date().getMonth() + 1));

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const invoices = await prisma.invoice.findMany({
      where: {
        businessId,
        issueDate: { gte: startDate, lte: endDate },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      include: { customer: true, items: true },
    });

    const summary = invoices.reduce(
      (acc, inv) => ({
        totalSales: acc.totalSales + inv.total,
        totalCgst: acc.totalCgst + inv.cgstTotal,
        totalSgst: acc.totalSgst + inv.sgstTotal,
        totalIgst: acc.totalIgst + inv.igstTotal,
        netGstLiability: acc.netGstLiability + inv.gstTotal,
      }),
      { totalSales: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, netGstLiability: 0 }
    );

    const b2bInvoices = invoices.filter(inv => inv.customer.gstin);
    const b2cInvoices = invoices.filter(inv => !inv.customer.gstin);

    res.json({
      success: true,
      data: {
        period: `${targetMonth}/${targetYear}`,
        ...summary,
        totalInvoices: invoices.length,
        b2bCount: b2bInvoices.length,
        b2cCount: b2cInvoices.length,
        b2bInvoices,
        b2cInvoices,
      },
    });
  } catch (error) { next(error); }
});

router.get('/sales', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const invoices = await prisma.invoice.findMany({
      where: { businessId, issueDate: { gte: start, lte: end }, status: { notIn: ['CANCELLED', 'DRAFT'] } },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { issueDate: 'desc' },
    });

    const summary = invoices.reduce((acc, inv) => ({
      totalSales: acc.totalSales + inv.total,
      totalPaid: acc.totalPaid + inv.amountPaid,
      totalDue: acc.totalDue + inv.amountDue,
      count: acc.count + 1,
    }), { totalSales: 0, totalPaid: 0, totalDue: 0, count: 0 });

    res.json({ success: true, data: { invoices, ...summary } });
  } catch (error) { next(error); }
});

const MS_PER_DAY = 86400000;

router.get('/pending-payments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const invoices = await prisma.invoice.findMany({
      where: { businessId, amountDue: { gt: 0 }, status: { notIn: ['CANCELLED', 'DRAFT', 'PAID'] } },
      include: { customer: { select: { id: true, name: true, phone: true, email: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const data = invoices.map(inv => ({
      ...inv,
      daysOverdue: inv.dueDate ? Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / MS_PER_DAY)) : 0,
    }));

    const totalPending = data.reduce((s, i) => s + i.amountDue, 0);
    res.json({ success: true, data: { invoices: data, totalPending, count: data.length } });
  } catch (error) { next(error); }
});

router.get('/customer-sales', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const data = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: { businessId, issueDate: { gte: start, lte: end }, status: { notIn: ['CANCELLED', 'DRAFT'] } },
      _sum: { total: true, amountPaid: true, amountDue: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
    });

    const customerIds = data.map(d => d.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true, phone: true },
    });
    const custMap = Object.fromEntries(customers.map(c => [c.id, c]));

    const result = data.map(d => ({
      customer: custMap[d.customerId],
      totalSales: d._sum.total || 0,
      totalPaid: d._sum.amountPaid || 0,
      totalDue: d._sum.amountDue || 0,
      invoiceCount: d._count.id,
    }));

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/top-customers', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }
    const limit = parseInt(req.query.limit as string || '10');

    const data = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: { businessId, status: { notIn: ['CANCELLED', 'DRAFT'] } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    const customerIds = data.map(d => d.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true },
    });
    const custMap = Object.fromEntries(customers.map(c => [c.id, c]));

    const result = data.map((d, idx) => ({
      rank: idx + 1,
      customer: custMap[d.customerId],
      totalRevenue: d._sum.total || 0,
      invoiceCount: d._count.id,
    }));

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

export default router;
