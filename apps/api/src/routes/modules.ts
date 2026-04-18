import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res: Response, next: NextFunction) => {
  try {
    const modules = await prisma.module.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: modules });
  } catch (error) { next(error); }
});

router.post('/:slug/enable', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const module = await prisma.module.findFirst({ where: { slug: req.params.slug } });
    if (!module) { res.status(404).json({ success: false, error: 'Module not found' }); return; }

    const bm = await prisma.businessModule.upsert({
      where: { businessId_moduleId: { businessId, moduleId: module.id } },
      update: { isEnabled: true },
      create: { businessId, moduleId: module.id, isEnabled: true },
    });

    res.json({ success: true, data: bm });
  } catch (error) { next(error); }
});

router.post('/:slug/disable', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const module = await prisma.module.findFirst({ where: { slug: req.params.slug } });
    if (!module) { res.status(404).json({ success: false, error: 'Module not found' }); return; }
    if (module.isCore) { res.status(400).json({ success: false, error: 'Cannot disable core module' }); return; }

    await prisma.businessModule.updateMany({
      where: { businessId, moduleId: module.id },
      data: { isEnabled: false },
    });

    res.json({ success: true, message: 'Module disabled' });
  } catch (error) { next(error); }
});

export default router;
