import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.API_PORT || '4000', 10);

async function bootstrap() {
  try {
    app.listen(PORT, () => {
      console.log(`\n🚀 Yantrix API Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   API:         http://localhost:${PORT}/api/v1`);
      console.log(`   Docs:        http://localhost:${PORT}/api/docs`);
      console.log(`   Health:      http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
