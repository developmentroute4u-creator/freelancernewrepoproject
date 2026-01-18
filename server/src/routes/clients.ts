import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { Client } from '../models/Client.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';

const router = express.Router();

router.use(authenticate);

// Create client profile
router.post('/', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const {
      companyName,
      industry,
      teamSize,
      contactPersonName,
      phoneNumber,
      typeOfFreelancerNeeded,
    } = req.body;

    const existingClient = await Client.findOne({ userId: req.userId });
    if (existingClient) {
      return res.status(400).json({ error: 'Client profile already exists' });
    }

    const client = await Client.create({
      userId: req.userId!,
      companyName,
      industry,
      teamSize,
      contactPersonName,
      phoneNumber,
      typeOfFreelancerNeeded,
    });

    await logAudit({
      action: AuditAction.CLIENT_REGISTERED,
      userId: req.userId!,
      entityType: 'Client',
      entityId: client._id.toString(),
      metadata: { companyName, industry },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get client profile
router.get('/me', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const client = await Client.findOne({ userId: req.userId }).populate('userId');
    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }
    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update client profile
router.patch('/me', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    await logAudit({
      action: AuditAction.CLIENT_UPDATED,
      userId: req.userId!,
      entityType: 'Client',
      entityId: client._id.toString(),
      metadata: { updates: req.body },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
