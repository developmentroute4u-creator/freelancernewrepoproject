import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { Freelancer, FreelancerStatus } from '../models/Freelancer.js';
import { Test } from '../models/Test.js';
import { TestSubmission } from '../models/TestSubmission.js';
import { Project } from '../models/Project.js';
import { generateSkillTest } from '../utils/gemini.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create freelancer profile
router.post('/', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      yearsOfExperience,
      location,
      expectedComfortRange,
      availability,
      education,
      portfolioUrls,
    } = req.body;

    const existingFreelancer = await Freelancer.findOne({ userId: req.userId });
    if (existingFreelancer) {
      return res.status(400).json({ error: 'Freelancer profile already exists' });
    }

    const freelancer = await Freelancer.create({
      userId: req.userId!,
      fullName,
      mobileNumber,
      yearsOfExperience,
      location,
      expectedComfortRange,
      availability,
      education: education || undefined,
      portfolioUrls: portfolioUrls || [],
      status: FreelancerStatus.PENDING,
    });

    await logAudit({
      action: AuditAction.FREELANCER_REGISTERED,
      userId: req.userId!,
      entityType: 'Freelancer',
      entityId: freelancer._id.toString(),
      metadata: { field: education?.field },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(freelancer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get freelancer profile
router.get('/me', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
  try {
    const freelancer = await Freelancer.findOne({ userId: req.userId }).populate('userId');
    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer profile not found' });
    }
    res.json(freelancer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update freelancer profile
router.patch('/me', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
  try {
    const freelancer = await Freelancer.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true }
    );

    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer profile not found' });
    }

    await logAudit({
      action: AuditAction.FREELANCER_UPDATED,
      userId: req.userId!,
      entityType: 'Freelancer',
      entityId: freelancer._id.toString(),
      metadata: { updates: req.body },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(freelancer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate and create skill test(s)
router.post('/tests/generate', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
  try {
    const { fields, testLevel } = req.body;

    // Support both old format (single field) and new format (multiple fields)
    let fieldConfigs: Array<{ field: string; innerFields: string[] }> = [];
    
    if (req.body.field && req.body.innerFields) {
      // Old format: single field
      fieldConfigs = [{ field: req.body.field, innerFields: req.body.innerFields }];
    } else if (fields && Array.isArray(fields) && fields.length > 0) {
      // New format: multiple fields
      fieldConfigs = fields;
    } else {
      return res.status(400).json({ error: 'Either provide "field" and "innerFields" (old format) or "fields" array (new format)' });
    }

    if (!testLevel) {
      return res.status(400).json({ error: 'Test level is required' });
    }

    const freelancer = await Freelancer.findOne({ userId: req.userId });
    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer profile not found' });
    }

    // Generate tests for each field
    const testPromises = fieldConfigs.map(async ({ field, innerFields }) => {
      // Generate test using Gemini
      const generatedTest = await generateSkillTest({
        field,
        innerFields,
        testLevel,
      });

      // Create test in database
      const test = await Test.create({
        freelancerId: freelancer._id,
        field,
        innerFields,
        testLevel,
        title: generatedTest.title,
        description: generatedTest.description,
        instructions: generatedTest.instructions,
        generatedBy: 'GEMINI',
      });

      return test;
    });

    // Wait for all tests to be generated and created
    const tests = await Promise.all(testPromises);

    // Return array of tests (or single test for backward compatibility)
    res.status(201).json(tests.length === 1 ? tests[0] : tests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit test
router.post('/tests/:testId/submit', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
  try {
    const { testId } = req.params;
    const { zipFileUrl, githubRepositoryLink, liveWebsiteUrl, demoVideoUrl } = req.body;

    if (!zipFileUrl && !githubRepositoryLink) {
      return res.status(400).json({ error: 'ZIP file or GitHub repository link is required' });
    }

    const freelancer = await Freelancer.findOne({ userId: req.userId });
    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer profile not found' });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (test.freelancerId.toString() !== freelancer._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const submission = await TestSubmission.create({
      testId,
      freelancerId: freelancer._id,
      zipFileUrl,
      githubRepositoryLink,
      liveWebsiteUrl,
      demoVideoUrl,
      status: 'SUBMITTED',
    });

    // Update freelancer status
    await Freelancer.findByIdAndUpdate(freelancer._id, {
      status: FreelancerStatus.UNDER_REVIEW,
    });

    await logAudit({
      action: AuditAction.TEST_SUBMITTED,
      userId: req.userId!,
      entityType: 'TestSubmission',
      entityId: submission._id.toString(),
      metadata: { testId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get freelancer's tests
router.get('/tests', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
  try {
    const freelancer = await Freelancer.findOne({ userId: req.userId });
    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer profile not found' });
    }

    const tests = await Test.find({ freelancerId: freelancer._id });
    res.json(tests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get test submissions
router.get('/tests/submissions', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
  try {
    const freelancer = await Freelancer.findOne({ userId: req.userId });
    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer profile not found' });
    }

    const submissions = await TestSubmission.find({ freelancerId: freelancer._id })
      .populate('testId')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Client: Search freelancers
router.get('/search', authorize(UserRole.CLIENT, UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { badgeLevel, minExperience, location, field } = req.query;

    const query: any = { status: FreelancerStatus.APPROVED };

    if (badgeLevel) {
      query.badgeLevel = badgeLevel;
    }

    if (minExperience) {
      query.yearsOfExperience = { $gte: Number(minExperience) };
    }

    if (location) {
      query.location = new RegExp(location as string, 'i');
    }

    if (field) {
      query['education.field'] = field;
    }

    const freelancers = await Freelancer.find(query)
      .select('-expectedComfortRange') // Hide from clients
      .populate('userId', 'email')
      .limit(50);

    res.json(freelancers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Discover freelancers (for clients)
router.get('/discover', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      badgeLevel,
      field,
      location,
      minExperience,
      expectedComfortRangeMin,
      expectedComfortRangeMax,
      search
    } = req.query;

    // Build query
    const query: any = {
      badgeLevel: { $exists: true, $ne: null } // Only show freelancers with badges
    };

    if (badgeLevel) {
      query.badgeLevel = badgeLevel;
    }

    if (field) {
      query['education.field'] = field;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (minExperience) {
      query.yearsOfExperience = { $gte: parseInt(minExperience as string) };
    }

    if (expectedComfortRangeMin || expectedComfortRangeMax) {
      query.$and = [];
      if (expectedComfortRangeMin) {
        query.$and.push({ expectedComfortRangeMax: { $gte: parseInt(expectedComfortRangeMin as string) } });
      }
      if (expectedComfortRangeMax) {
        query.$and.push({ expectedComfortRangeMin: { $lte: parseInt(expectedComfortRangeMax as string) } });
      }
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { 'education.field': { $regex: search, $options: 'i' } },
        { 'education.innerFields': { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    const freelancers = await Freelancer.find(query)
      .select('fullName location yearsOfExperience badgeLevel badgeScore education portfolioUrls')
      .limit(50)
      .sort({ badgeScore: -1, createdAt: -1 });

    res.json(freelancers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get filtered freelancers for a project
router.get('/by-project/:projectId', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('scopeId');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const scope = project.scopeId as any;
    if (!scope) return res.status(404).json({ error: 'Scope not found' });

    console.log('🔍 Finding freelancers for project:', projectId);
    console.log('📋 Project field:', scope.field);
    console.log('📋 Project innerFields:', scope.innerFields);

    // Build query with correct property path
    const query: any = {
      'education.field': scope.field, // FIX: Use education.field instead of field
      badgeLevel: { $exists: true, $ne: null }, // Must have a badge (LOW, MEDIUM, or HIGH)
      status: FreelancerStatus.APPROVED, // Must be approved by admin
    };

    // Optional: Filter by inner fields if specified (at least one match)
    if (scope.innerFields && Array.isArray(scope.innerFields) && scope.innerFields.length > 0) {
      query['education.innerFields'] = { $in: scope.innerFields };
    }

    const freelancers = await Freelancer.find(query).populate('userId', 'email');

    console.log(`✅ Found ${freelancers.length} matching freelancers`);

    // Helper function to count matching inner fields
    const countMatchingInnerFields = (projectInnerFields: string[], freelancerInnerFields: string[]): number => {
      if (!projectInnerFields || !freelancerInnerFields) return 0;
      return projectInnerFields.filter(field => freelancerInnerFields.includes(field)).length;
    };

    // Enhanced sorting: Multi-factor ranking
    const badgePriority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    freelancers.sort((a, b) => {
      // Primary sort: Badge level (HIGH > MEDIUM > LOW)
      const aBadgePriority = badgePriority[a.badgeLevel as keyof typeof badgePriority] || 0;
      const bBadgePriority = badgePriority[b.badgeLevel as keyof typeof badgePriority] || 0;
      if (bBadgePriority !== aBadgePriority) {
        return bBadgePriority - aBadgePriority;
      }

      // Secondary sort: Badge score (higher is better)
      const aScore = a.badgeScore || 0;
      const bScore = b.badgeScore || 0;
      if (bScore !== aScore) {
        return bScore - aScore;
      }

      // Tertiary sort: Inner fields match count (more matches = better)
      const scopeInnerFields = scope.innerFields || [];
      const aInnerFields = a.education?.innerFields || [];
      const bInnerFields = b.education?.innerFields || [];
      const aMatches = countMatchingInnerFields(scopeInnerFields, aInnerFields);
      const bMatches = countMatchingInnerFields(scopeInnerFields, bInnerFields);
      if (bMatches !== aMatches) {
        return bMatches - aMatches;
      }

      // Quaternary sort: Experience (more experience = better)
      const aExp = a.yearsOfExperience || 0;
      const bExp = b.yearsOfExperience || 0;
      return bExp - aExp;
    });

    res.json(freelancers);
  } catch (error: any) {
    console.error('❌ Error finding freelancers:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
