import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }
    const payments = await prisma.payment.findMany({
      where: { businessId },
      include: { invoice: { select: { invoiceNumber: true, customer: { select: { name: true } } } } },
      orderBy: { paidAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch (error) { next(error); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { invoiceId, amount, method, transactionRef, notes, paidAt } = req.body;

    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, businessId } });
    if (!invoice) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }

    const payment = await prisma.payment.create({
      data: { invoiceId, businessId, amount, method: method || 'CASH', status: 'SUCCESS', transactionRef, notes, paidAt: paidAt ? new Date(paidAt) : new Date() },
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error) { next(error); }
});

export default router;
