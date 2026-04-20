"use strict";
// ─── Enums ──────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.ProductUnit = exports.GstType = exports.SubscriptionStatus = exports.PaymentStatus = exports.PaymentMethod = exports.InvoiceStatus = exports.InvoiceType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["OWNER"] = "OWNER";
    UserRole["ACCOUNTANT"] = "ACCOUNTANT";
    UserRole["STAFF"] = "STAFF";
    UserRole["CUSTOMER"] = "CUSTOMER";
})(UserRole || (exports.UserRole = UserRole = {}));
var InvoiceType;
(function (InvoiceType) {
    InvoiceType["INVOICE"] = "INVOICE";
    InvoiceType["PROFORMA"] = "PROFORMA";
    InvoiceType["CREDIT_NOTE"] = "CREDIT_NOTE";
    InvoiceType["DEBIT_NOTE"] = "DEBIT_NOTE";
    InvoiceType["ESTIMATE"] = "ESTIMATE";
    InvoiceType["RECEIPT"] = "RECEIPT";
})(InvoiceType || (exports.InvoiceType = InvoiceType = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["SENT"] = "SENT";
    InvoiceStatus["VIEWED"] = "VIEWED";
    InvoiceStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["OVERDUE"] = "OVERDUE";
    InvoiceStatus["CANCELLED"] = "CANCELLED";
    InvoiceStatus["REFUNDED"] = "REFUNDED";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["CHEQUE"] = "CHEQUE";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["RAZORPAY"] = "RAZORPAY";
    PaymentMethod["OTHER"] = "OTHER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["TRIAL"] = "TRIAL";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var GstType;
(function (GstType) {
    GstType["REGULAR"] = "REGULAR";
    GstType["COMPOSITION"] = "COMPOSITION";
    GstType["UNREGISTERED"] = "UNREGISTERED";
    GstType["EXPORT"] = "EXPORT";
    GstType["SEZ"] = "SEZ";
})(GstType || (exports.GstType = GstType = {}));
var ProductUnit;
(function (ProductUnit) {
    ProductUnit["PCS"] = "PCS";
    ProductUnit["KG"] = "KG";
    ProductUnit["GRAM"] = "GRAM";
    ProductUnit["LITRE"] = "LITRE";
    ProductUnit["METRE"] = "METRE";
    ProductUnit["BOX"] = "BOX";
    ProductUnit["DOZEN"] = "DOZEN";
    ProductUnit["SET"] = "SET";
    ProductUnit["PAIR"] = "PAIR";
    ProductUnit["BUNDLE"] = "BUNDLE";
    ProductUnit["HOUR"] = "HOUR";
    ProductUnit["DAY"] = "DAY";
    ProductUnit["MONTH"] = "MONTH";
    ProductUnit["SERVICE"] = "SERVICE";
})(ProductUnit || (exports.ProductUnit = ProductUnit = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["INVOICE_CREATED"] = "INVOICE_CREATED";
    NotificationType["INVOICE_SENT"] = "INVOICE_SENT";
    NotificationType["INVOICE_PAID"] = "INVOICE_PAID";
    NotificationType["INVOICE_OVERDUE"] = "INVOICE_OVERDUE";
    NotificationType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    NotificationType["SUBSCRIPTION_EXPIRING"] = "SUBSCRIPTION_EXPIRING";
    NotificationType["SUBSCRIPTION_RENEWED"] = "SUBSCRIPTION_RENEWED";
    NotificationType["LOW_STOCK"] = "LOW_STOCK";
    NotificationType["NEW_CUSTOMER"] = "NEW_CUSTOMER";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=index.js.map