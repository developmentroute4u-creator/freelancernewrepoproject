import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// Start server
const startServer = async () => {
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

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer().catch(console.error);
