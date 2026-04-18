import { PrismaClient, UserRole, GstType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Plans
  console.log('Creating plans...');
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      name: 'Free', slug: 'free', description: 'Perfect for freelancers',
      price: 0, invoiceLimit: 5, customerLimit: 10, productLimit: 10, userLimit: 1, storageLimit: 50,
      features: ['5 invoices/month', '10 customers', 'PDF download', 'Basic GST reports', 'Email support'],
      sortOrder: 0,
    },
  });

  const starterPlan = await prisma.plan.upsert({
    where: { slug: 'starter' }, update: {},
    create: {
      name: 'Starter', slug: 'starter', description: 'For growing businesses',
      price: 149, yearlyPrice: 1490, invoiceLimit: 100, customerLimit: 200, productLimit: 100, userLimit: 2, storageLimit: 500,
      features: ['100 invoices/month', '200 customers', '2 team members', 'GST reports', 'Email invoices', 'Payment tracking'],
      sortOrder: 1,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' }, update: {},
    create: {
      name: 'Pro', slug: 'pro', description: 'Most popular for established businesses',
      price: 299, yearlyPrice: 2990, invoiceLimit: 500, customerLimit: 999999, productLimit: 999999, userLimit: 5, storageLimit: 2000,
      features: ['500 invoices/month', 'Unlimited customers', '5 team members', 'Advanced GST reports', 'Multi-branch', 'Payment gateway', 'Priority support'],
      sortOrder: 2, isFeatured: true,
    },
  });

  const businessPlan = await prisma.plan.upsert({
    where: { slug: 'business' }, update: {},
    create: {
      name: 'Business', slug: 'business', description: 'For large enterprises',
      price: 599, yearlyPrice: 5990, invoiceLimit: 999999, customerLimit: 999999, productLimit: 999999, userLimit: 20, storageLimit: 10000,
      features: ['Unlimited invoices', 'Unlimited customers', '20 team members', 'Full GST suite', 'API access', 'Dedicated manager'],
      sortOrder: 3,
    },
  });

  console.log('  ✓ 4 plans created\n');

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
    { name: 'HRMS', slug: 'hrms', isCore: false, isActive: false, sortOrder: 10 },
    { name: 'CRM', slug: 'crm', isCore: false, isActive: false, sortOrder: 11 },
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
      data: { businessId: demoBiz.id, planId: proPlan.id, status: 'ACTIVE', startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), amount: proPlan.price, autoRenew: true },
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

  console.log('✅ Seed complete!\n');
  console.log('🔑 Credentials:');
  console.log('   admin@yantrix.in / Admin@123 (Super Admin)');
  console.log('   demo@yantrix.in  / Demo@123  (Business Owner)\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
