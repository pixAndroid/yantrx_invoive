import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

// GET /inventory — stock overview with low-stock and out-of-stock products
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { search, category, stockStatus } = req.query;

    const where: any = { businessId, type: 'product' };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (stockStatus === 'low') {
      where.AND = [{ stockCount: { gt: 0 } }, { lowStockAlert: { not: null } }];
    } else if (stockStatus === 'out') {
      where.stockCount = 0;
    } else if (stockStatus === 'in') {
      where.stockCount = { gt: 0 };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Filter low stock in application code (Prisma doesn't support column comparisons easily)
    let result = products;
    if (stockStatus === 'low') {
      result = products.filter(p => p.stockCount !== null && p.lowStockAlert !== null && p.stockCount > 0 && p.stockCount <= p.lowStockAlert);
    }

    const stats = {
      totalProducts: products.length,
      inStock: products.filter(p => p.stockCount !== null && p.stockCount > 0).length,
      lowStock: products.filter(p => p.stockCount !== null && p.lowStockAlert !== null && p.stockCount > 0 && p.stockCount <= p.lowStockAlert).length,
      outOfStock: products.filter(p => p.stockCount !== null && p.stockCount === 0).length,
      totalValue: products.reduce((sum, p) => sum + (p.stockCount || 0) * (p.costPrice || p.price), 0),
    };

    res.json({ success: true, data: result, stats });
  } catch (error) { next(error); }
});

// GET /inventory/movements — stock movement history
router.get('/movements', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { productId, type, limit = '50', page = '1' } = req.query;
    const take = Math.min(parseInt(limit as string) || 50, 200);
    const skip = (parseInt(page as string) - 1) * take;

    const where: any = { businessId };
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { product: { select: { name: true, sku: true } } },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({ success: true, data: movements, meta: { total, page: parseInt(page as string), limit: take } });
  } catch (error) { next(error); }
});

// POST /inventory/adjust — adjust stock for a product
router.post('/adjust', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { productId, type, quantity, reference, notes } = req.body;
    if (!productId || !type || quantity === undefined) {
      res.status(400).json({ success: false, error: 'productId, type, and quantity are required' });
      return;
    }

    const VALID_TYPES = ['PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'OPENING'];
    if (!VALID_TYPES.includes(type)) {
      res.status(400).json({ success: false, error: `type must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }

    const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
    if (!product) { res.status(404).json({ success: false, error: 'Product not found' }); return; }

    const qty = parseFloat(quantity);
    const previousQty = product.stockCount || 0;
    let newQty: number;

    if (type === 'ADJUSTMENT') {
      // For adjustment, quantity is the new absolute value
      newQty = qty;
    } else if (type === 'DAMAGE') {
      newQty = Math.max(0, previousQty - qty);
    } else {
      // PURCHASE, RETURN, OPENING — add to stock
      newQty = previousQty + qty;
    }

    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          businessId,
          productId,
          type,
          quantity: qty,
          previousQty,
          newQty,
          reference: reference || null,
          notes: notes || null,
          createdById: req.user!.id,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stockCount: newQty },
      }),
    ]);

    res.status(201).json({ success: true, data: movement });
  } catch (error) { next(error); }
});

export default router;
