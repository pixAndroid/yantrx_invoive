import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '@yantrix/billing';
import prisma from '../utils/prisma';

const router = Router();

router.post('/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const body = req.body as Buffer;

    if (!verifyWebhookSignature(body.toString(), signature, webhookSecret)) {
      res.status(400).json({ success: false, error: 'Invalid webhook signature' });
      return;
    }

    const event = JSON.parse(body.toString());
    const { event: eventType, payload } = event;

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = payload.payment.entity;
        const invoiceId = paymentEntity.notes?.invoiceId;

        if (invoiceId) {
          const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
          if (invoice) {
            await prisma.payment.create({
              data: {
                invoiceId,
                businessId: invoice.businessId,
                amount: paymentEntity.amount / 100,
                method: 'RAZORPAY',
                status: 'SUCCESS',
                razorpayId: paymentEntity.id,
                razorpayOrderId: paymentEntity.order_id,
                paidAt: new Date(paymentEntity.created_at * 1000),
              },
            });

            await prisma.invoice.update({
              where: { id: invoiceId },
              data: {
                amountPaid: { increment: paymentEntity.amount / 100 },
                status: 'PAID',
                isPaid: true,
                paidAt: new Date(),
              },
            });
          }
        }
        break;
      }

      case 'subscription.activated': {
        const sub = payload.subscription.entity;
        await prisma.subscription.updateMany({
          where: { razorpaySubId: sub.id },
          data: { status: 'ACTIVE' },
        });
        break;
      }

      case 'subscription.cancelled': {
        const sub = payload.subscription.entity;
        await prisma.subscription.updateMany({
          where: { razorpaySubId: sub.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        break;
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
