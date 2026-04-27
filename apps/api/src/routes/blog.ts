import { Router, Response, NextFunction, Request } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// ─── Multer setup for media file uploads ────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'blog');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${randomUUID()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

// ─── Public Routes (no auth) ────────────────────────────────────────────────

router.get('/public/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const tag = req.query.tag as string | undefined;
    const featured = req.query.featured === 'true';

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      ...(featured && { isFeatured: true }),
      ...(category && { category: { slug: category } }),
      ...(tag && { tags: { some: { tag: { slug: tag } } } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true, color: true } } } },
          _count: { select: { views: true, claps: true } },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/public/posts/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const sessionId = req.query.sessionId as string | undefined;

    const post = await prisma.blogPost.findUnique({
      where: { slug, status: 'PUBLISHED' },
      include: {
        category: true,
        tags: { include: { tag: true } },
        _count: { select: { views: true, claps: true } },
      },
    });

    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    // Track view
    await prisma.blogView.create({
      data: {
        postId: post.id,
        sessionId: sessionId || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    const newViews = post.totalViews + 1;
    const freshnessDays = post.publishedAt
      ? Math.max(0, 30 - (Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const freshnessFactor = Math.min(freshnessDays / 30, 1) * 100;
    const popularityScore =
      newViews * 0.4 + post.totalClaps * 0.4 + freshnessFactor * 0.2;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { totalViews: { increment: 1 }, popularityScore },
    });

    // Fetch related posts
    const related = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: post.categoryId ?? undefined,
        id: { not: post.id },
      },
      take: 3,
      orderBy: { popularityScore: 'desc' },
      include: { category: true },
    });

    res.json({ success: true, data: { ...post, totalViews: newViews }, related });
  } catch (error) {
    next(error);
  }
});

router.get('/public/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { posts: true } } },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

router.get('/public/tags', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
});

router.post('/public/posts/:id/clap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { sessionId, count = 1 } = req.body as { sessionId: string; count?: number };

    if (!sessionId) {
      res.status(400).json({ success: false, error: 'sessionId is required' });
      return;
    }

    const clampedCount = Math.min(Math.max(1, count), 50);

    const existing = await prisma.blogClap.findUnique({
      where: { postId_sessionId: { postId: id, sessionId } },
    });

    const currentCount = existing?.count ?? 0;
    const allowedAdd = Math.min(clampedCount, 50 - currentCount);

    if (allowedAdd <= 0) {
      res.json({ success: true, data: { totalClaps: 0, sessionClaps: currentCount } });
      return;
    }

    await prisma.blogClap.upsert({
      where: { postId_sessionId: { postId: id, sessionId } },
      update: { count: { increment: allowedAdd } },
      create: { postId: id, sessionId, count: allowedAdd },
    });

    const post = await prisma.blogPost.update({
      where: { id },
      data: { totalClaps: { increment: allowedAdd } },
      select: { totalClaps: true },
    });

    res.json({
      success: true,
      data: { totalClaps: post.totalClaps, sessionClaps: currentCount + allowedAdd },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Admin Routes (auth required) ──────────────────────────────────────────

router.use(authenticate);

// Dashboard stats (must be before /:id)
router.get('/stats/dashboard', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [totalPosts, published, drafts, scheduled, archived, viewsAgg, clapsAgg, topPosts, seoAgg] =
      await Promise.all([
        prisma.blogPost.count(),
        prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
        prisma.blogPost.count({ where: { status: 'DRAFT' } }),
        prisma.blogPost.count({ where: { status: 'SCHEDULED' } }),
        prisma.blogPost.count({ where: { status: 'ARCHIVED' } }),
        prisma.blogPost.aggregate({ _sum: { totalViews: true } }),
        prisma.blogPost.aggregate({ _sum: { totalClaps: true } }),
        prisma.blogPost.findMany({
          orderBy: { popularityScore: 'desc' },
          take: 5,
          select: {
            id: true, title: true, slug: true, status: true,
            totalViews: true, totalClaps: true, seoScore: true,
            publishedAt: true, coverImage: true, authorName: true,
            category: { select: { id: true, name: true, color: true } },
          },
        }),
        prisma.blogPost.aggregate({ _avg: { seoScore: true } }),
      ]);

    res.json({
      success: true,
      data: {
        totalPosts,
        published,
        drafts,
        scheduled,
        archived,
        totalViews: viewsAgg._sum.totalViews ?? 0,
        totalClaps: clapsAgg._sum.totalClaps ?? 0,
        topPosts,
        avgSeoScore: Math.round(seoAgg._avg.seoScore ?? 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

// List all posts (admin)
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;

    const where: Record<string, unknown> = {
      ...(status && status !== 'ALL' && { status }),
      ...(category && { categoryId: category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true, color: true } } } },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

// Create post
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, slug, excerpt, content, contentHtml, coverImage, status,
      categoryId, authorId, authorName, authorAvatar, authorBio,
      readTime, wordCount, publishedAt, scheduledAt, isFeatured,
      seoTitle, seoDescription, focusKeyword, canonicalUrl,
      ogTitle, ogDescription, ogImage, twitterImage, schemaType,
      breadcrumbTitle, robotsIndex, robotsFollow, seoScore, tagIds,
    } = req.body;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content: content || '',
        contentHtml,
        coverImage,
        status: status || 'DRAFT',
        categoryId: categoryId || null,
        authorId: authorId || req.user?.id || null,
        authorName: authorName || 'Yantrix Labs',
        authorAvatar,
        authorBio,
        readTime,
        wordCount,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isFeatured: isFeatured ?? false,
        seoTitle,
        seoDescription,
        focusKeyword,
        canonicalUrl,
        ogTitle,
        ogDescription,
        ogImage,
        twitterImage,
        schemaType: schemaType || 'ARTICLE',
        breadcrumbTitle,
        robotsIndex: robotsIndex ?? true,
        robotsFollow: robotsFollow ?? true,
        seoScore,
        ...(Array.isArray(tagIds) && tagIds.length > 0
          ? { tags: { create: tagIds.map((tagId: string) => ({ tagId })) } }
          : {}),
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

// ─── Categories (admin) ─────────────────────────────────────────────────────

router.get('/categories', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { posts: true } },
      },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.blogCategory.create({ data: req.body });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

router.put('/categories/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.blogCategory.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.blogCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Category deleted' } });
  } catch (error) {
    next(error);
  }
});

