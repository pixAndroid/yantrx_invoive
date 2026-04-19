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
    if (!invoiceId || !amount || parseFloat(amount) <= 0) {
      res.status(400).json({ success: false, error: 'invoiceId and a positive amount are required' });
      return;
    }

    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, businessId } });
    if (!invoice) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }

    const paymentAmount = parseFloat(amount);

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: { invoiceId, businessId, amount: paymentAmount, method: method || 'CASH', status: 'SUCCESS', transactionRef: transactionRef || null, notes: notes || null, paidAt: paidAt ? new Date(paidAt) : new Date() },
      });

      const newAmountPaid = invoice.amountPaid + paymentAmount;
      const newAmountDue = Math.max(0, invoice.total - newAmountPaid);
      const isPaid = newAmountDue <= 0;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: isPaid ? 'PAID' : 'PARTIALLY_PAID',
          isPaid,
          paidAt: isPaid ? new Date() : null,
        },
      });

      return p;
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) { next(error); }
});

export default router;
