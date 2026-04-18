import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Yantrix Invoice API',
      version: '1.0.0',
      description: 'Complete REST API for Yantrix Invoice - GST Billing SaaS for Indian SMEs',
      contact: {
        name: 'Yantrix Support',
        email: 'api@yantrix.in',
        url: 'https://yantrix.in',
      },
      license: {
        name: 'Proprietary',
        url: 'https://yantrix.in/legal',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.API_PORT || 4000}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.yantrix.in/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Your Yantrix API key',
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Business', description: 'Business management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Products', description: 'Product & service catalog' },
      { name: 'Invoices', description: 'Invoice creation & management' },
      { name: 'Payments', description: 'Payment tracking' },
      { name: 'Reports', description: 'GST reports & analytics' },
      { name: 'Subscriptions', description: 'Plan & subscription management' },
      { name: 'Modules', description: 'Feature modules' },
      { name: 'Admin', description: 'Super admin operations' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
