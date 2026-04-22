import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { calculateTax } from '@yantrix/billing';

const router = Router();
router.use(authenticate);

router.get('/templates', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.invoiceTemplate.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, html: true, thumbnail: true, isDefault: true },
    });
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
});

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const where = {
      businessId,
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
          { customer: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
      ...(status && { status: status as any }),
      ...(type && { type: type as any }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true, email: true } }, _count: { select: { items: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: invoices,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.post('/', [
  body('customerId').notEmpty().withMessage('Customer required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.description').notEmpty().withMessage('Item description required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity required'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Valid price required'),
], validate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { customerId, branchId, type, issueDate, dueDate, items, discountType, discountValue, isInterState, placeOfSupply, notes, terms } = req.body;

    // Verify customer belongs to business
    const customer = await prisma.customer.findFirst({ where: { id: customerId, businessId } });
    if (!customer) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }

    // Get next invoice number
    const business = await prisma.business.findUnique({ where: { id: businessId }, include: { plan: true } });
    if (!business) { res.status(404).json({ success: false, error: 'Business not found' }); return; }

    // Enforce invoice limit per plan
    if (business.plan && business.plan.invoiceLimit > 0) {
      // Use the active subscription's startDate as the billing-period start so that
      // upgrading a plan resets the invoice count immediately.
      let activeSub = await prisma.subscription.findFirst({
        where: { businessId, status: { in: ['ACTIVE', 'TRIAL'] } },
        orderBy: { startDate: 'desc' },
      });
      const now = new Date();

      // Auto-expire subscription when endDate has passed
      if (activeSub && activeSub.endDate < now) {
        await prisma.subscription.update({ where: { id: activeSub.id }, data: { status: 'EXPIRED' } });
        activeSub = null;
      }

      if (!activeSub) {
        // No active subscription — fall back to the free/lowest-tier plan limits
        // so that users can still create invoices within those limits instead of
        // being completely blocked.
        const freePlan =
          (await prisma.plan.findUnique({ where: { slug: 'free' } })) ??
          (await prisma.plan.findFirst({ where: { price: 0 }, orderBy: { price: 'asc' } }));
        if (!freePlan || freePlan.invoiceLimit <= 0) {
          res.status(403).json({
            success: false,
            error: 'Your subscription has expired. Please renew your plan to create invoices.',
          });
          return;
        }
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const invoicesThisPeriod = await prisma.invoice.count({
          where: { businessId, createdAt: { gte: periodStart } },
        });
        if (invoicesThisPeriod >= freePlan.invoiceLimit) {
          res.status(403).json({
            success: false,
            error: `Invoice limit reached. Your subscription has expired and free tier allows ${freePlan.invoiceLimit} invoice${freePlan.invoiceLimit === 1 ? '' : 's'} per month. Please renew your plan to create more invoices.`,
          });
          return;
        }
      } else {
        const periodStart = activeSub.startDate;
        const invoicesThisPeriod = await prisma.invoice.count({
          where: { businessId, createdAt: { gte: periodStart } },
        });
        if (invoicesThisPeriod >= business.plan.invoiceLimit) {
          const periodLabel = (() => { const s = business.plan.slug.toLowerCase(); return s === 'daily' ? 'day' : s === 'yearly' ? 'year' : 'month'; })();
          res.status(403).json({
            success: false,
            error: `Invoice limit reached. Your ${business.plan.name} plan allows ${business.plan.invoiceLimit} invoice${business.plan.invoiceLimit === 1 ? '' : 's'} per ${periodLabel}. Please upgrade to create more invoices.`,
          });
          return;
        }
      }
    }

    const invoiceNumber = `${business.invoicePrefix}-${String(business.invoiceSeq).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let cessTotal = 0;

    const processedItems = items.map((item: any, idx: number) => {
      const itemSubtotal = item.quantity * item.price;
      const itemDiscount = (item.discount || 0);
      const taxableAmount = itemSubtotal - itemDiscount;
      const tax = calculateTax(taxableAmount, item.gstRate || 0, item.cessRate || 0, isInterState || false);

      subtotal += itemSubtotal;
      cgstTotal += tax.cgst;
      sgstTotal += tax.sgst;
      igstTotal += tax.igst;
      cessTotal += tax.cess;

      return {
        productId: item.productId || null,
        description: item.description,
        hsnSac: item.hsnSac || null,
        quantity: item.quantity,
        unit: item.unit || null,
        price: item.price,
        discount: itemDiscount,
        taxableAmount,
        gstRate: item.gstRate || 0,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        cess: tax.cess,
        total: tax.total,
        sortOrder: idx,
      };
    });

    // Apply invoice-level discount
    let discountTotal = 0;
    if (discountType && discountValue) {
      discountTotal = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
    }

    const taxableAmount = subtotal - discountTotal;
    const gstTotal = cgstTotal + sgstTotal + igstTotal + cessTotal;
    const total = taxableAmount + gstTotal;

    // Auto-resolve or create products for items without a productId
    for (const item of processedItems) {
      if (!item.productId && item.description.trim()) {
        const existing = await prisma.product.findFirst({
          where: { businessId, name: { equals: item.description.trim(), mode: 'insensitive' }, isActive: true },
        });
        if (existing) {
          item.productId = existing.id;
        } else {
          const newProduct = await prisma.product.create({
            data: {
              businessId,
              name: item.description.trim(),
              price: item.price,
              gstRate: item.gstRate || 0,
              hsnSac: item.hsnSac || null,
              unit: (item.unit as any) || 'PCS',
            },
          });
          item.productId = newProduct.id;
        }
      }
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          businessId,
          customerId,
          branchId: branchId || null,
          invoiceNumber,
          type: type || 'INVOICE',
          status: 'DRAFT',
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          subtotal,
          discountType: discountType || null,
          discountValue: discountValue || null,
          discountTotal,
          taxableAmount,
          cgstTotal,
          sgstTotal,
          igstTotal,
          cessTotal,
          gstTotal,
          total,
          amountPaid: 0,
          amountDue: total,
          isInterState: isInterState || false,
          placeOfSupply: placeOfSupply || null,
          notes: notes || null,
          terms: terms || business.termsAndConditions || null,
          createdById: req.user!.id,
          items: { create: processedItems },
        },
        include: { customer: true, items: { include: { product: true } } },
      });

      // Increment invoice sequence
      await tx.business.update({
        where: { id: businessId },
        data: { invoiceSeq: { increment: 1 } },
      });

      return inv;
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) { next(error); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
      include: {
        customer: true,
        branch: true,
        business: { select: { id: true, name: true, gstin: true, address: true, city: true, state: true, phone: true, email: true, logo: true } },
        items: { include: { product: true }, orderBy: { sortOrder: 'asc' } },
        payments: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!invoice) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
    });
    if (!existing) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }

    if (['PAID', 'CANCELLED'].includes(existing.status)) {
      res.status(400).json({ success: false, error: `Cannot edit a ${existing.status.toLowerCase()} invoice` });
      return;
    }

    const { customerId, type, issueDate, dueDate, items, discountType, discountValue, isInterState, placeOfSupply, notes, terms } = req.body;

    // Verify customer belongs to business
    if (customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: customerId, businessId: req.user!.businessId! } });
      if (!customer) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }
    }

    // Recalculate totals from items
    let subtotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0, cessTotal = 0;
    const interState = isInterState ?? existing.isInterState;

    const processedItems = (items || []).map((item: any, idx: number) => {
      const itemSubtotal = (item.quantity || 1) * (item.price || 0);
      const itemDiscount = (item.discount || 0);
      const taxableAmount = itemSubtotal - itemDiscount;
      const tax = calculateTax(taxableAmount, item.gstRate || 0, item.cessRate || 0, interState);

      subtotal += itemSubtotal;
      cgstTotal += tax.cgst;
      sgstTotal += tax.sgst;
      igstTotal += tax.igst;
      cessTotal += tax.cess;

      return {
        productId: item.productId || null,
        description: item.description,
        hsnSac: item.hsnSac || null,
        quantity: item.quantity || 1,
        unit: item.unit || null,
        price: item.price || 0,
        discount: itemDiscount,
        taxableAmount,
        gstRate: item.gstRate || 0,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        cess: tax.cess,
        total: tax.total,
        sortOrder: idx,
      };
    });

    let discountTotal = 0;
    const appliedDiscountType = discountType ?? existing.discountType;
    const appliedDiscountValue = discountValue ?? existing.discountValue;
    if (appliedDiscountType && appliedDiscountValue) {
      discountTotal = appliedDiscountType === 'percentage' ? (subtotal * appliedDiscountValue) / 100 : appliedDiscountValue;
    }

    const taxableAmount = subtotal - discountTotal;
    const gstTotal = cgstTotal + sgstTotal + igstTotal + cessTotal;
    const total = taxableAmount + gstTotal;
    const amountDue = Math.max(0, total - existing.amountPaid);

    const invoice = await prisma.$transaction(async (tx) => {
      // Delete existing items and recreate
      await tx.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });

      return tx.invoice.update({
        where: { id: req.params.id },
        data: {
          ...(customerId && { customerId }),
          ...(type && { type }),
          issueDate: issueDate ? new Date(issueDate) : undefined,
          dueDate: dueDate ? new Date(dueDate) : (dueDate === null ? null : undefined),
          isInterState: interState,
          ...(placeOfSupply !== undefined && { placeOfSupply: placeOfSupply || null }),
          ...(notes !== undefined && { notes: notes || null }),
          ...(terms !== undefined && { terms: terms || null }),
          discountType: appliedDiscountType || null,
          discountValue: appliedDiscountValue || null,
          discountTotal,
          subtotal,
          taxableAmount,
          cgstTotal,
          sgstTotal,
          igstTotal,
          cessTotal,
          gstTotal,
          total,
          amountDue,
          items: { create: processedItems },
        },
        include: { customer: true, items: true },
      });
    });

    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId!;
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { items: true },
    });
    if (!existing) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }

    if (existing.status === 'PAID') {
      res.status(400).json({ success: false, error: 'Cannot delete a paid invoice' });
      return;
    }

    await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    // Revert stock if the invoice was already sent (stock was previously deducted)
    const SENT_STATUSES = ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID'];
    if (SENT_STATUSES.includes(existing.status)) {
      for (const item of existing.items) {
        if (!item.productId) continue;
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stockCount === null) continue;
        const newQty = product.stockCount + item.quantity;
        await prisma.$transaction([
          prisma.product.update({ where: { id: item.productId }, data: { stockCount: newQty } }),
          prisma.stockMovement.create({
            data: {
              businessId,
              productId: item.productId,
              type: 'RETURN',
              quantity: item.quantity,
              previousQty: product.stockCount,
              newQty,
              reference: existing.invoiceNumber,
              notes: `Cancelled invoice ${existing.invoiceNumber}`,
              createdById: req.user!.id,
            },
          }),
        ]);
      }
    }

    res.json({ success: true, message: 'Invoice cancelled' });
  } catch (error) { next(error); }
});

router.post('/:id/send', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId!;
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { customer: true, items: true },
    });
    if (!invoice) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }

    // TODO: Send email with PDF
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    // Deduct stock for items that have a linked product with stock tracking
    for (const item of invoice.items) {
      if (!item.productId) continue;
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stockCount === null) continue;
      const newQty = product.stockCount - item.quantity;
      await prisma.$transaction([
        prisma.product.update({ where: { id: item.productId }, data: { stockCount: newQty } }),
        prisma.stockMovement.create({
          data: {
            businessId,
            productId: item.productId,
            type: 'SALE',
            quantity: item.quantity,
            previousQty: product.stockCount,
            newQty,
            reference: invoice.invoiceNumber,
            notes: `Invoice ${invoice.invoiceNumber}`,
            createdById: req.user!.id,
          },
        }),
      ]);
    }

    res.json({ success: true, message: 'Invoice sent successfully', data: updated });
  } catch (error) { next(error); }
});

router.post('/:id/mark-paid', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
    });
    if (!invoice) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }

    const { amount, method, transactionRef, notes, paidAt } = req.body;
    const paymentAmount = amount || invoice.amountDue;

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          businessId: req.user!.businessId!,
          amount: paymentAmount,
          method: method || 'CASH',
          status: 'SUCCESS',
          transactionRef: transactionRef || null,
          notes: notes || null,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
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
    });

    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.post('/:id/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId!;
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { items: true },
    });
    if (!invoice) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }
    if (invoice.status === 'PAID') { res.status(400).json({ success: false, error: 'Cannot cancel a paid invoice' }); return; }
    if (invoice.status === 'CANCELLED') { res.status(400).json({ success: false, error: 'Invoice already cancelled' }); return; }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    // Revert stock if the invoice was already sent (stock was previously deducted)
    const SENT_STATUSES = ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID'];
    if (SENT_STATUSES.includes(invoice.status)) {
      for (const item of invoice.items) {
        if (!item.productId) continue;
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stockCount === null) continue;
        const newQty = product.stockCount + item.quantity;
        await prisma.$transaction([
          prisma.product.update({ where: { id: item.productId }, data: { stockCount: newQty } }),
          prisma.stockMovement.create({
            data: {
              businessId,
              productId: item.productId,
              type: 'RETURN',
              quantity: item.quantity,
              previousQty: product.stockCount,
              newQty,
              reference: invoice.invoiceNumber,
              notes: `Cancelled invoice ${invoice.invoiceNumber}`,
              createdById: req.user!.id,
            },
          }),
        ]);
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.post('/:id/duplicate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const source = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { items: true },
    });
    if (!source) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) { res.status(404).json({ success: false, error: 'Business not found' }); return; }

    const invoiceNumber = `${business.invoicePrefix}-${String(business.invoiceSeq).padStart(4, '0')}`;

    const newInvoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          businessId, customerId: source.customerId, invoiceNumber,
          type: source.type, status: 'DRAFT',
          issueDate: new Date(),
          dueDate: source.dueDate,
          subtotal: source.subtotal, discountType: source.discountType,
          discountValue: source.discountValue, discountTotal: source.discountTotal,
          taxableAmount: source.taxableAmount, cgstTotal: source.cgstTotal,
          sgstTotal: source.sgstTotal, igstTotal: source.igstTotal,
          cessTotal: source.cessTotal, gstTotal: source.gstTotal,
          total: source.total, amountPaid: 0, amountDue: source.total,
          isInterState: source.isInterState, placeOfSupply: source.placeOfSupply,
          notes: source.notes, terms: source.terms, createdById: req.user!.id,
          items: {
            create: source.items.map(item => ({
              productId: item.productId, description: item.description,
              hsnSac: item.hsnSac, quantity: item.quantity, unit: item.unit,
              price: item.price, discount: item.discount, taxableAmount: item.taxableAmount,
              gstRate: item.gstRate, cgst: item.cgst, sgst: item.sgst,
              igst: item.igst, cess: item.cess, total: item.total,
              sortOrder: item.sortOrder,
            })),
          },
        },
        include: { customer: true, items: true },
      });
      await tx.business.update({ where: { id: businessId }, data: { invoiceSeq: { increment: 1 } } });
      return inv;
    });

    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) { next(error); }
});

export default router;
