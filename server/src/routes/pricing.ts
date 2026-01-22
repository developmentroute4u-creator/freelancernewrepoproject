import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { PricingRule, DepthLevel } from '../models/PricingRule.js';
import { DifficultyModifier, ModifierType } from '../models/DifficultyModifier.js';
import { ProjectPricing, PricingStatus } from '../models/ProjectPricing.js';
import { PricingAudit, PricingAuditAction, AuditUserRole, AuditEntityType } from '../models/PricingAudit.js';
import { PricingEngine } from '../utils/pricingEngine.js';
import { calculateDeterministicPrice, getPriceForBadge } from '../utils/deterministicPricingEngine.js';
import { DeterministicPricing } from '../models/DeterministicPricing.js';
import { BASE_RATES, GLOBAL_CAPS, PRICE_TIERS } from '../config/baseRates.js';
import { DIFFICULTY_MULTIPLIERS } from '../config/difficultyMultipliers.js';
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

/**
 * Get Base Rates Configuration
 * ADMIN ONLY - View current base rates
 */
router.get('/config/base-rates', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        res.json({
            baseRates: BASE_RATES,
            currency: 'INR',
            unit: 'per Effort Unit (EU)',
            note: '1 EU = 1 person-day (8 productive hours, mid-level)',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update Base Rate
 * ADMIN ONLY - Update base rate for a field (quarterly tuning)
 */
router.patch('/config/base-rates/:field', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        const { field } = req.params;
        const { baseRatePerEU, reasoning } = req.body;

        if (!baseRatePerEU || baseRatePerEU <= 0) {
            return res.status(400).json({ error: 'baseRatePerEU must be a positive number' });
        }

        if (!reasoning) {
            return res.status(400).json({ error: 'Reasoning is required for base rate updates' });
        }

        // Decode field name (URL encoded)
        const decodedField = decodeURIComponent(field);

        if (!BASE_RATES[decodedField]) {
            return res.status(404).json({ error: `Field "${decodedField}" not found in base rates` });
        }

        const oldRate = BASE_RATES[decodedField];
        BASE_RATES[decodedField] = baseRatePerEU;

        // Audit log
        await PricingAudit.create({
            action: PricingAuditAction.RULE_UPDATED,
            performedBy: req.userId!,
            userRole: AuditUserRole.ADMIN,
            entityType: AuditEntityType.PRICING_RULE,
            entityId: new Types.ObjectId(), // No specific entity for config
            changes: {
                field: decodedField,
                oldBaseRate: oldRate,
                newBaseRate: baseRatePerEU,
            },
            reasoning,
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        console.log(`✅ Base rate updated for "${decodedField}": ₹${oldRate} → ₹${baseRatePerEU}`);

        res.json({
            field: decodedField,
            oldBaseRate: oldRate,
            newBaseRate: baseRatePerEU,
            message: 'Base rate updated successfully',
        });
    } catch (error: any) {
        console.error('❌ Error updating base rate:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Difficulty Multipliers Configuration
 * ADMIN ONLY - View current difficulty multipliers
 */
router.get('/config/multipliers', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        res.json({
            multipliers: DIFFICULTY_MULTIPLIERS,
            maxMultiplierProduct: 1.5,
            note: 'Total multiplier product is capped at 1.5',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Global Configuration
 * ADMIN ONLY - View global caps and tier multipliers
 */
router.get('/config/global', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        res.json({
            caps: GLOBAL_CAPS,
            priceTiers: PRICE_TIERS,
            roundingIncrement: 50,
            currency: 'INR',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update Global Caps
 * ADMIN ONLY - Update min/max global caps
 */
router.patch('/config/global/caps', authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        const { min, max, reasoning } = req.body;

        if (min !== undefined && (min < 0 || min >= max)) {
            return res.status(400).json({ error: 'min must be >= 0 and < max' });
        }

        if (max !== undefined && max <= 0) {
            return res.status(400).json({ error: 'max must be > 0' });
        }

        if (!reasoning) {
            return res.status(400).json({ error: 'Reasoning is required for global cap updates' });
        }

        const oldCaps = { ...GLOBAL_CAPS };
        if (min !== undefined) GLOBAL_CAPS.min = min;
        if (max !== undefined) GLOBAL_CAPS.max = max;

        // Audit log
        await PricingAudit.create({
            action: PricingAuditAction.RULE_UPDATED,
            performedBy: req.userId!,
            userRole: AuditUserRole.ADMIN,
            entityType: AuditEntityType.PRICING_RULE,
            entityId: new Types.ObjectId(),
            changes: {
                oldCaps,
                newCaps: { ...GLOBAL_CAPS },
            },
            reasoning,
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        console.log(`✅ Global caps updated: min=₹${GLOBAL_CAPS.min}, max=₹${GLOBAL_CAPS.max}`);

        res.json({
            oldCaps,
            newCaps: { ...GLOBAL_CAPS },
            message: 'Global caps updated successfully',
        });
    } catch (error: any) {
        console.error('❌ Error updating global caps:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== DETERMINISTIC PRICING ENDPOINTS ====================

/**
 * Get Pricing Estimate
 * CLIENT/ADMIN - Get LOW/MEDIUM/HIGH pricing estimate for a scope
 * 
 * Returns deterministic pricing breakdown with tiers
 */
router.post('/estimate', authorize(UserRole.CLIENT, UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        const { scopeId, projectId } = req.body;

        if (!scopeId) {
            return res.status(400).json({ error: 'scopeId is required' });
        }

        // Calculate deterministic price
        const estimate = await calculateDeterministicPrice({
            scopeId,
            projectId,
            userId: req.userId!,
        });

        // Save to database
        const savedPricing = await DeterministicPricing.create({
            projectId: projectId ? new Types.ObjectId(projectId) : undefined,
            scopeId: new Types.ObjectId(scopeId),
            workUnits: estimate.workUnits,
            fieldAggregations: estimate.fieldAggregations,
            twu: estimate.twu,
            mp: estimate.mp,
            bpv: estimate.bpv,
            low: estimate.low,
            medium: estimate.medium,
            high: estimate.high,
            finalLow: estimate.finalLow,
            finalMedium: estimate.finalMedium,
            finalHigh: estimate.finalHigh,
            breakdown: estimate.breakdown,
            calculationDetails: estimate.calculationDetails,
            auditId: new Types.ObjectId(estimate.auditId),
            status: 'CALCULATED',
            calculatedAt: new Date(),
        });

        // Return client-friendly response
        res.json({
            tiers: {
                low: estimate.finalLow,
                medium: estimate.finalMedium,
                high: estimate.finalHigh,
            },
            breakdown: {
                scopeSize: estimate.breakdown.scopeSize,
                complexityDrivers: estimate.breakdown.complexityDrivers,
                recommended: estimate.breakdown.recommended,
            },
            calculationId: savedPricing._id.toString(),
            // Include detailed breakdown for admin
            ...(req.userRole === UserRole.ADMIN ? {
                details: {
                    twu: estimate.twu,
                    mp: estimate.mp,
                    bpv: estimate.bpv,
                    fieldBreakdown: estimate.fieldAggregations.map(f => ({
                        field: f.field,
                        twu: f.twu,
                        ei: f.ei,
                        value: f.fieldValue,
                    })),
                    difficultyFactors: estimate.calculationDetails.difficultyFactors,
                },
            } : {}),
        });
    } catch (error: any) {
        console.error('❌ Error calculating pricing estimate:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Pricing Estimate by Scope ID
 * CLIENT/ADMIN - Get existing pricing estimate
 */
router.get('/estimate/:scopeId', authorize(UserRole.CLIENT, UserRole.ADMIN), async (req: AuthRequest, res) => {
    try {
        const { scopeId } = req.params;

        const pricing = await DeterministicPricing.findOne({
            scopeId: new Types.ObjectId(scopeId),
        }).sort({ calculatedAt: -1 });

        if (!pricing) {
            return res.status(404).json({ error: 'Pricing estimate not found' });
        }

        // Return client-friendly response
        res.json({
            tiers: {
                low: pricing.finalLow,
                medium: pricing.finalMedium,
                high: pricing.finalHigh,
            },
            breakdown: pricing.breakdown,
            calculationId: pricing._id.toString(),
            status: pricing.status,
            // Include detailed breakdown for admin
            ...(req.userRole === UserRole.ADMIN ? {
                details: {
                    twu: pricing.twu,
                    mp: pricing.mp,
                    bpv: pricing.bpv,
                    fieldBreakdown: pricing.fieldAggregations.map(f => ({
                        field: f.field,
                        twu: f.twu,
                        ei: f.ei,
                        value: f.fieldValue,
                    })),
                    difficultyFactors: pricing.calculationDetails.difficultyFactors,
                },
            } : {}),
        });
    } catch (error: any) {
        console.error('❌ Error fetching pricing estimate:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Price for Freelancer Badge
 * FREELANCER - Get price matching their badge level
 */
router.get('/estimate/:scopeId/badge/:badgeLevel', authorize(UserRole.FREELANCER), async (req: AuthRequest, res) => {
    try {
        const { scopeId, badgeLevel } = req.params;

        if (!['LOW', 'MEDIUM', 'HIGH'].includes(badgeLevel)) {
            return res.status(400).json({ error: 'Invalid badge level' });
        }

        const pricing = await DeterministicPricing.findOne({
            scopeId: new Types.ObjectId(scopeId),
        }).sort({ calculatedAt: -1 });

        if (!pricing) {
            return res.status(404).json({ error: 'Pricing estimate not found' });
        }

        // Get price for badge
        const price = getPriceForBadge(
            {
                finalLow: pricing.finalLow,
                finalMedium: pricing.finalMedium,
                finalHigh: pricing.finalHigh,
            } as any,
            badgeLevel as 'LOW' | 'MEDIUM' | 'HIGH'
        );

        res.json({
            price,
            currency: 'INR',
            badgeLevel,
            breakdown: {
                scopeSize: pricing.breakdown.scopeSize,
                complexityDrivers: pricing.breakdown.complexityDrivers,
            },
        });
    } catch (error: any) {
        console.error('❌ Error fetching badge price:', error);
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
