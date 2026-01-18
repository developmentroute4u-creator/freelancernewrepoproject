import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { Freelancer, FreelancerStatus } from '../models/Freelancer.js';
import { Test } from '../models/Test.js';
import { TestSubmission } from '../models/TestSubmission.js';
import { Project } from '../models/Project.js';
import { Scope } from '../models/Scope.js';
import { generateSkillTest } from '../utils/gemini.js';
import { logAudit, AuditAction } from '../utils/auditLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get filtered freelancers for a project
router.get('/by-project/:projectId', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.params;

        console.log('🔍 Finding freelancers for project:', projectId);

        // Get project with scope
        const project = await Project.findById(projectId).populate('scopeId');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const scope = project.scopeId as any;
        if (!scope) {
            return res.status(404).json({ error: 'Project scope not found' });
        }

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

// ... rest of existing freelancer routes ...

export default router;
