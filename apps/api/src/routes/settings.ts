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

const ABOUT_STATS_KEY = 'about_stats';

const ABOUT_STATS_DEFAULTS = {
  stat1Value: '10+',
  stat1Label: 'Products Built',
  stat2Value: '500+',
  stat2Label: 'Businesses Served',
  stat3Value: '5+',
  stat3Label: 'Industries Covered',
  stat4Value: '3+',
  stat4Label: 'Years Building',
};

router.get('/about-stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: ABOUT_STATS_KEY } });
    res.json({ success: true, data: config ?? { key: ABOUT_STATS_KEY, ...ABOUT_STATS_DEFAULTS } });
  } catch (error) { next(error); }
});

const CONTACT_DETAILS_KEY = 'contact_details';

const CONTACT_DETAILS_DEFAULTS = {
  contactEmail: 'support@yantrix.in',
  contactPhone: '+91 80 4567 8900',
  contactPhoneHref: 'tel:+918045678900',
  officeCompanyName: 'Yantrix Technologies Pvt. Ltd.',
  officeFloor: '4th Floor, Innovate Hub',
  officeStreet: '80 Feet Road, Koramangala',
  officeCity: 'Bengaluru',
  officeState: 'Karnataka 560034',
  officePinCode: '',
  officeCountry: 'India',
  officeWebsite: 'yantrix.in',
  hoursMondayFriday: '9 AM – 8 PM IST',
  hoursSaturday: '10 AM – 6 PM IST',
  hoursSunday: 'Email only',
  hoursNote: 'Extended support hours during GST filing deadlines (20th – 22nd of each month).',
};

router.get('/contact-details', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: CONTACT_DETAILS_KEY },
      select: {
        contactEmail: true, contactPhone: true, contactPhoneHref: true,
        officeCompanyName: true, officeFloor: true, officeStreet: true,
        officeCity: true, officeState: true, officePinCode: true,
        officeCountry: true, officeWebsite: true,
        hoursMondayFriday: true, hoursSaturday: true, hoursSunday: true, hoursNote: true,
      },
    });
    res.json({ success: true, data: config ?? CONTACT_DETAILS_DEFAULTS });
  } catch (error) { next(error); }
});

router.get('/team-members', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, role: true, bio: true, imageUrl: true, displayOrder: true },
    });
    res.json({ success: true, data: members });
  } catch (error) { next(error); }
});

export default router;
