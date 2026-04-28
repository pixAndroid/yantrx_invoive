import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireSuperAdmin, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();

// ─── Public Routes ──────────────────────────────────────────────────────────

// GET /api/v1/faqs/public — returns published FAQs ordered by sortOrder
router.get('/public', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const faqs = await prisma.faq.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, question: true, answer: true, sortOrder: true },
    });
    res.json({ success: true, data: faqs });
  } catch (error) {
    next(error);
  }
});

// ─── Admin Routes (auth + super-admin required) ─────────────────────────────

router.use(authenticate);
router.use(requireSuperAdmin);

// GET /api/v1/faqs — list all FAQs
router.get('/', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: faqs });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/faqs — create a new FAQ
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { question, answer, isPublished } = req.body;

    if (!question || !answer) {
      res.status(400).json({ success: false, error: 'Question and answer are required' });
      return;
    }

    const maxOrder = await prisma.faq.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const faq = await prisma.faq.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        sortOrder,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      },
    });

    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/faqs/reorder — update sortOrder for multiple FAQs
router.put('/reorder', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };

    if (!Array.isArray(ids)) {
      res.status(400).json({ success: false, error: 'A valid array of FAQ IDs is required for reordering' });
      return;
    }

    await Promise.all(
      ids.map((id, index) =>
        prisma.faq.update({ where: { id }, data: { sortOrder: index } })
      )
    );

    res.json({ success: true, data: { message: 'FAQs reordered' } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/faqs/:id — update a FAQ
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { question, answer, isPublished, sortOrder } = req.body;

    const faq = await prisma.faq.update({
      where: { id: req.params.id },
      data: {
        ...(question !== undefined && { question: question.trim() }),
        ...(answer !== undefined && { answer: answer.trim() }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    res.json({ success: true, data: faq });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/faqs/:id — delete a FAQ
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.faq.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'FAQ deleted' } });
  } catch (error) {
    next(error);
  }
});

export default router;
