// env.ts MUST be the first import — it loads dotenv before Prisma or Express
// modules are initialised so that DATABASE_URL and JWT_SECRET are available.
import './env';

import app from './app';
import prisma from './utils/prisma';

const PORT = parseInt(process.env.API_PORT || '4000', 10);

async function bootstrap() {
  try {
    // Verify database connectivity before accepting traffic.
    // This surfaces a missing/incorrect DATABASE_URL early with a clear message
    // instead of silently returning "Internal server error" on every request.
    await prisma.$connect();
    console.log('✅ Database connected successfully');

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
