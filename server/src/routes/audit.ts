import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Get audit logs
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { entityType, entityId, action, userId, limit = 100, offset = 0 } = req.query;

    const query: any = {};

    if (entityType) {
      query.entityType = entityType;
    }

    if (entityId) {
      query.entityId = entityId;
    }

    if (action) {
      query.action = action;
    }

    if (userId) {
      query.userId = userId;
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit log by ID
router.get('/:logId', async (req: AuthRequest, res) => {
  try {
    const { logId } = req.params;
    const log = await AuditLog.findById(logId).populate('userId', 'email role');

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
