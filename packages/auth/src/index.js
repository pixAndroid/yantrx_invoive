"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.ROLE_PERMISSIONS = exports.PERMISSIONS = void 0;
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.decodeToken = decodeToken;
exports.generateOtp = generateOtp;
exports.getOtpExpiry = getOtpExpiry;
exports.hasPermission = hasPermission;
exports.hasAnyPermission = hasAnyPermission;
exports.hasAllPermissions = hasAllPermissions;
exports.generateApiKey = generateApiKey;
exports.hashApiKey = hashApiKey;
exports.verifyApiKey = verifyApiKey;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const shared_types_1 = require("@yantrix/shared-types");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return shared_types_1.UserRole; } });
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-fallback-secret';
// ─── Password Utilities ────────────────────────────────────────────────────
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
// ─── JWT Utilities ─────────────────────────────────────────────────────────
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function generateRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId, type: 'refresh' }, REFRESH_TOKEN_SECRET, {
        expiresIn: '30d',
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
}
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
}
// ─── OTP Utilities ─────────────────────────────────────────────────────────
function generateOtp(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}
function getOtpExpiry(minutes = 10) {
    return new Date(Date.now() + minutes * 60 * 1000);
}
// ─── RBAC Permissions ──────────────────────────────────────────────────────
exports.PERMISSIONS = {
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
};
exports.ROLE_PERMISSIONS = {
    [shared_types_1.UserRole.SUPER_ADMIN]: [exports.PERMISSIONS.ALL],
    [shared_types_1.UserRole.OWNER]: [exports.PERMISSIONS.ALL],
    [shared_types_1.UserRole.ACCOUNTANT]: [
        exports.PERMISSIONS.INVOICE_CREATE,
        exports.PERMISSIONS.INVOICE_READ,
        exports.PERMISSIONS.INVOICE_UPDATE,
        exports.PERMISSIONS.INVOICE_SEND,
        exports.PERMISSIONS.CUSTOMER_CREATE,
        exports.PERMISSIONS.CUSTOMER_READ,
        exports.PERMISSIONS.CUSTOMER_UPDATE,
        exports.PERMISSIONS.PRODUCT_CREATE,
        exports.PERMISSIONS.PRODUCT_READ,
        exports.PERMISSIONS.PRODUCT_UPDATE,
        exports.PERMISSIONS.PAYMENT_CREATE,
        exports.PERMISSIONS.PAYMENT_READ,
        exports.PERMISSIONS.REPORT_READ,
        exports.PERMISSIONS.REPORT_EXPORT,
        exports.PERMISSIONS.SETTINGS_READ,
        exports.PERMISSIONS.TEAM_READ,
    ],
    [shared_types_1.UserRole.STAFF]: [
        exports.PERMISSIONS.INVOICE_CREATE,
        exports.PERMISSIONS.INVOICE_READ,
        exports.PERMISSIONS.INVOICE_SEND,
        exports.PERMISSIONS.CUSTOMER_CREATE,
        exports.PERMISSIONS.CUSTOMER_READ,
        exports.PERMISSIONS.PRODUCT_READ,
        exports.PERMISSIONS.PAYMENT_READ,
    ],
    [shared_types_1.UserRole.CUSTOMER]: [
        exports.PERMISSIONS.INVOICE_READ,
    ],
};
function hasPermission(userRole, userPermissions, requiredPermission) {
    if (userPermissions.includes(exports.PERMISSIONS.ALL))
        return true;
    if (exports.ROLE_PERMISSIONS[userRole]?.includes(exports.PERMISSIONS.ALL))
        return true;
    if (exports.ROLE_PERMISSIONS[userRole]?.includes(requiredPermission))
        return true;
    return userPermissions.includes(requiredPermission);
}
function hasAnyPermission(userRole, userPermissions, requiredPermissions) {
    return requiredPermissions.some(p => hasPermission(userRole, userPermissions, p));
}
function hasAllPermissions(userRole, userPermissions, requiredPermissions) {
    return requiredPermissions.every(p => hasPermission(userRole, userPermissions, p));
}
// ─── API Key Utilities ─────────────────────────────────────────────────────
function generateApiKey() {
    const prefix = 'yx_live_';
    const randomPart = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
    return { key: `${prefix}${randomPart}`, prefix: prefix.slice(0, 7) };
}
async function hashApiKey(key) {
    return bcryptjs_1.default.hash(key, 10);
}
async function verifyApiKey(key, hash) {
    return bcryptjs_1.default.compare(key, hash);
}
//# sourceMappingURL=index.js.map