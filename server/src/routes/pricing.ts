import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { PricingRule, DepthLevel } from '../models/PricingRule.js';
import { DifficultyModifier, ModifierType } from '../models/DifficultyModifier.js';
import { ProjectPricing, PricingStatus } from '../models/ProjectPricing.js';
import { PricingAudit, PricingAuditAction, AuditUserRole, AuditEntityType } from '../models/PricingAudit.js';
import { PricingEngine } from '../utils/pricingEngine.js';
import { Types } from 'mongoose';

const router = express.Router();

router.use(authenticate);

// ==================== ADMIN ENDPOINTS ====================

/**
 * Create Pricing Rule
 * ADMIN ONLY - Define base price ranges
 */
router.post('/rules', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        const { field, innerField, deliverableType, depth, minPrice, maxPrice } = req.body;

        // Validation
        if (!field || !innerField || !deliverableType || !depth || !minPrice || !maxPrice) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (minPrice >= maxPrice) {
            return res.status(400).json({ error: 'minPrice must be less than maxPrice' });
        }

        if (minPrice < 0 || maxPrice < 0) {
            return res.status(400).json({ error: 'Prices must be positive' });
        }

        // Check for existing rule
        const existing = await PricingRule.findOne({ field, innerField, deliverableType, depth });
        if (existing) {
            return res.status(400).json({ error: 'Pricing rule already exists for this combination' });
        }

        // Create rule
        const rule = await PricingRule.create({
            field,
            innerField,
            deliverableType,
            depth,
            minPrice,
            maxPrice,
            currency: 'INR',
            isActive: true,
            createdBy: req.userId,
            lastUpdated: new Date(),
            auditLog: [{
                action: 'CREATED',
                changedBy: req.userId,
                timestamp: new Date(),
                oldValues: null,
                newValues: { minPrice, maxPrice },
            }],
        });

        // Audit log
        await PricingAudit.create({
            action: PricingAuditAction.RULE_CREATED,
            performedBy: req.userId!,
            userRole: AuditUserRole.ADMIN,
            entityType: AuditEntityType.PRICING_RULE,
            entityId: rule._id,
            changes: { field, innerField, minPrice, maxPrice },
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        console.log('✅ Pricing rule created:', rule._id);
        res.status(201).json(rule);
    } catch (error: any) {
        console.error('❌ Error creating pricing rule:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update Pricing Rule
 * ADMIN ONLY - Update base price ranges
 */
router.patch('/rules/:ruleId', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        const { ruleId } = req.params;
        const { minPrice, maxPrice, reasoning } = req.body;

        if (!reasoning) {
            return res.status(400).json({ error: 'Reasoning is required for price updates' });
        }

        const rule = await PricingRule.findById(ruleId);
        if (!rule) {
            return res.status(404).json({ error: 'Pricing rule not found' });
        }

        // Check if any active projects are using this rule
        const activeProjects = await ProjectPricing.countDocuments({
            'baseWorkUnits.field': rule.field,
            'baseWorkUnits.innerField': rule.innerField,
            status: { $in: [PricingStatus.CALCULATED, PricingStatus.PRESENTED_TO_CLIENT] },
        });

        if (activeProjects > 0) {
            return res.status(400).json({
                error: `Cannot update rule: ${activeProjects} active project(s) are using this rule`,
            });
        }

        // Store old values
        const oldValues = {
            minPrice: rule.minPrice,
            maxPrice: rule.maxPrice,
        };

        // Update rule
        if (minPrice !== undefined) rule.minPrice = minPrice;
        if (maxPrice !== undefined) rule.maxPrice = maxPrice;
        rule.lastUpdated = new Date();

        // Add to audit log
        rule.auditLog.push({
            action: 'UPDATED',
            changedBy: new Types.ObjectId(req.userId!),
            timestamp: new Date(),
            oldValues,
            newValues: { minPrice: rule.minPrice, maxPrice: rule.maxPrice },
            reasoning,
        });

        await rule.save();

        // Audit log
        await PricingAudit.create({
            action: PricingAuditAction.RULE_UPDATED,
            performedBy: req.userId!,
            userRole: AuditUserRole.ADMIN,
            entityType: AuditEntityType.PRICING_RULE,
            entityId: rule._id,
            changes: { oldValues, newValues: { minPrice: rule.minPrice, maxPrice: rule.maxPrice } },
            reasoning,
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        console.log('✅ Pricing rule updated:', ruleId);
        res.json(rule);
    } catch (error: any) {
        console.error('❌ Error updating pricing rule:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get All Pricing Rules
 * ADMIN ONLY
 */
router.get('/rules', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        const rules = await PricingRule.find({ isActive: true }).sort({ field: 1, innerField: 1 });
        res.json(rules);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Pricing Metrics
 * ADMIN ONLY - For quarterly review
 */
router.get('/metrics', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        // Acceptance rates by badge level
        const acceptedPricing = await ProjectPricing.find({ status: PricingStatus.ACCEPTED });
        const rejectedPricing = await ProjectPricing.find({ status: PricingStatus.REJECTED });

        const acceptanceRates = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
        };

        // Calculate acceptance rates
        ['LOW', 'MEDIUM', 'HIGH'].forEach(badge => {
            const accepted = acceptedPricing.filter(p => p.freelancerBadgeLevel === badge).length;
            const rejected = rejectedPricing.filter(p => p.freelancerBadgeLevel === badge).length;
            const total = accepted + rejected;
            acceptanceRates[badge as keyof typeof acceptanceRates] = total > 0 ? accepted / total : 0;
        });

        // Recent audit actions
        const recentActions = await PricingAudit.find()
            .sort({ timestamp: -1 })
            .limit(100)
            .populate('performedBy', 'email');

        // Price range utilization
        const allPricing = await ProjectPricing.find();
        const avgPricePosition = allPricing.reduce((sum, p) => {
            const range = p.adjustedMaxPrice - p.adjustedMinPrice;
            const position = range > 0 ? (p.finalPrice - p.adjustedMinPrice) / range : 0.5;
            return sum + position;
        }, 0) / (allPricing.length || 1);

        res.json({
            acceptanceRates,
            totalProjects: allPricing.length,
            acceptedProjects: acceptedPricing.length,
            rejectedProjects: rejectedPricing.length,
            avgPricePosition: avgPricePosition.toFixed(2),
            recentActions: recentActions.slice(0, 20),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SYSTEM ENDPOINTS ====================

/**
 * Calculate Project Price
 * SYSTEM/CLIENT - Calculate price for a project
 */
router.post('/calculate', authorize(UserRole.CLIENT, UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        const { scopeId, projectId, freelancerId } = req.body;

        if (!scopeId || !projectId) {
            return res.status(400).json({ error: 'scopeId and projectId are required' });
        }

        const result = await PricingEngine.calculatePrice({
            scopeId,
            projectId,
            freelancerId,
            userId: req.userId!,
        });

        res.json(result);
    } catch (error: any) {
        console.error('❌ Error calculating price:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Lock Project Price
 * SYSTEM - Lock price after client accepts
 */
router.post('/:projectId/lock', authorize(UserRole.CLIENT), async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.params;

        await PricingEngine.lockPrice(projectId, req.userId!);

        res.json({ message: 'Price locked successfully' });
    } catch (error: any) {
        console.error('❌ Error locking price:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== CLIENT ENDPOINTS ====================

/**
 * View Project Pricing
 * CLIENT - View pricing for their project
 */
router.get('/project/:projectId', authenticate, async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.params;

        const pricing = await ProjectPricing.findOne({ projectId: new Types.ObjectId(projectId) });
        if (!pricing) {
            return res.status(404).json({ error: 'Pricing not found for this project' });
        }

        // Return client-friendly view (NO internal formulas)
        res.json({
            finalPrice: pricing.finalPrice,
            currency: pricing.currency,
            explanation: pricing.clientExplanation,
            status: pricing.status,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== FREELANCER ENDPOINTS ====================

/**
 * View Invitation Pricing
 * FREELANCER - View pricing for invitation
 */
router.get('/invitation/:invitationId', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
    try {
        const { invitationId } = req.params;

        // Get invitation and project
        const { ProjectInvitation } = await import('../models/ProjectInvitation.js');
        const invitation = await ProjectInvitation.findById(invitationId).populate('projectId');

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        const pricing = await ProjectPricing.findOne({ projectId: invitation.projectId });
        if (!pricing) {
            return res.status(404).json({ error: 'Pricing not found' });
        }

        // Return freelancer-friendly view
        res.json({
            finalPrice: pricing.finalPrice,
            currency: pricing.currency,
            explanation: pricing.freelancerExplanation,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