// ─── Tags (admin) ───────────────────────────────────────────────────────────

router.get('/tags', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
});

router.post('/tags', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tag = await prisma.blogTag.create({ data: req.body });
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
});

router.put('/tags/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tag = await prisma.blogTag.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
});

router.delete('/tags/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.blogTag.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Tag deleted' } });
  } catch (error) {
    next(error);
  }
});

// ─── Media (admin) ──────────────────────────────────────────────────────────

router.get('/media', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const folder = req.query.folder as string | undefined;
    const search = req.query.search as string | undefined;

    const media = await prisma.blogMedia.findMany({
      where: {
        ...(folder && { folder }),
        ...(search && { originalName: { contains: search, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
});

router.post('/media', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const media = await prisma.blogMedia.create({ data: req.body });
    res.status(201).json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
});

router.post('/media/upload', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    // API_URL may include the /api/v1 path prefix; strip it to get the server origin for static file URLs.
    const apiBase = (process.env.API_URL || `http://localhost:4000`).replace(/\/api\/v1\/?$/, '');
    const fileUrl = `${apiBase}/uploads/blog/${req.file.filename}`;
    const media = await prisma.blogMedia.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        mimeType: req.file.mimetype,
        size: req.file.size,
        folder: 'blog',
      },
    });
    res.status(201).json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
});

router.delete('/media/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.blogMedia.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Media deleted' } });
  } catch (error) {
    next(error);
  }
});

// ─── Post by id (admin) — must come after all fixed-path routes ─────────────

// Get post by id
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        revisions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

// Update post
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { tagIds, ...data } = req.body;

    // Save revision before update
    const existing = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      select: { title: true, content: true },
    });
    if (existing) {
      await prisma.blogRevision.create({
        data: {
          postId: req.params.id,
          title: existing.title,
          content: existing.content,
          savedBy: req.user?.id,
        },
      });
    }

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        ...(Array.isArray(tagIds)
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId: string) => ({ tagId })),
              },
            }
          : {}),
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Post deleted' } });
  } catch (error) {
    next(error);
  }
});

// Duplicate post
router.post('/:id/duplicate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const original = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: { tags: true },
    });
    if (!original) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, slug, title, totalViews, uniqueViews, totalClaps, popularityScore, ...rest } = original;
    const newPost = await prisma.blogPost.create({
      data: {
        ...rest,
        title: `${title} (Copy)`,
        slug: `${slug}-copy-${Date.now()}`,
        status: 'DRAFT',
        totalViews: 0,
        uniqueViews: 0,
        totalClaps: 0,
        popularityScore: 0,
        publishedAt: null,
        tags: {
          create: original.tags.map(t => ({ tagId: t.tagId })),
        },
      },
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    next(error);
  }
});

export default router;
