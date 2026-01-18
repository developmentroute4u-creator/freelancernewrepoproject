import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { Project, ProjectState } from '../models/Project.js';
import { Scope } from '../models/Scope.js';
import { Client } from '../models/Client.js';
import { Freelancer } from '../models/Freelancer.js';
import { ProjectInvitation, InvitationStatus } from '../models/ProjectInvitation.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';

const router = express.Router();

router.use(authenticate);

// Create project
router.post('/', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const { name, freelancerId, scopeId, accountabilityMode } = req.body;

    console.log('🔄 Creating project:', { name, freelancerId, scopeId, accountabilityMode });

    // Validate required fields
    if (!name || !scopeId || !accountabilityMode) {
      return res.status(400).json({
        error: 'Missing required fields: name, scopeId and accountabilityMode are required'
      });
    }

    // Validate project name
    if (name.trim().length < 3) {
      return res.status(400).json({
        error: 'Project name must be at least 3 characters long'
      });
    }

    const client = await Client.findOne({ userId: req.userId });
    if (!client) {
      console.error('❌ Client profile not found for userId:', req.userId);
      return res.status(404).json({ error: 'Client profile not found. Please complete your profile first.' });
    }

    const scope = await Scope.findById(scopeId);
    if (!scope) {
      console.error('❌ Scope not found:', scopeId);
      return res.status(404).json({ error: 'Scope not found' });
    }

    if (!scope.isLocked) {
      console.error('❌ Scope not locked:', scopeId);
      return res.status(400).json({ error: 'Scope must be locked before creating project' });
    }

    // FreelancerId is optional - can be assigned later
    const projectData: any = {
      name: name.trim(),
      clientId: client._id,
      scopeId,
      accountabilityMode,
      state: ProjectState.DRAFT,
    };

    if (freelancerId) {
      projectData.freelancerId = freelancerId;
    }

    const project = await Project.create(projectData);

    // Link scope to project
    scope.projectId = project._id;
    await scope.save();

    console.log('✅ Project created successfully:', project._id);

    await logAudit({
      action: AuditAction.PROJECT_CREATED,
      userId: req.userId!,
      entityType: 'Project',
      entityId: project._id.toString(),
      metadata: { name, freelancerId, scopeId, accountabilityMode },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(project);
  } catch (error: any) {
    console.error('❌ Project creation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create project. Please try again.'
    });
  }
});

// Get project
router.get('/:projectId', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    console.log('🔄 Fetching project:', projectId);
    const project = await Project.findById(projectId)
      .populate('clientId')
      .populate({
        path: 'freelancerId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
      .populate('scopeId');

    if (!project) {
      console.error('❌ Project not found:', projectId);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('✅ Project found:', project._id);

    // Check authorization
    const client = await Client.findOne({ userId: req.userId });
    const freelancer = await Freelancer.findOne({ userId: req.userId });

    // Handle populated clientId (it's an object after populate)
    const projectClientId = typeof project.clientId === 'object' && project.clientId._id
      ? project.clientId._id.toString()
      : project.clientId.toString();

    // Handle populated freelancerId (it's an object after populate)
    const projectFreelancerId = project.freelancerId 
      ? (typeof project.freelancerId === 'object' && project.freelancerId._id
          ? project.freelancerId._id.toString()
          : project.freelancerId.toString())
      : null;

    const freelancerIdStr = freelancer?._id.toString();

    const isAuthorized =
      req.userRole === UserRole.ADMIN ||
      projectClientId === client?._id.toString() ||
      (projectFreelancerId && freelancerIdStr && projectFreelancerId === freelancerIdStr);

    console.log('🔐 Auth check:', { 
      projectClientId, 
      clientId: client?._id.toString(), 
      projectFreelancerId,
      freelancerId: freelancerIdStr,
      isAuthorized 
    });

    if (!isAuthorized) {
      console.error('❌ Unauthorized');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(project);
  } catch (error: any) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update project state
router.patch('/:projectId/state', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { state } = req.body;

    if (!Object.values(ProjectState).includes(state)) {
      return res.status(400).json({ error: 'Invalid project state' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const previousState = project.state;
    project.state = state;

    if (state === ProjectState.ACTIVE && !project.startedAt) {
      project.startedAt = new Date();
    }

    if (state === ProjectState.COMPLETED) {
      project.completedAt = new Date();
    }

    await project.save();

    await logAudit({
      action: AuditAction.PROJECT_STATE_CHANGED,
      userId: req.userId!,
      entityType: 'Project',
      entityId: project._id.toString(),
      metadata: { previousState, newState: state },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's projects
router.get('/', async (req: AuthRequest, res) => {
  try {
    let query: any = {};

    if (req.userRole === UserRole.CLIENT) {
      const client = await Client.findOne({ userId: req.userId });
      if (client) {
        query.clientId = client._id;
      }
    } else if (req.userRole === UserRole.FREELANCER) {
      const freelancer = await Freelancer.findOne({ userId: req.userId });
      if (freelancer) {
        query.freelancerId = freelancer._id;
      }
    }

    const projects = await Project.find(query)
      .populate('clientId')
      .populate('freelancerId')
      .populate('scopeId')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Invite freelancers to project
router.post('/:projectId/invite-freelancers', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { freelancerIds } = req.body;

    if (!Array.isArray(freelancerIds) || freelancerIds.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one freelancer ID' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.freelancerId) return res.status(400).json({ error: 'Project already assigned' });

    const invitations = await Promise.all(
      freelancerIds.map(async (freelancerId) => {
        try {
          return await ProjectInvitation.create({
            projectId: project._id,
            freelancerId,
            status: InvitationStatus.PENDING
          });
        } catch (error: any) {
          return error.code === 11000 ? null : Promise.reject(error);
        }
      })
    );

    const created = invitations.filter(inv => inv !== null);
    project.state = ProjectState.PENDING_ACCEPTANCE;
    await project.save();

    console.log(`✅ Sent ${created.length} invitations for project ${projectId}`);
    res.json({ message: `Sent ${created.length} invitation(s)`, invitations: created });
  } catch (error: any) {
    console.error('❌ Error sending invitations:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
