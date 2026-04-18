import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRole, type JwtPayload } from '@yantrix/shared-types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-fallback-secret';

// ─── Password Utilities ────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Utilities ─────────────────────────────────────────────────────────

export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, REFRESH_TOKEN_SECRET, {
    expiresIn: '30d',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string; type: string } {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as { sub: string; type: string };
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── OTP Utilities ─────────────────────────────────────────────────────────

export function generateOtp(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

export function getOtpExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

// ─── RBAC Permissions ──────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Invoices
  INVOICE_CREATE: 'invoice:create',
  INVOICE_READ: 'invoice:read',
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_DELETE: 'invoice:delete',
  INVOICE_SEND: 'invoice:send',

  // Customers
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',

  // Products
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Payments
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_READ: 'payment:read',

  // Reports
  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Team
  TEAM_INVITE: 'team:invite',
  TEAM_REMOVE: 'team:remove',
  TEAM_READ: 'team:read',

  // Billing
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',

  // All
  ALL: '*',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [PERMISSIONS.ALL],
  [UserRole.OWNER]: [PERMISSIONS.ALL],
  [UserRole.ACCOUNTANT]: [
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.INVOICE_SEND,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.TEAM_READ,
  ],
  [UserRole.STAFF]: [
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_SEND,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PAYMENT_READ,
  ],
  [UserRole.CUSTOMER]: [
    PERMISSIONS.INVOICE_READ,
  ],
};

export function hasPermission(
  userRole: UserRole,
  userPermissions: string[],
  requiredPermission: Permission
): boolean {
  if (userPermissions.includes(PERMISSIONS.ALL)) return true;
  if (ROLE_PERMISSIONS[userRole]?.includes(PERMISSIONS.ALL)) return true;
  if (ROLE_PERMISSIONS[userRole]?.includes(requiredPermission)) return true;
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userRole: UserRole,
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some(p => hasPermission(userRole, userPermissions, p));
}

export function hasAllPermissions(
  userRole: UserRole,
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every(p => hasPermission(userRole, userPermissions, p));
}

// ─── API Key Utilities ─────────────────────────────────────────────────────

export function generateApiKey(): { key: string; prefix: string } {
  const prefix = 'yx_live_';
  const randomPart = Array.from({ length: 32 }, () =>
    Math.random().toString(36)[2]
  ).join('');
  return { key: `${prefix}${randomPart}`, prefix: prefix.slice(0, 7) };
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

export { UserRole, type JwtPayload };
