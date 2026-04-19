import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, generateOtp, getOtpExpiry } from '@yantrix/auth';
import { UserRole } from '@yantrix/shared-types';
import prisma from '../utils/prisma';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user and business
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, password, businessName } = req.body;

      if (!email && !phone) {
        res.status(422).json({ success: false, error: 'Email or phone is required' });
        return;
      }

      // Check if user exists
      const existing = await prisma.user.findFirst({
        where: email ? { email } : { phone },
      });

      if (existing) {
        res.status(409).json({ success: false, error: 'User already exists' });
        return;
      }

      const passwordHash = await hashPassword(password);

      // Get free plan
      const freePlan = await prisma.plan.findFirst({ where: { slug: 'free' } });

      // Create user + business in transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email: email || null,
            phone: phone || null,
            passwordHash,
            role: UserRole.OWNER,
            isVerified: false,
          },
        });

        const business = await tx.business.create({
          data: {
            name: businessName,
            ownerId: user.id,
            planId: freePlan?.id,
          },
        });

        await tx.membership.create({
          data: {
            userId: user.id,
            businessId: business.id,
            role: UserRole.OWNER,
            permissions: ['*'],
            joinedAt: new Date(),
          },
        });

        // Enable core modules
        const coreModules = await tx.module.findMany({ where: { isCore: true } });
        for (const m of coreModules) {
          await tx.businessModule.create({
            data: { businessId: business.id, moduleId: m.id },
          });
        }

        // Create trial subscription
        if (freePlan) {
          await tx.subscription.create({
            data: {
              businessId: business.id,
              planId: freePlan.id,
              status: 'TRIAL',
              startDate: new Date(),
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              amount: 0,
            },
          });
        }

        return { user, business };
      });

      const accessToken = generateAccessToken({
        sub: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role as UserRole,
        businessId: result.business.id,
      });

      const refreshToken = generateRefreshToken(result.user.id);

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: result.user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      const { passwordHash: _ph, ...userWithoutPassword } = result.user;

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: userWithoutPassword,
          business: result.business,
          accessToken,
          refreshToken,
          expiresIn: 7 * 24 * 60 * 60,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email/phone and password
 */
router.post(
  '/login',
  [
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, phone, password } = req.body;

      if (!email && !phone) {
        res.status(422).json({ success: false, error: 'Email or phone is required' });
        return;
      }

      const user = await prisma.user.findFirst({
        where: email ? { email } : { phone },
      });

      if (!user || !user.passwordHash) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, error: 'Account is suspended' });
        return;
      }

      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
      }

      // Get primary business
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id, isActive: true },
        include: { business: true },
        orderBy: { createdAt: 'asc' },
      });

      const businessId = membership?.businessId || null;

      const accessToken = generateAccessToken({
        sub: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role as UserRole,
        businessId,
      });

      const refreshToken = generateRefreshToken(user.id);

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const { passwordHash: _ph, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          business: membership?.business || null,
          accessToken,
          refreshToken,
          expiresIn: 7 * 24 * 60 * 60,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/otp/send:
 *   post:
 *     tags: [Auth]
 *     summary: Send OTP to phone or email
 */
router.post(
  '/otp/send',
  [
    body('purpose').isIn(['login', 'verify', 'reset']).withMessage('Invalid purpose'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, email, purpose } = req.body;

      if (!phone && !email) {
        res.status(422).json({ success: false, error: 'Phone or email required' });
        return;
      }

      let user = await prisma.user.findFirst({
        where: email ? { email } : { phone },
      });

      if (purpose === 'login' && !user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // For login OTP, create user if not exists (phone-first signup)
      if (!user && phone && purpose !== 'reset') {
        user = await prisma.user.create({
          data: {
            name: 'User',
            phone,
            role: UserRole.OWNER,
          },
        });
      }

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const code = generateOtp(6);
      const expiresAt = getOtpExpiry(10);

      // Invalidate previous OTPs
      await prisma.otpCode.updateMany({
        where: { userId: user.id, purpose, isUsed: false },
        data: { isUsed: true },
      });

      await prisma.otpCode.create({
        data: {
          userId: user.id,
          code,
          type: phone ? 'sms' : 'email',
          purpose,
          expiresAt,
        },
      });

      // TODO: Send actual OTP via SMS/email
      console.log(`📱 OTP for ${phone || email}: ${code}`);

      res.json({
        success: true,
        message: `OTP sent to ${phone ? phone.replace(/\d(?=\d{4})/g, '*') : email?.replace(/(.{2}).*(@.*)/, '$1***$2')}`,
        // Remove in production:
        ...(process.env.NODE_ENV === 'development' && { _dev_otp: code }),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP
 */
router.post(
  '/otp/verify',
  [
    body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('purpose').isIn(['login', 'verify', 'reset']).withMessage('Invalid purpose'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, email, code, purpose } = req.body;

      const user = await prisma.user.findFirst({
        where: email ? { email } : { phone },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          userId: user.id,
          code,
          purpose,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        await prisma.otpCode.updateMany({
          where: { userId: user.id, purpose, isUsed: false },
          data: { attempts: { increment: 1 } },
        });
        res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        return;
      }

      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      if (purpose === 'verify') {
        await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
        res.json({ success: true, message: 'Account verified successfully' });
        return;
      }

      // For login purpose
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id, isActive: true },
        include: { business: true },
        orderBy: { createdAt: 'asc' },
      });

      const accessToken = generateAccessToken({
        sub: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role as UserRole,
        businessId: membership?.businessId || null,
      });

      const refreshToken = generateRefreshToken(user.id);

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const { passwordHash: _ph, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          business: membership?.business || null,
          accessToken,
          refreshToken,
          expiresIn: 7 * 24 * 60 * 60,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, isRevoked: false, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!tokenRecord) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: tokenRecord.userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const newAccessToken = generateAccessToken({
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      phone: tokenRecord.user.phone,
      role: tokenRecord.user.role as UserRole,
      businessId: membership?.businessId || null,
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken, expiresIn: 7 * 24 * 60 * 60 },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatar: true, isActive: true, isVerified: true, lastLoginAt: true, createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id, isActive: true },
      include: { business: true },
    });

    res.json({ success: true, data: { user, memberships } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (revoke refresh token)
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { userId: req.user!.id, token: refreshToken },
        data: { isRevoked: true },
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'currentPassword and newPassword required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !user.passwordHash) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user!.id }, data: { passwordHash: newHash } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
