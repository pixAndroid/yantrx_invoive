"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayError = void 0;
exports.createOrder = createOrder;
exports.createSubscription = createSubscription;
exports.cancelSubscription = cancelSubscription;
exports.getSubscription = getSubscription;
exports.createPaymentLink = createPaymentLink;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.verifyPaymentSignature = verifyPaymentSignature;
exports.formatAmountForRazorpay = formatAmountForRazorpay;
exports.formatAmountFromRazorpay = formatAmountFromRazorpay;
exports.isPlanUpgrade = isPlanUpgrade;
exports.isPlanDowngrade = isPlanDowngrade;
exports.getDaysRemaining = getDaysRemaining;
exports.isSubscriptionActive = isSubscriptionActive;
exports.isTrialActive = isTrialActive;
exports.calculateTax = calculateTax;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
// Lazily create the Razorpay client so that importing this package does not
// crash when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not yet present in the
// environment (e.g. during server startup before dotenv has run, or when the
// keys are intentionally omitted in non-payment environments).
let _razorpay = null;
function getRazorpay() {
    if (!_razorpay) {
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_id || !key_secret) {
            throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in the environment before using Razorpay.');
        }
        _razorpay = new razorpay_1.default({ key_id, key_secret });
    }
    return _razorpay;
}
/** Error class for failures originating from the Razorpay gateway. */
class RazorpayError extends Error {
    constructor(description, statusCode, razorpayCode) {
        super(description);
        this.name = 'RazorpayError';
        this.statusCode = statusCode;
        this.razorpayCode = razorpayCode;
    }
}
exports.RazorpayError = RazorpayError;
function normalizeRazorpayError(err) {
    const sdkErr = err;
    const description = sdkErr?.error?.description ||
        sdkErr?.message ||
        'Failed to create Razorpay order';
    return new RazorpayError(description, sdkErr?.statusCode || 502, sdkErr?.error?.code);
}
async function createOrder(options) {
    try {
        return await getRazorpay().orders.create({
            amount: Math.round(options.amount * 100),
            currency: options.currency || 'INR',
            receipt: options.receipt,
            notes: options.notes,
        });
    }
    catch (err) {
        // Razorpay SDK (axios-based) rejects with a plain object, not an Error instance.
        // Normalize it so the Express error handler always receives a proper Error.
        throw normalizeRazorpayError(err);
    }
}
async function createSubscription(options) {
    return getRazorpay().subscriptions.create({
        plan_id: options.planId,
        total_count: options.totalCount || 12,
        quantity: options.quantity || 1,
        notes: options.notes,
    });
}
async function cancelSubscription(subscriptionId, cancelAtEnd = true) {
    return getRazorpay().subscriptions.cancel(subscriptionId, cancelAtEnd);
}
async function getSubscription(subscriptionId) {
    return getRazorpay().subscriptions.fetch(subscriptionId);
}
async function createPaymentLink(options) {
    return getRazorpay().paymentLink.create({
        amount: Math.round(options.amount * 100),
        currency: 'INR',
        description: options.description,
        customer: {
            name: options.customerName,
            email: options.customerEmail,
            contact: options.customerPhone,
        },
        reference_id: options.referenceId,
        expire_by: options.expireBy,
        callback_url: options.callbackUrl,
        callback_method: 'get',
        notify: {
            email: options.notifyEmail ?? true,
            sms: options.notifySms ?? true,
        },
    });
}
// ─── Webhook Verification ──────────────────────────────────────────────────
function verifyWebhookSignature(body, signature, secret) {
    const expectedSignature = crypto_1.default
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}
function verifyPaymentSignature(orderId, paymentId, signature) {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}
// ─── Plan Helpers ──────────────────────────────────────────────────────────
function formatAmountForRazorpay(amount) {
    return Math.round(amount * 100);
}
function formatAmountFromRazorpay(amount) {
    return amount / 100;
}
function isPlanUpgrade(currentPlan, newPlan) {
    return newPlan.price > currentPlan.price;
}
function isPlanDowngrade(currentPlan, newPlan) {
    return newPlan.price < currentPlan.price;
}
function getDaysRemaining(subscription) {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
function isSubscriptionActive(subscription) {
    return (subscription.status === 'ACTIVE' &&
        new Date(subscription.endDate) > new Date());
}
function isTrialActive(subscription) {
    return (subscription.status === 'TRIAL' &&
        subscription.trialEndsAt !== null &&
        new Date(subscription.trialEndsAt) > new Date());
}
function calculateTax(amount, gstRate, cessRate = 0, isInterState = false) {
    const taxableAmount = amount;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const cessAmount = (taxableAmount * cessRate) / 100;
    if (isInterState) {
        return {
            taxableAmount,
            cgst: 0,
            sgst: 0,
            igst: gstAmount,
            cess: cessAmount,
            total: taxableAmount + gstAmount + cessAmount,
        };
    }
    return {
        taxableAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        cess: cessAmount,
        total: taxableAmount + gstAmount + cessAmount,
    };
}
//# sourceMappingURL=index.js.map