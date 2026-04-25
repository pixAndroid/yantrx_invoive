import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// GET /api/v1/tools — public listing (published + public only)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const featured = req.query.featured as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '50');

    const where: any = {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { shortDescription: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
        { tags: { has: search } },
      ];
    }

    if (category) where.category = category;
    if (featured !== undefined && featured !== '') where.featured = featured === 'true';

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          logoUrl: true,
          bannerUrl: true,
          category: true,
          tags: true,
          featured: true,
          toolType: true,
          ctaText: true,
          ctaUrl: true,
          pricingType: true,
          sortOrder: true,
          viewCount: true,
        },
      }),
      prisma.tool.count({ where }),
    ]);

    res.json({
      success: true,
      data: tools,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
});

// GET /api/v1/tools/categories — list distinct categories
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tools = await prisma.tool.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    const categories = tools.map(t => t.category).filter(Boolean);
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
});

// GET /api/v1/tools/:slug — public single tool by slug
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tool = await prisma.tool.findFirst({
      where: {
        slug: req.params.slug,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
    });

    if (!tool) {
      res.status(404).json({ success: false, error: 'Tool not found' });
      return;
    }

    // Increment view count (fire-and-forget)
    prisma.tool.update({
      where: { id: tool.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    res.json({ success: true, data: tool });
  } catch (error) { next(error); }
});

export default router;
