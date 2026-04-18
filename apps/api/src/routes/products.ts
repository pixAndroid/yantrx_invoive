import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const search = req.query.search as string;
    const category = req.query.category as string;

    const where = {
      businessId,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          { barcode: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) { next(error); }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Product name required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('gstRate').optional().isFloat({ min: 0, max: 100 }),
], validate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const product = await prisma.product.create({ data: { ...req.body, businessId } });
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
    });
    if (!product) { res.status(404).json({ success: false, error: 'Product not found' }); return; }
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { businessId: _bId, ...updateData } = req.body;
    await prisma.product.updateMany({
      where: { id: req.params.id, businessId: req.user!.businessId! },
      data: updateData,
    });
    const updated = await prisma.product.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.product.updateMany({
      where: { id: req.params.id, businessId: req.user!.businessId! },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) { next(error); }
});

export default router;
