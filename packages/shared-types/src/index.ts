// ─── Enums ──────────────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  ACCOUNTANT = 'ACCOUNTANT',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export enum InvoiceType {
  INVOICE = 'INVOICE',
  PROFORMA = 'PROFORMA',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  ESTIMATE = 'ESTIMATE',
  RECEIPT = 'RECEIPT',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  RAZORPAY = 'RAZORPAY',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
}

export enum GstType {
  REGULAR = 'REGULAR',
  COMPOSITION = 'COMPOSITION',
  UNREGISTERED = 'UNREGISTERED',
  EXPORT = 'EXPORT',
  SEZ = 'SEZ',
}

export enum ProductUnit {
  PCS = 'PCS',
  KG = 'KG',
  GRAM = 'GRAM',
  LITRE = 'LITRE',
  METRE = 'METRE',
  BOX = 'BOX',
  DOZEN = 'DOZEN',
  SET = 'SET',
  PAIR = 'PAIR',
  BUNDLE = 'BUNDLE',
  HOUR = 'HOUR',
  DAY = 'DAY',
  MONTH = 'MONTH',
  SERVICE = 'SERVICE',
}

export enum NotificationType {
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_SENT = 'INVOICE_SENT',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  LOW_STOCK = 'LOW_STOCK',
  NEW_CUSTOMER = 'NEW_CUSTOMER',
  SYSTEM = 'SYSTEM',
}

// ─── Core Types ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  name: string;
  legalName: string | null;
  gstin: string | null;
  pan: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  gstType: GstType;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  bankName: string | null;
  accountNo: string | null;
  ifsc: string | null;
  upiId: string | null;
  invoicePrefix: string;
  invoiceSeq: number;
  currency: string;
  ownerId: string;
  planId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  invoicePrefix: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  yearlyPrice: number | null;
  currency: string;
  invoiceLimit: number;
  customerLimit: number;
  productLimit: number;
  userLimit: number;
  storageLimit: number;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  businessId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  trialEndsAt: Date | null;
  razorpaySubId: string | null;
  amount: number;
  currency: string;
  cancelledAt: Date | null;
  createdAt: Date;
  plan?: Plan;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  gstType: GstType;
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPincode: string | null;
  billingCountry: string;
  shippingAddress: string | null;
  ledgerBalance: number;
  creditLimit: number;
  creditDays: number;
  notes: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  hsnSac: string | null;
  type: string;
  unit: ProductUnit;
  price: number;
  costPrice: number | null;
  mrp: number | null;
  gstRate: number;
  cessRate: number | null;
  category: string | null;
  brand: string | null;
  images: string[];
  stockCount: number | null;
  lowStockAlert: number | null;
  isActive: boolean;
  isTaxable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  hsnSac: string | null;
  quantity: number;
  unit: string | null;
  price: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
  sortOrder: number;
  product?: Product;
}

export interface Invoice {
  id: string;
  businessId: string;
  customerId: string;
  branchId: string | null;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  gstTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  isInterState: boolean;
  placeOfSupply: string | null;
  notes: string | null;
  terms: string | null;
  isPaid: boolean;
  paidAt: Date | null;
  sentAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  businessId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayId: string | null;
  transactionRef: string | null;
  bankRef: string | null;
  notes: string | null;
  paidAt: Date;
  createdAt: Date;
}

export interface Expense {
  id: string;
  businessId: string;
  category: string;
  amount: number;
  description: string | null;
  date: Date;
  receipt: string | null;
  vendor: string | null;
  gstAmount: number | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  businessId: string | null;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Notification {
  id: string;
  userId: string;
  businessId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface Module {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isCore: boolean;
  isActive: boolean;
  sortOrder: number;
  requiredPlan: string | null;
  createdAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  businessId: string | null;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  adminReply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}

// ─── API Types ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Auth Request/Response Types
export interface RegisterRequest {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  businessName: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface OtpSendRequest {
  phone?: string;
  email?: string;
  purpose: 'login' | 'verify' | 'reset';
}

export interface OtpVerifyRequest {
  phone?: string;
  email?: string;
  code: string;
  purpose: 'login' | 'verify' | 'reset';
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  business: Business | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  businessId: string | null;
  iat?: number;
  exp?: number;
}

// Invoice Request Types
export interface CreateInvoiceRequest {
  customerId: string;
  branchId?: string;
  type?: InvoiceType;
  issueDate?: string;
  dueDate?: string;
  items: CreateInvoiceItemRequest[];
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  isInterState?: boolean;
  placeOfSupply?: string;
  notes?: string;
  terms?: string;
}

export interface CreateInvoiceItemRequest {
  productId?: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  price: number;
  discount?: number;
  gstRate?: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number;
  totalRevenueGrowth: number;
  invoicesCount: number;
  invoicesGrowth: number;
  customersCount: number;
  customersGrowth: number;
  pendingAmount: number;
  overdueAmount: number;
  recentInvoices: Invoice[];
  topCustomers: { customer: Customer; totalAmount: number }[];
  monthlyRevenue: { month: string; revenue: number; invoices: number }[];
}

export interface GstSummary {
  period: string;
  totalSales: number;
  totalPurchases: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  netGstLiability: number;
  b2bInvoices: Invoice[];
  b2cInvoices: Invoice[];
}
