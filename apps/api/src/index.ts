// env.ts MUST be the first import — it loads dotenv before Prisma or Express
// modules are initialised so that DATABASE_URL and JWT_SECRET are available.
import './env';

import app from './app';
import prisma from './utils/prisma';

const PORT = parseInt(process.env.API_PORT || '4000', 10);

const DEFAULT_PLANS = [
  {
    name: 'Free', slug: 'free', description: 'Perfect for freelancers',
    price: 0, invoiceLimit: 5, customerLimit: 10, productLimit: 10, userLimit: 1, storageLimit: 50,
    features: ['5 invoices/month', '10 customers', 'PDF download', 'Basic GST reports', 'Email support'],
    sortOrder: 0, isFeatured: false,
  },
  {
    name: 'Starter', slug: 'starter', description: 'For growing businesses',
    price: 149, yearlyPrice: 1490, invoiceLimit: 100, customerLimit: 200, productLimit: 100, userLimit: 2, storageLimit: 500,
    features: ['100 invoices/month', '200 customers', '2 team members', 'GST reports', 'Email invoices', 'Payment tracking'],
    sortOrder: 1, isFeatured: false,
  },
  {
    name: 'Pro', slug: 'pro', description: 'Most popular for established businesses',
    price: 299, yearlyPrice: 2990, invoiceLimit: 500, customerLimit: 999999, productLimit: 999999, userLimit: 5, storageLimit: 2000,
    features: ['500 invoices/month', 'Unlimited customers', '5 team members', 'Advanced GST reports', 'Multi-branch', 'Payment gateway', 'Priority support'],
    sortOrder: 2, isFeatured: true,
  },
  {
    name: 'Business', slug: 'business', description: 'For large enterprises',
    price: 599, yearlyPrice: 5990, invoiceLimit: 999999, customerLimit: 999999, productLimit: 999999, userLimit: 20, storageLimit: 10000,
    features: ['Unlimited invoices', 'Unlimited customers', '20 team members', 'Full GST suite', 'API access', 'Dedicated manager'],
    sortOrder: 3, isFeatured: false,
  },
];

async function ensureDefaultPlans() {
  try {
    const count = await prisma.plan.count();
    if (count > 0) return;

    console.log('⚡ No plans found — seeding default plans...');
    await Promise.all(
      DEFAULT_PLANS.map(plan =>
        prisma.plan.upsert({
          where: { slug: plan.slug },
          update: {},
          create: plan,
        })
      )
    );
    console.log('✅ Default plans seeded');
  } catch (error) {
    console.error('⚠️  Failed to seed default plans:', error instanceof Error ? error.message : String(error));
    // Non-fatal: the API can still serve requests; plans can be seeded manually via pnpm db:seed
  }
}

async function bootstrap() {
  try {
    // Verify database connectivity before accepting traffic.
    // This surfaces a missing/incorrect DATABASE_URL early with a clear message
    // instead of silently returning "Internal server error" on every request.
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Verify the database schema has been initialised (tables exist).
    // $connect() only tests the TCP connection; it does not check schema.
    // Without this check a missing schema silently causes 500 errors on every
    // auth request, which is very hard to diagnose.
    try {
      await prisma.user.count();
      console.log('✅ Database schema verified');
    } catch {
      console.error('❌ Database schema is not initialized (tables missing).');
      console.error('   Run the following commands from the workspace root then restart:');
      console.error('     pnpm db:push     # apply schema to database');
      console.error('     pnpm db:seed     # seed plans, modules and demo data\n');
      await prisma.$disconnect();
      process.exit(1);
    }

    // Ensure default plans exist so the Billing & Plans page always renders
    // correctly even on fresh deployments where the seed has not been run yet.
    await ensureDefaultPlans();

    app.listen(PORT, () => {
      console.log(`\n🚀 Yantrix API Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   API:         http://localhost:${PORT}/api/v1`);
      console.log(`   Docs:        http://localhost:${PORT}/api/docs`);
      console.log(`   Health:      http://localhost:${PORT}/health\n`);
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to start server:', message);
    if (!process.env.DATABASE_URL) {
      console.error('\n💡 DATABASE_URL is not set.');
      console.error('   Copy .env.example to .env at the workspace root and fill in your database credentials.\n');
    } else {
      console.error('\n💡 Make sure PostgreSQL is running and the DATABASE_URL in .env is correct.\n');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
