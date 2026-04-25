import { PrismaClient, UserRole, GstType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Plans
  console.log('Creating plans...');
  // Feature lists are also used by the client nav-gating logic to determine which
  // sidebar items are accessible for a given plan (and for expired plans falling
  // back to the free tier).  Each keyword in NAV_FEATURE_REQUIREMENTS must appear
  // in at least one feature string for the corresponding route to be enabled.
  const FREE_FEATURES    = ['5 invoices/month', '10 customers', 'Invoicing', 'Payments', 'Customers', 'Basic GST reports', 'PDF download', 'Email support'];
  const DAILY_FEATURES   = ['2 invoices/day', '2 customers', '1 team member', 'Invoicing', 'Payments', 'Customers'];
  const STARTER_FEATURES = ['100 invoices/month', '200 customers', '2 team members', 'Invoicing', 'Payments', 'Customers', 'Products & Services', 'GST reports', 'Expense Tracker', 'Email invoices', 'Payment tracking'];
  const PRO_FEATURES     = ['500 invoices/month', 'Unlimited customers', '5 team members', 'Invoicing', 'Payments', 'Customers', 'Products & Services', 'Advanced GST reports', 'Expense Tracker', 'Inventory', 'HRM', 'CRM', 'Multi-branch', 'Payment gateway', 'Priority support'];
  const BUSINESS_FEATURES = ['Unlimited invoices', 'Unlimited customers', '20 team members', 'Invoicing', 'Payments', 'Customers', 'Products & Services', 'Full GST suite', 'Expense Tracker', 'Inventory', 'HRM', 'CRM', 'API access', 'Multi-branch', 'Dedicated manager'];
  const YEARLY_FEATURES  = ['500 invoices/year', '500 customers', '2 team members', 'Invoicing', 'Payments', 'Customers', 'Products & Services', 'GST reports', 'Email invoices'];

  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: { features: FREE_FEATURES },
    create: {
      name: 'Free', slug: 'free', description: 'Perfect for freelancers',
      price: 0, invoiceLimit: 5, customerLimit: 10, productLimit: 10, userLimit: 1, storageLimit: 50,
      features: FREE_FEATURES,
      sortOrder: 0,
    },
  });

  // Fix any existing Daily plan whose slug was incorrectly set, then upsert.
  await prisma.plan.updateMany({ where: { name: 'Daily', NOT: { slug: 'daily' } }, data: { slug: 'daily' } });
  const dailyPlan = await prisma.plan.upsert({
    where: { slug: 'daily' },
    update: { dailyPrice: 10, features: DAILY_FEATURES },
    create: {
      name: 'Daily', slug: 'daily', description: 'Try out Yantrix for a day',
      price: 0, dailyPrice: 10, invoiceLimit: 2, customerLimit: 2, productLimit: 5, userLimit: 1, storageLimit: 50,
      features: DAILY_FEATURES,
      sortOrder: -1,
    },
  });

  const starterPlan = await prisma.plan.upsert({
    where: { slug: 'starter' }, update: { features: STARTER_FEATURES },
    create: {
      name: 'Starter', slug: 'starter', description: 'For growing businesses',
      price: 149, yearlyPrice: 1490, invoiceLimit: 100, customerLimit: 200, productLimit: 100, userLimit: 2, storageLimit: 500,
      features: STARTER_FEATURES,
      sortOrder: 1,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' }, update: { features: PRO_FEATURES },
    create: {
      name: 'Pro', slug: 'pro', description: 'Most popular for established businesses',
      price: 299, yearlyPrice: 2990, invoiceLimit: 500, customerLimit: 999999, productLimit: 999999, userLimit: 5, storageLimit: 2000,
      features: PRO_FEATURES,
      sortOrder: 2, isFeatured: true,
    },
  });

  const businessPlan = await prisma.plan.upsert({
    where: { slug: 'business' }, update: { features: BUSINESS_FEATURES },
    create: {
      name: 'Business', slug: 'business', description: 'For large enterprises',
      price: 599, yearlyPrice: 5990, invoiceLimit: 999999, customerLimit: 999999, productLimit: 999999, userLimit: 20, storageLimit: 10000,
      features: BUSINESS_FEATURES,
      sortOrder: 3,
    },
  });

  // Fix any existing Yearly plan whose slug was incorrectly set, then upsert.
  await prisma.plan.updateMany({ where: { name: 'Yearly', NOT: { slug: 'yearly' } }, data: { slug: 'yearly' } });
  const yearlyPlan = await prisma.plan.upsert({
    where: { slug: 'yearly' },
    update: { yearlyPrice: 999, features: YEARLY_FEATURES },
    create: {
      name: 'Yearly', slug: 'yearly', description: 'Annual plan — pay once, save more',
      price: 0, yearlyPrice: 999, invoiceLimit: 500, customerLimit: 500, productLimit: 200, userLimit: 2, storageLimit: 1000,
      features: YEARLY_FEATURES,
      sortOrder: 5,
    },
  });

  console.log('  ✓ 6 plans created\n');

  // Modules
  console.log('Creating modules...');
  const modDefs = [
    { name: 'Invoicing', slug: 'invoicing', isCore: true, sortOrder: 0 },
    { name: 'Payments', slug: 'payments', isCore: true, sortOrder: 1 },
    { name: 'Customers', slug: 'customers', isCore: true, sortOrder: 2 },
    { name: 'Products & Services', slug: 'products', isCore: true, sortOrder: 3 },
    { name: 'GST Reports', slug: 'gst-reports', isCore: true, sortOrder: 4 },
    { name: 'Expense Tracker', slug: 'expenses', isCore: false, sortOrder: 5, requiredPlan: 'starter' },
    { name: 'Inventory', slug: 'inventory', isCore: false, sortOrder: 6, requiredPlan: 'pro' },
    { name: 'HRMS', slug: 'hrms', isCore: false, isActive: true, requiredPlan: 'pro', sortOrder: 10 },
    { name: 'CRM', slug: 'crm', isCore: false, isActive: true, requiredPlan: 'pro', sortOrder: 11 },
  ];

  const moduleMap: Record<string, any> = {};
  for (const m of modDefs) {
    const mod = await prisma.module.upsert({
      where: { slug: m.slug }, update: {},
      create: { name: m.name, slug: m.slug, isCore: m.isCore ?? false, isActive: m.isActive ?? true, sortOrder: m.sortOrder, requiredPlan: m.requiredPlan ?? null },
    });
    moduleMap[m.slug] = mod;
  }
  console.log('  ✓ 9 modules created\n');

  // Super Admin
  console.log('Creating super admin...');
  const adminHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@yantrix.in' }, update: {},
    create: { name: 'Super Admin', email: 'admin@yantrix.in', phone: '+919999999999', passwordHash: adminHash, role: UserRole.SUPER_ADMIN, isActive: true, isVerified: true },
  });
  console.log('  ✓ admin@yantrix.in / Admin@123\n');

  // Demo User
  console.log('Creating demo user & business...');
  const demoHash = await bcrypt.hash('Demo@123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@yantrix.in' }, update: {},
    create: { name: 'Demo User', email: 'demo@yantrix.in', phone: '+919876543210', passwordHash: demoHash, role: UserRole.OWNER, isActive: true, isVerified: true },
  });

  const demoBiz = await prisma.business.upsert({
    where: { gstin: '29AABCD1234E1ZX' }, update: {},
    create: {
      name: 'Demo Tech Solutions Pvt Ltd', legalName: 'Demo Tech Solutions Private Limited',
      gstin: '29AABCD1234E1ZX', pan: 'AABCD1234E',
      email: 'billing@demotechsolutions.in', phone: '+919876543210',
      gstType: GstType.REGULAR,
      address: '123, Tech Park, MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001',
      bankName: 'HDFC Bank', accountNo: '50100123456789', ifsc: 'HDFC0001234', upiId: 'demo@hdfc',
      invoicePrefix: 'DTS', invoiceSeq: 48,
      termsAndConditions: 'Payment due within 30 days. Late payment will attract 2% interest per month.',
      ownerId: demoUser.id, planId: proPlan.id,
    },
  });

  await prisma.membership.upsert({
    where: { userId_businessId: { userId: demoUser.id, businessId: demoBiz.id } }, update: {},
    create: { userId: demoUser.id, businessId: demoBiz.id, role: UserRole.OWNER, permissions: ['*'], isActive: true, joinedAt: new Date() },
  });

  // Enable core modules for demo biz
  for (const slug of ['invoicing', 'payments', 'customers', 'products', 'gst-reports', 'expenses']) {
    const mod = moduleMap[slug];
    if (mod) {
      await prisma.businessModule.upsert({
        where: { businessId_moduleId: { businessId: demoBiz.id, moduleId: mod.id } }, update: {},
        create: { businessId: demoBiz.id, moduleId: mod.id, isEnabled: true },
      });
    }
  }

  // Subscription
  const existingSub = await prisma.subscription.findFirst({ where: { businessId: demoBiz.id } });
  if (!existingSub) {
    await prisma.subscription.create({
      data: { businessId: demoBiz.id, planId: proPlan.id, status: 'ACTIVE', startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), amount: proPlan.price },
    });
  }

  console.log('  ✓ demo@yantrix.in / Demo@123');
  console.log('  ✓ Business: Demo Tech Solutions (GSTIN: 29AABCD1234E1ZX, Plan: Pro)\n');

  // Demo Customers
  console.log('Creating demo customers...');
  const c1 = await prisma.customer.upsert({
    where: { id: 'cust_001' }, update: {},
    create: { id: 'cust_001', businessId: demoBiz.id, name: 'Acme Corporation', email: 'billing@acmecorp.com', phone: '+919811223344', gstin: '07AABCA1234B1ZX', gstType: GstType.REGULAR, billingAddress: '456, Connaught Place', billingCity: 'New Delhi', billingState: 'Delhi', billingPincode: '110001', creditDays: 30 },
  });
  const c2 = await prisma.customer.upsert({
    where: { id: 'cust_002' }, update: {},
    create: { id: 'cust_002', businessId: demoBiz.id, name: 'Sharma Enterprises', email: 'accounts@sharmaent.in', phone: '+919922334455', gstin: '27AABCS5658K1ZQ', gstType: GstType.REGULAR, billingCity: 'Mumbai', billingState: 'Maharashtra', creditDays: 45 },
  });
  const c3 = await prisma.customer.upsert({
    where: { id: 'cust_003' }, update: {},
    create: { id: 'cust_003', businessId: demoBiz.id, name: 'Patel Trading Co', phone: '+919988776655', gstType: GstType.UNREGISTERED, billingCity: 'Ahmedabad', billingState: 'Gujarat' },
  });
  console.log('  ✓ 3 customers created\n');

  // Demo Products
  console.log('Creating demo products...');
  const p1 = await prisma.product.upsert({
    where: { id: 'prod_001' }, update: {},
    create: { id: 'prod_001', businessId: demoBiz.id, name: 'Web Development Services', hsnSac: '998314', type: 'service', price: 50000, gstRate: 18, category: 'Technology' },
  });
  const p2 = await prisma.product.upsert({
    where: { id: 'prod_002' }, update: {},
    create: { id: 'prod_002', businessId: demoBiz.id, name: 'Monthly Maintenance', hsnSac: '998313', type: 'service', price: 5000, gstRate: 18, category: 'Technology' },
  });
  console.log('  ✓ 2 products created\n');

  // Demo Invoice
  console.log('Creating demo invoices...');
  const inv1 = await prisma.invoice.upsert({
    where: { businessId_invoiceNumber: { businessId: demoBiz.id, invoiceNumber: 'DTS-0047' } }, update: {},
    create: {
      businessId: demoBiz.id, customerId: c1.id, invoiceNumber: 'DTS-0047', type: 'INVOICE', status: 'PAID',
      issueDate: new Date('2024-11-20'), dueDate: new Date('2024-12-20'),
      subtotal: 21949.15, taxableAmount: 21949.15, cgstTotal: 1975.42, sgstTotal: 1975.42, gstTotal: 3950.85, total: 25900,
      amountPaid: 25900, amountDue: 0, isPaid: true, paidAt: new Date('2024-11-22'), isInterState: false, placeOfSupply: 'Karnataka',
      notes: 'Thank you for your business!', terms: 'Payment due within 30 days.', createdById: demoUser.id,
      items: { create: [{ productId: p1.id, description: 'Web Development Services', hsnSac: '998314', quantity: 1, price: 21949.15, gstRate: 18, taxableAmount: 21949.15, cgst: 1975.42, sgst: 1975.42, total: 25900 }] },
    },
  });

  await prisma.payment.upsert({
    where: { id: 'pay_001' }, update: {},
    create: { id: 'pay_001', invoiceId: inv1.id, businessId: demoBiz.id, amount: 25900, method: 'BANK_TRANSFER', status: 'SUCCESS', transactionRef: 'HDFC/24/112233', paidAt: new Date('2024-11-22') },
  }).catch(() => {});

  console.log('  ✓ 1 invoice with payment created\n');

  // Invoice Templates
  console.log('Creating invoice templates...');

  const classicHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice {{invoiceNumber}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Georgia, serif; color: #1a1a1a; background: #ffffff; font-size: 13px; }

    /* ── HEADER ── */
    .header { padding: 36px 48px 24px; border-bottom: 3px double #1a1a1a; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo-area { display: flex; align-items: center; gap: 16px; }
    .logo-box { width: 60px; height: 60px; border: 2px solid #1a1a1a; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; overflow: hidden; }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .biz-name { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .biz-gstin { font-size: 11px; color: #555; margin-top: 2px; font-family: 'Courier New', monospace; }
    .biz-address { font-size: 11px; color: #555; margin-top: 2px; line-height: 1.6; }
    .invoice-title-area { text-align: right; }
    .invoice-title { font-size: 32px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #1a1a1a; }
    .invoice-sub { font-size: 12px; color: #555; margin-top: 6px; line-height: 1.8; }
    .invoice-sub strong { color: #1a1a1a; }

    /* ── PARTIES ── */
    .parties { display: flex; gap: 0; margin: 24px 48px 0; border: 1px solid #1a1a1a; }
    .party { flex: 1; padding: 16px 20px; }
    .party + .party { border-left: 1px solid #1a1a1a; }
    .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #777; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
    .party-name { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
    .party-detail { font-size: 11px; color: #555; line-height: 1.7; }
    .gstin-tag { display: inline-block; font-family: 'Courier New', monospace; font-size: 10px; border: 1px solid #999; padding: 1px 5px; margin-top: 3px; }

    /* ── SUPPLY INFO ── */
    .supply-bar { margin: 0 48px; border: 1px solid #1a1a1a; border-top: none; padding: 8px 20px; display: flex; gap: 40px; font-size: 11px; background: #f8f8f8; }
    .supply-bar span { font-weight: 700; color: #1a1a1a; }

    /* ── ITEMS TABLE ── */
    .table-wrap { margin: 24px 48px 0; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #1a1a1a; color: #fff; }
    th { padding: 9px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    th:nth-child(n+4), td:nth-child(n+4) { text-align: right; }
    tbody tr { border-bottom: 1px solid #ddd; }
    tbody tr:nth-child(even) { background: #fafafa; }
    td { padding: 10px 12px; font-size: 12px; color: #333; }
    td:first-child { color: #999; text-align: center; }
    .item-name { font-weight: 600; color: #1a1a1a; }
    .item-hsn { font-size: 10px; color: #999; font-family: 'Courier New', monospace; }
    .amount-cell { font-weight: 600; }
    tfoot tr { border-top: 2px solid #1a1a1a; }
    tfoot td { padding: 8px 12px; font-size: 12px; }

    /* ── TOTALS ── */
    .totals-section { display: flex; justify-content: space-between; align-items: flex-start; margin: 20px 48px 0; gap: 20px; }
    .words-box { flex: 1; border: 1px solid #ddd; padding: 14px 16px; background: #fafafa; }
    .words-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 5px; }
    .words-text { font-size: 12px; font-style: italic; color: #1a1a1a; font-weight: 600; line-height: 1.5; }
    .totals-box { min-width: 260px; border: 1px solid #1a1a1a; }
    .totals-row { display: flex; justify-content: space-between; padding: 7px 16px; font-size: 12px; border-bottom: 1px solid #e5e5e5; }
    .totals-row .lbl { color: #555; }
    .totals-row .val { font-weight: 500; color: #1a1a1a; }
    .totals-grand { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 15px; font-weight: 700; background: #1a1a1a; color: #fff; }
    .totals-due { display: flex; justify-content: space-between; padding: 7px 16px; font-size: 13px; font-weight: 700; background: #f0f0f0; }
    .totals-due .lbl { color: #333; }
    .totals-due .val { color: #c0392b; }

    /* ── FOOTER ── */
    .footer { margin: 28px 48px 0; display: flex; gap: 24px; border-top: 2px double #1a1a1a; padding-top: 20px; }
    .footer-col { flex: 1; }
    .footer-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 5px; }
    .footer-text { font-size: 11px; color: #555; line-height: 1.7; }
    .seal-box { border: 1px dashed #999; min-height: 64px; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 10px; margin-top: 6px; }
    .footer-bottom { margin: 20px 48px 32px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="logo-area">
      <div class="logo-box"><img src="{{businessLogo}}" alt="{{businessName}}" onerror="this.parentElement.innerHTML='{{businessInitial}}'" /></div>
      <div>
        <div class="biz-name">{{businessName}}</div>
        <div class="biz-gstin">GSTIN: {{businessGstin}}</div>
        <div class="biz-address">{{businessAddress}}, {{businessCity}}, {{businessState}}</div>
        <div class="biz-address">Ph: {{businessPhone}} | {{businessEmail}}</div>
      </div>
    </div>
    <div class="invoice-title-area">
      <div class="invoice-title">{{invoiceType}}</div>
      <div class="invoice-sub"><strong>#</strong> {{invoiceNumber}}</div>
      <div class="invoice-sub"><strong>Issue Date:</strong> {{issueDate}}</div>
      <div class="invoice-sub"><strong>Due Date:</strong> {{dueDate}}</div>
    </div>
  </div>

  <!-- PARTIES -->
  <div class="parties">
    <div class="party">
      <div class="party-label">Bill To</div>
      <div class="party-name">{{customerName}}</div>
      <div class="party-detail">{{customerAddress}}</div>
      <div class="party-detail">{{customerCity}}, {{customerState}}</div>
      <div class="party-detail">{{customerEmail}} | {{customerPhone}}</div>
      {{#customerGstin}}<div class="gstin-tag">GSTIN: {{customerGstin}}</div>{{/customerGstin}}
      {{#customerPan}}<div class="party-detail">PAN: {{customerPan}}</div>{{/customerPan}}
    </div>
    <div class="party">
      <div class="party-label">Invoice Details</div>
      <div class="party-detail" style="line-height:2.1;">
        <strong>Invoice No:</strong> {{invoiceNumber}}<br>
        <strong>Issue Date:</strong> {{issueDate}}<br>
        <strong>Due Date:</strong> {{dueDate}}<br>
        <strong>Type:</strong> {{invoiceType}}
      </div>
    </div>
  </div>

  <!-- SUPPLY INFO -->
  <div class="supply-bar">
    <div>Place of Supply: <span>{{placeOfSupply}}</span></div>
    <div>Tax Type: <span>{{taxType}}</span></div>
  </div>

  <!-- ITEMS TABLE -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:32px;text-align:center;">#</th>
          <th>Description</th>
          <th>HSN/SAC</th>
          <th>Qty</th>
          <th>Rate (₹)</th>
          <th>GST %</th>
          <th>Amount (₹)</th>
        </tr>
      </thead>
      <tbody>{{#items}}
        <tr>
          <td>{{index}}</td>
          <td><div class="item-name">{{description}}</div><div class="item-hsn">{{hsnSac}}</div></td>
          <td><span class="item-hsn">{{hsnSac}}</span></td>
          <td>{{quantity}} {{unit}}</td>
          <td>{{price}}</td>
          <td>{{gstRate}}%</td>
          <td class="amount-cell">{{total}}</td>
        </tr>
      {{/items}}</tbody>
    </table>
  </div>

  <!-- TOTALS -->
  <div class="totals-section">
    <div class="words-box">
      <div class="words-label">Amount in Words</div>
      <div class="words-text">{{amountInWords}}</div>
    </div>
    <div class="totals-box">
      <div class="totals-row"><span class="lbl">Taxable Amount</span><span class="val">₹{{taxableAmount}}</span></div>
      <div class="totals-row"><span class="lbl">CGST</span><span class="val">₹{{cgst}}</span></div>
      <div class="totals-row"><span class="lbl">SGST</span><span class="val">₹{{sgst}}</span></div>
      <div class="totals-row"><span class="lbl">IGST</span><span class="val">₹{{igst}}</span></div>
      <div class="totals-grand"><span>Grand Total</span><span>₹{{total}}</span></div>
      <div class="totals-due"><span class="lbl">Balance Due</span><span class="val">₹{{amountDue}}</span></div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-col">
      <div class="footer-label">Notes</div>
      <div class="footer-text">{{notes}}</div>
    </div>
    <div class="footer-col">
      <div class="footer-label">Terms &amp; Conditions</div>
      <div class="footer-text">{{terms}}</div>
    </div>
    <div class="footer-col" style="max-width:150px;text-align:center;">
      <div class="footer-label">Authorised Signatory</div>
      <div class="seal-box">Seal &amp; Signature</div>
      <div class="footer-text" style="margin-top:6px;text-align:center;">{{businessName}}</div>
    </div>
  </div>

  <div class="footer-bottom">
    This is a computer-generated invoice and does not require a physical signature. &nbsp;|&nbsp; {{businessName}} &nbsp;|&nbsp; GSTIN: {{businessGstin}}
  </div>

</body>
</html>`;

  const professionalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice {{invoiceNumber}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', 'Inter', Arial, sans-serif; color: #1e293b; background: #ffffff; font-size: 13px; }

    /* ── ACCENT BAR ── */
    .accent-bar { height: 6px; background: linear-gradient(90deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%); }

    /* ── HEADER ── */
    .header { padding: 32px 48px 28px; display: flex; justify-content: space-between; align-items: flex-start; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .logo-area { display: flex; align-items: center; gap: 14px; }
    .logo-circle { width: 58px; height: 58px; border-radius: 14px; background: linear-gradient(135deg, #0ea5e9, #6366f1); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #fff; overflow: hidden; flex-shrink: 0; }
    .logo-circle img { width: 100%; height: 100%; object-fit: contain; border-radius: 14px; }
    .biz-name { font-size: 19px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
    .biz-gstin { font-size: 11px; color: #64748b; margin-top: 2px; font-family: 'Courier New', monospace; }
    .biz-contact { font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.7; }
    .invoice-badge { text-align: right; }
    .badge-pill { display: inline-block; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 5px 16px; border-radius: 20px; margin-bottom: 10px; }
    .invoice-num { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .invoice-dates { font-size: 12px; color: #64748b; margin-top: 6px; line-height: 1.9; }
    .invoice-dates strong { color: #334155; }

    /* ── PARTIES SECTION ── */
    .parties-section { display: flex; gap: 0; margin: 24px 48px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .party-card { flex: 1; padding: 18px 22px; background: #fff; }
    .party-card + .party-card { border-left: 1px solid #e2e8f0; }
    .party-card.highlight { background: #f0f9ff; }
    .party-heading { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #0ea5e9; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
    .party-heading::before { content: ''; display: inline-block; width: 3px; height: 12px; background: #0ea5e9; border-radius: 2px; }
    .party-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .party-detail { font-size: 11px; color: #64748b; line-height: 1.8; }
    .gstin-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-family: 'Courier New', monospace; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 5px; padding: 2px 7px; margin-top: 4px; }

    /* ── SUPPLY STRIP ── */
    .supply-strip { margin: 0 48px 24px; background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); border-radius: 8px; padding: 10px 20px; display: flex; gap: 40px; color: #fff; font-size: 12px; }
    .supply-strip strong { font-weight: 700; }

    /* ── TABLE ── */
    .table-wrap { margin: 0 48px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); color: #fff; }
    th { padding: 11px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; text-align: left; }
    th:nth-child(n+4), td:nth-child(n+4) { text-align: right; }
    tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td { padding: 12px 14px; font-size: 12px; color: #334155; }
    td:first-child { color: #94a3b8; font-size: 11px; text-align: center; }
    .item-name { font-weight: 600; color: #0f172a; }
    .item-hsn { font-size: 10px; color: #94a3b8; font-family: 'Courier New', monospace; margin-top: 2px; }
    .amount-cell { font-weight: 700; color: #0f172a; }

    /* ── TOTALS ── */
    .bottom-section { display: flex; justify-content: space-between; align-items: flex-start; margin: 24px 48px 0; gap: 24px; }
    .words-card { flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 18px; }
    .words-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #3b82f6; margin-bottom: 6px; }
    .words-text { font-size: 13px; font-weight: 600; color: #1e3a8a; font-style: italic; line-height: 1.6; }
    .totals-card { min-width: 280px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 18px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
    .totals-row .lbl { color: #64748b; }
    .totals-row .val { font-weight: 500; color: #1e293b; }
    .totals-grand { display: flex; justify-content: space-between; padding: 12px 18px; font-size: 16px; font-weight: 800; background: linear-gradient(90deg, #0ea5e9, #6366f1); color: #fff; }
    .totals-due { display: flex; justify-content: space-between; padding: 9px 18px; font-size: 13px; font-weight: 700; background: #fef2f2; }
    .totals-due .lbl { color: #b91c1c; }
    .totals-due .val { color: #b91c1c; }

    /* ── FOOTER ── */
    .footer-section { margin: 28px 48px 0; padding-top: 22px; border-top: 2px solid #e2e8f0; display: flex; gap: 24px; }
    .footer-col { flex: 1; }
    .footer-heading { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #0ea5e9; margin-bottom: 7px; }
    .footer-text { font-size: 11px; color: #64748b; line-height: 1.8; }
    .sign-box { border: 1.5px dashed #cbd5e1; border-radius: 8px; min-height: 68px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 10px; margin-top: 8px; }
    .sign-name { font-size: 11px; font-weight: 600; color: #334155; text-align: center; margin-top: 7px; }

    /* ── BOTTOM BAR ── */
    .bottom-bar { margin: 24px 48px 36px; background: #f8fafc; border-radius: 8px; padding: 12px 20px; text-align: center; font-size: 10.5px; color: #94a3b8; border: 1px solid #e2e8f0; }
    .bottom-bar strong { color: #475569; }
  </style>
</head>
<body>

  <div class="accent-bar"></div>

  <!-- HEADER -->
  <div class="header">
    <div class="logo-area">
      <div class="logo-circle"><img src="{{businessLogo}}" alt="{{businessName}}" onerror="this.parentElement.innerHTML='{{businessInitial}}'" /></div>
      <div>
        <div class="biz-name">{{businessName}}</div>
        <div class="biz-gstin">GSTIN: {{businessGstin}}</div>
        <div class="biz-contact">{{businessAddress}}, {{businessCity}}, {{businessState}}</div>
        <div class="biz-contact">{{businessPhone}} &nbsp;|&nbsp; {{businessEmail}}</div>
      </div>
    </div>
    <div class="invoice-badge">
      <div class="badge-pill">{{invoiceType}}</div>
      <div class="invoice-num"># {{invoiceNumber}}</div>
      <div class="invoice-dates"><strong>Issue Date:</strong> {{issueDate}}<br><strong>Due Date:</strong> {{dueDate}}</div>
    </div>
  </div>

  <!-- PARTIES -->
  <div class="parties-section">
    <div class="party-card highlight">
      <div class="party-heading">Bill To</div>
      <div class="party-name">{{customerName}}</div>
      <div class="party-detail">{{customerAddress}}</div>
      <div class="party-detail">{{customerCity}}, {{customerState}}</div>
      <div class="party-detail">{{customerEmail}} &nbsp;|&nbsp; {{customerPhone}}</div>
      {{#customerGstin}}<div class="gstin-chip">GSTIN: {{customerGstin}}</div>{{/customerGstin}}
      {{#customerPan}}<div class="party-detail" style="margin-top:4px;">PAN: {{customerPan}}</div>{{/customerPan}}
    </div>
    <div class="party-card">
      <div class="party-heading">Invoice Info</div>
      <div class="party-detail" style="line-height:2.2;">
        <strong style="color:#334155;">Invoice No:</strong> {{invoiceNumber}}<br>
        <strong style="color:#334155;">Type:</strong> {{invoiceType}}<br>
        <strong style="color:#334155;">Issue Date:</strong> {{issueDate}}<br>
        <strong style="color:#334155;">Due Date:</strong> {{dueDate}}
      </div>
    </div>
  </div>

  <!-- SUPPLY STRIP -->
  <div class="supply-strip">
    <div>Place of Supply: <strong>{{placeOfSupply}}</strong></div>
    <div>Tax Type: <strong>{{taxType}}</strong></div>
  </div>

  <!-- ITEMS TABLE -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">#</th>
          <th>Description</th>
          <th>HSN/SAC</th>
          <th>Qty</th>
          <th>Rate (₹)</th>
          <th>GST %</th>
          <th>Amount (₹)</th>
        </tr>
      </thead>
      <tbody>{{#items}}
        <tr>
          <td>{{index}}</td>
          <td><div class="item-name">{{description}}</div><div class="item-hsn">{{hsnSac}}</div></td>
          <td><span class="item-hsn">{{hsnSac}}</span></td>
          <td>{{quantity}} {{unit}}</td>
          <td>{{price}}</td>
          <td>{{gstRate}}%</td>
          <td class="amount-cell">{{total}}</td>
        </tr>
      {{/items}}</tbody>
    </table>
  </div>

  <!-- TOTALS + WORDS -->
  <div class="bottom-section">
    <div class="words-card">
      <div class="words-label">Amount in Words</div>
      <div class="words-text">{{amountInWords}}</div>
    </div>
    <div class="totals-card">
      <div class="totals-row"><span class="lbl">Taxable Amount</span><span class="val">₹{{taxableAmount}}</span></div>
      <div class="totals-row"><span class="lbl">CGST</span><span class="val">₹{{cgst}}</span></div>
      <div class="totals-row"><span class="lbl">SGST</span><span class="val">₹{{sgst}}</span></div>
      <div class="totals-row"><span class="lbl">IGST</span><span class="val">₹{{igst}}</span></div>
      <div class="totals-grand"><span>Grand Total</span><span>₹{{total}}</span></div>
      <div class="totals-due"><span class="lbl">Balance Due</span><span class="val">₹{{amountDue}}</span></div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-section">
    <div class="footer-col">
      <div class="footer-heading">Notes</div>
      <div class="footer-text">{{notes}}</div>
    </div>
    <div class="footer-col">
      <div class="footer-heading">Terms &amp; Conditions</div>
      <div class="footer-text">{{terms}}</div>
    </div>
    <div class="footer-col" style="max-width:155px;text-align:center;">
      <div class="footer-heading" style="text-align:center;">Authorised Signatory</div>
      <div class="sign-box">Seal &amp; Signature</div>
      <div class="sign-name">{{businessName}}</div>
    </div>
  </div>

  <div class="bottom-bar">
    This is a computer-generated invoice. &nbsp;|&nbsp; <strong>{{businessName}}</strong> &nbsp;|&nbsp; GSTIN: {{businessGstin}}
  </div>

</body>
</html>`;

  await prisma.invoiceTemplate.upsert({
    where: { id: 'tpl_classic' },
    update: {},
    create: {
      id: 'tpl_classic',
      name: 'Classic',
      html: classicHtml,
      isActive: true,
      isDefault: true,
      sortOrder: 0,
    },
  });

  await prisma.invoiceTemplate.upsert({
    where: { id: 'tpl_professional' },
    update: {},
    create: {
      id: 'tpl_professional',
      name: 'Professional',
      html: professionalHtml,
      isActive: true,
      isDefault: false,
      sortOrder: 1,
    },
  });

  console.log('  ✓ 2 invoice templates created (Classic, Professional)\n');

  // System Tools
  console.log('Creating system tools...');
  await prisma.tool.upsert({
    where: { slug: 'gst-invoice' },
    update: {
      title: 'GST Invoice Tool',
      shortDescription: 'Professional GST billing, invoicing, and compliance. Auto-calculate CGST, SGST, IGST. Generate GSTR-1 and GSTR-3B reports. Built for Indian businesses.',
      category: 'Invoice',
      tags: ['GST', 'Invoice', 'Billing', 'India'],
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      featured: true,
      toolType: 'INTERNAL_APP',
      internalRoute: '/tools/gst-invoice',
      ctaText: 'Launch Tool',
      pricingType: 'FREE',
      isSystem: true,
      sortOrder: 0,
    },
    create: {
      id: 'tool_gst_invoice',
      title: 'GST Invoice Tool',
      slug: 'gst-invoice',
      shortDescription: 'Professional GST billing, invoicing, and compliance. Auto-calculate CGST, SGST, IGST. Generate GSTR-1 and GSTR-3B reports. Built for Indian businesses.',
      category: 'Invoice',
      tags: ['GST', 'Invoice', 'Billing', 'India'],
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      featured: true,
      toolType: 'INTERNAL_APP',
      internalRoute: '/tools/gst-invoice',
      ctaText: 'Launch Tool',
      pricingType: 'FREE',
      isSystem: true,
      sortOrder: 0,
    },
  });
  console.log('  ✓ GST Invoice Tool (system, non-removable)\n');

  console.log('✅ Seed complete!\n');
  console.log('🔑 Credentials:');
  console.log('   admin@yantrix.in / Admin@123 (Super Admin)');
  console.log('   demo@yantrix.in  / Demo@123  (Business Owner)\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
