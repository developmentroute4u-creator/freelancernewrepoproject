import express from 'express';
import { Types } from 'mongoose';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { Freelancer, FreelancerStatus, BadgeLevel } from '../models/Freelancer.js';
import { TestSubmission } from '../models/TestSubmission.js';
import { Badge } from '../models/Badge.js';
import { Escalation, EscalationStatus } from '../models/Escalation.js';
import { Project, ProjectState } from '../models/Project.js';
import { Scope } from '../models/Scope.js';
import { Client } from '../models/Client.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Get all test submissions for admin dashboard
router.get('/submissions', async (req: AuthRequest, res) => {
  try {
    const submissions = await TestSubmission.find()
      .populate('testId', 'title field testLevel')
      .populate({
        path: 'freelancerId',
        select: 'fullName',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(submissions);
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Review test submissions
router.get('/test-submissions', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const submissions = await TestSubmission.find(query)
      .populate('testId')
      .populate({
        path: 'freelancerId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Review and award badge
router.post('/test-submissions/:submissionId/review', async (req: AuthRequest, res) => {
  try {
    const { submissionId } = req.params;
    const { badgeLevel, score, feedback, strengths, improvementAreas, hourlyRate } = req.body;

    const submission = await TestSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if freelancer already has an immutable badge
    const existingBadge = await Badge.findOne({
      freelancerId: submission.freelancerId,
      isImmutable: true
    });

    if (existingBadge) {
      return res.status(400).json({
        error: 'This freelancer already has an immutable badge and cannot be re-badged. Badges are permanent once awarded.'
      });
    }

    // Create badge
    const badge = await Badge.create({
      freelancerId: submission.freelancerId,
      badgeLevel,
      score,
      feedback,
      strengths: strengths || [],
      improvementAreas: improvementAreas || [],
      awardedBy: req.userId!,
      isImmutable: true,
    });

    // Update freelancer with badge and hourly rate
    await Freelancer.findByIdAndUpdate(submission.freelancerId, {
      badgeLevel,
      badgeScore: score,
      badgeFeedback: feedback,
      badgeStrengths: strengths || [],
      badgeImprovementAreas: improvementAreas || [],
      hourlyRate: hourlyRate || null, // Admin-set pricing
      status: FreelancerStatus.APPROVED,
    });

    // Update submission
    submission.status = 'REVIEWED';
    submission.reviewedAt = new Date();
    submission.reviewedBy = new Types.ObjectId(req.userId!);
    await submission.save();

    await logAudit({
      action: AuditAction.BADGE_AWARDED,
      userId: req.userId!,
      entityType: 'Badge',
      entityId: badge._id.toString(),
      metadata: { submissionId, badgeLevel, score, hourlyRate },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ badge, submission });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject test submission
router.post('/test-submissions/:submissionId/reject', async (req: AuthRequest, res) => {
  try {
    const { submissionId } = req.params;
    const { feedback } = req.body;

    const submission = await TestSubmission.findById(submissionId).populate('testId');
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update freelancer - set rejected test level for retake logic
    await Freelancer.findByIdAndUpdate(submission.freelancerId, {
      rejectedTestLevel: (submission.testId as any).testLevel,
      badgeFeedback: feedback,
      status: FreelancerStatus.REJECTED,
    });

    // Update submission
    submission.status = 'REVIEWED';
    submission.reviewedAt = new Date();
    submission.reviewedBy = new Types.ObjectId(req.userId!);
    await submission.save();

    await logAudit({
      action: AuditAction.BADGE_AWARDED,
      userId: req.userId!,
      entityType: 'TestSubmission',
      entityId: submission._id.toString(),
      metadata: { submissionId, action: 'REJECTED', testLevel: (submission.testId as any).testLevel },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Test submission rejected', submission });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Override badge
router.post('/freelancers/:freelancerId/badge/override', async (req: AuthRequest, res) => {
  try {
    const { freelancerId } = req.params;
    const { badgeLevel, overrideReason } = req.body;

    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    const badge = await Badge.create({
      freelancerId: freelancer._id,
      badgeLevel,
      score: 0,
      feedback: 'Admin override',
      strengths: [],
      improvementAreas: [],
      awardedBy: req.userId!,
      isImmutable: false,
      overrideReason,
    });

    await Freelancer.findByIdAndUpdate(freelancerId, {
      badgeLevel,
      badgeScore: 0,
      badgeFeedback: 'Admin override',
    });

    await logAudit({
      action: AuditAction.BADGE_OVERRIDDEN,
      userId: req.userId!,
      entityType: 'Badge',
      entityId: badge._id.toString(),
      metadata: { freelancerId, badgeLevel, overrideReason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(badge);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all escalations
router.get('/escalations', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const escalations = await Escalation.find(query)
      .populate('projectId')
      .populate('raisedBy', 'email')
      .sort({ createdAt: -1 });

    res.json(escalations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve escalation
router.post('/escalations/:escalationId/resolve', async (req: AuthRequest, res) => {
  try {
    const { escalationId } = req.params;
    const { resolution, resolutionDecision } = req.body;

    const escalation = await Escalation.findById(escalationId);
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    escalation.status = EscalationStatus.RESOLVED;
    escalation.resolution = resolution;
    escalation.resolutionDecision = resolutionDecision;
    escalation.resolvedAt = new Date();
    escalation.resolvedBy = new Types.ObjectId(req.userId!);
    await escalation.save();

    // Update project based on decision
    const project = await Project.findById(escalation.projectId);
    if (project) {
      if (resolutionDecision === 'CLOSURE') {
        project.state = ProjectState.CLOSED;
        project.closedAt = new Date();
        project.closedBy = new Types.ObjectId(req.userId!);
        project.closedReason = resolution;
      } else if (resolutionDecision === 'REWORK') {
        project.state = ProjectState.ACTIVE;
      }
      await project.save();
    }

    await logAudit({
      action: AuditAction.ESCALATION_RESOLVED,
      userId: req.userId!,
      entityType: 'Escalation',
      entityId: escalation._id.toString(),
      metadata: { resolutionDecision, projectId: escalation.projectId.toString() },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(escalation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all projects
router.get('/projects', async (req: AuthRequest, res) => {
  try {
    const { state } = req.query;
    const query: any = {};
    if (state) {
      query.state = state;
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

// Close project
router.post('/projects/:projectId/close', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { reason } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.state = ProjectState.CLOSED;
    project.closedAt = new Date();
    project.closedBy = new Types.ObjectId(req.userId!);
    project.closedReason = reason;
    await project.save();

    await logAudit({
      action: AuditAction.PROJECT_CLOSED,
      userId: req.userId!,
      entityType: 'Project',
      entityId: project._id.toString(),
      metadata: { reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single freelancer
router.get('/freelancers/:freelancerId', async (req: AuthRequest, res) => {
  try {
    const { freelancerId } = req.params;
    const freelancer = await Freelancer.findById(freelancerId).populate('userId', 'email');

    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    res.json(freelancer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all freelancers
router.get('/freelancers', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const freelancers = await Freelancer.find(query)
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    res.json(freelancers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all clients
router.get('/clients', async (req: AuthRequest, res) => {
  try {
    const clients = await Client.find()
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
