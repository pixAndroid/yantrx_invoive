import Razorpay from 'razorpay';
import crypto from 'crypto';
import { type Plan, type Subscription } from '@yantrix/shared-types';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// ─── Order Creation ────────────────────────────────────────────────────────

export interface CreateOrderOptions {
  amount: number; // in paise (INR * 100)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export async function createOrder(options: CreateOrderOptions) {
  return razorpay.orders.create({
    amount: Math.round(options.amount * 100),
    currency: options.currency || 'INR',
    receipt: options.receipt,
    notes: options.notes,
  });
}

// ─── Subscription Creation ─────────────────────────────────────────────────

export interface CreateSubscriptionOptions {
  planId: string;
  totalCount?: number;
  quantity?: number;
  notes?: Record<string, string>;
}

export async function createSubscription(options: CreateSubscriptionOptions) {
  return razorpay.subscriptions.create({
    plan_id: options.planId,
    total_count: options.totalCount || 12,
    quantity: options.quantity || 1,
    notes: options.notes,
  });
}

export async function cancelSubscription(subscriptionId: string, cancelAtEnd = true) {
  return razorpay.subscriptions.cancel(subscriptionId, cancelAtEnd);
}

export async function getSubscription(subscriptionId: string) {
  return razorpay.subscriptions.fetch(subscriptionId);
}

// ─── Payment Link ──────────────────────────────────────────────────────────

export interface CreatePaymentLinkOptions {
  amount: number; // in rupees
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  referenceId?: string;
  expireBy?: number; // unix timestamp
  callbackUrl?: string;
  notifyEmail?: boolean;
  notifySms?: boolean;
}

export async function createPaymentLink(options: CreatePaymentLinkOptions) {
  return razorpay.paymentLink.create({
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

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

// ─── Plan Helpers ──────────────────────────────────────────────────────────

export function formatAmountForRazorpay(amount: number): number {
  return Math.round(amount * 100);
}

export function formatAmountFromRazorpay(amount: number): number {
  return amount / 100;
}

export function isPlanUpgrade(currentPlan: Plan, newPlan: Plan): boolean {
  return newPlan.price > currentPlan.price;
}

export function isPlanDowngrade(currentPlan: Plan, newPlan: Plan): boolean {
  return newPlan.price < currentPlan.price;
}

export function getDaysRemaining(subscription: Subscription): number {
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isSubscriptionActive(subscription: Subscription): boolean {
  return (
    subscription.status === 'ACTIVE' &&
    new Date(subscription.endDate) > new Date()
  );
}

export function isTrialActive(subscription: Subscription): boolean {
  return (
    subscription.status === 'TRIAL' &&
    subscription.trialEndsAt !== null &&
    new Date(subscription.trialEndsAt) > new Date()
  );
}

// ─── Invoice Amount Helpers ────────────────────────────────────────────────

export interface TaxCalculation {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
}

export function calculateTax(
  amount: number,
  gstRate: number,
  cessRate: number = 0,
  isInterState: boolean = false
): TaxCalculation {
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

export { razorpay };
