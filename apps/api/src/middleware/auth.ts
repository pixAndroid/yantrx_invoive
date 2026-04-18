import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@yantrix/auth';
import { UserRole } from '@yantrix/shared-types';
import prisma from '../utils/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    phone: string | null;
    name: string;
    role: UserRole;
    businessId: string | null;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
      name: '',
      role: payload.role,
      businessId: payload.businessId,
    };

    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ success: false, error: 'Super admin access required' });
    return;
  }
  next();
}

export async function apiKeyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    next();
    return;
  }

  try {
    const prefix = apiKey.substring(0, 7);
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { keyPrefix: prefix, isActive: true },
      include: { business: { include: { owner: true } } },
    });

    if (!apiKeyRecord) {
      res.status(401).json({ success: false, error: 'Invalid API key' });
      return;
    }

    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      res.status(401).json({ success: false, error: 'API key expired' });
      return;
    }

    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsed: new Date() },
    });

    req.user = {
      id: apiKeyRecord.business.owner.id,
      email: apiKeyRecord.business.owner.email,
      phone: apiKeyRecord.business.owner.phone,
      name: apiKeyRecord.business.owner.name,
      role: apiKeyRecord.business.owner.role as UserRole,
      businessId: apiKeyRecord.businessId,
    };

    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid API key' });
  }
}
