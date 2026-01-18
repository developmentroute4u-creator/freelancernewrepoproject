import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { Escalation, EscalationStatus, EscalationType } from '../models/Escalation.js';
import { Project } from '../models/Project.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';

const router = express.Router();

router.use(authenticate);

// Raise escalation
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { projectId, escalationType, description } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Only allow escalations for projects with ACCOUNTABILITY mode
    if (project.accountabilityMode !== 'ACCOUNTABILITY') {
      return res.status(400).json({ error: 'Escalations only available for accountability mode projects' });
    }

    const escalation = await Escalation.create({
      projectId,
      raisedBy: req.userId!,
      escalationType,
      description,
      status: EscalationStatus.OPEN,
    });

    // Update project state to DISPUTED
    project.state = 'DISPUTED';
    await project.save();

    await logAudit({
      action: AuditAction.ESCALATION_RAISED,
      userId: req.userId!,
      entityType: 'Escalation',
      entityId: escalation._id.toString(),
      metadata: { projectId, escalationType },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(escalation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get escalations
router.get('/', async (req: AuthRequest, res) => {
  try {
    let query: any = {};

    if (req.userRole === UserRole.ADMIN) {
      // Admin sees all
    } else {
      // Users see only their project escalations
      const { Project } = await import('../models/Project.js');
      const { Client } = await import('../models/Client.js');
      const { Freelancer } = await import('../models/Freelancer.js');

      let projectIds: string[] = [];

      if (req.userRole === UserRole.CLIENT) {
        const client = await Client.findOne({ userId: req.userId });
        if (client) {
          const projects = await Project.find({ clientId: client._id });
          projectIds = projects.map(p => p._id.toString());
        }
      } else if (req.userRole === UserRole.FREELANCER) {
        const freelancer = await Freelancer.findOne({ userId: req.userId });
        if (freelancer) {
          const projects = await Project.find({ freelancerId: freelancer._id });
          projectIds = projects.map(p => p._id.toString());
        }
      }

      query.projectId = { $in: projectIds };
    }

    const escalations = await Escalation.find(query)
      .populate('projectId')
      .populate('raisedBy', 'email')
      .populate('assignedTo', 'email')
      .populate('resolvedBy', 'email')
      .sort({ createdAt: -1 });

    res.json(escalations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get escalation by ID
router.get('/:escalationId', async (req: AuthRequest, res) => {
  try {
    const { escalationId } = req.params;
    const escalation = await Escalation.findById(escalationId)
      .populate('projectId')
      .populate('raisedBy', 'email')
      .populate('assignedTo', 'email')
      .populate('resolvedBy', 'email');

    if (!escalation) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    res.json(escalation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
