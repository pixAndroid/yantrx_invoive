import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

const router = Router();

const HOME_HEADER_KEY = 'home_header';

const HOME_HEADER_DEFAULTS = {
  badgeText: 'Trusted by 500+ businesses across India',
  titleLine1: 'We Build Tools That',
  titleGradientText: 'Power Modern Businesses',
  description:
    'From invoicing to booking platforms, tracking systems to SaaS products — we design software that helps companies grow faster.',
  primaryBtnLabel: 'Explore Tools',
  secondaryBtnLabel: 'Start a Project',
  stat1Value: '10+',
  stat1Label: 'Products Built',
  stat2Value: '500+',
  stat2Label: 'Businesses Served',
  stat3Value: '5+',
  stat3Label: 'Industries',
};

router.get('/home-header', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: HOME_HEADER_KEY } });
    res.json({ success: true, data: config ?? { key: HOME_HEADER_KEY, ...HOME_HEADER_DEFAULTS } });
  } catch (error) { next(error); }
});

export default router;
