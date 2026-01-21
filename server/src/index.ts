import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: Allow all origins for now to fix the issue
// You can restrict this later by setting CLIENT_URL
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

console.log('🔧 CORS: Allowing all origins');

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth.js';
import freelancerRoutes from './routes/freelancers.js';
import clientRoutes from './routes/clients.js';
import testRoutes from './routes/tests.js';
import scopeRoutes from './routes/scopes.js';
import projectRoutes from './routes/projects.js';
import escalationRoutes from './routes/escalations.js';
import adminRoutes from './routes/admin.js';
import auditRoutes from './routes/audit.js';
import fieldsRoutes from './routes/fields.js';
import invitationRoutes from './routes/invitations.js';
import pricingRoutes from './routes/pricing.js';

app.use('/api/auth', authRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/scopes', scopeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/fields', fieldsRoutes);
app.use('/api/pricing', pricingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
import { errorHandler } from './middleware/errorHandler.js';
app.use(errorHandler);

// Initialize database and app
const initializeApp = async () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is required in production. Set it in Environment Variables.');
      process.exit(1);
    }
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is required in production. Set it in Environment Variables.');
      process.exit(1);
    }
  }

  await connectDatabase();

  // Create default admin user from .env
  const { createDefaultAdmin } = await import('./utils/createDefaultAdmin.js');
  await createDefaultAdmin();

  // Check for required environment variables
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not set. Test generation will use fallback.');
    console.warn('   To enable Gemini API, add GEMINI_API_KEY to your .env file');
  } else {
    console.log('✅ Gemini API key configured');
  }

  // Seed pricing data
  const { seedPricingData } = await import('./config/seedPricing.js');
  await seedPricingData();
};

// Start server only if not in serverless environment (Vercel)
const startServer = async () => {
  await initializeApp();

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

// Export for Vercel serverless
export default app;

// Initialize app for serverless (Vercel will handle this)
if (process.env.VERCEL) {
  initializeApp().catch(console.error);
} else {
  // Start traditional server for local development
  startServer().catch(console.error);
}
