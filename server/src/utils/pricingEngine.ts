import { PricingRule, DepthLevel } from '../models/PricingRule.js';
import { DifficultyModifier, ModifierType } from '../models/DifficultyModifier.js';
import { ProjectPricing, PricingStatus, IWorkUnit, IAppliedModifier } from '../models/ProjectPricing.js';
import { PricingAudit, PricingAuditAction, AuditUserRole, AuditEntityType } from '../models/PricingAudit.js';
import { Scope } from '../models/Scope.js';
import { Freelancer } from '../models/Freelancer.js';
import { Types } from 'mongoose';

// ABSOLUTE MAXIMUM MODIFIER CAP (CANNOT BE EXCEEDED)
const ABSOLUTE_MODIFIER_CAP = 40;

// Badge positioning constants (CANNOT BE CHANGED PER PROJECT)
const BADGE_POSITIONING = {
    LOW: 0.25,    // Lower quartile
    MEDIUM: 0.50, // Median
    HIGH: 0.75,   // Upper quartile
};

export interface PricingCalculationParams {
    scopeId: string;
    projectId: string;
    freelancerId?: string; // Optional for preview
    userId: string; // For audit trail
}

export interface PricingResult {
    finalPrice: number;
    currency: string;
    clientExplanation: string;
    freelancerExplanation: string;
    priceRange: {
        min: number;
        max: number;
    };
    calculationLog: any;
}

/**
 * PRICING CALCULATION ENGINE
 * 
 * This is a DETERMINISTIC, RULE-BASED pricing system.
 * NO negotiation, NO manual overrides, NO AI-decided prices.
 * 
 * Three-Layer Architecture:
 * 1. Work Value (Base Price Ranges)
 * 2. Execution Difficulty (Rule-Based Modifiers)
 * 3. Freelancer Capability (Badge Positioning)
 */
export class PricingEngine {
    /**
     * STEP 1: Parse Scope → Extract Work Units
     */
    private static async extractWorkUnits(scopeId: string): Promise<IWorkUnit[]> {
        const scope = await Scope.findById(scopeId);
        if (!scope) {
            throw new Error('Scope not found');
        }

        const workUnits: IWorkUnit[] = [];

        // Map scope to work units
        // For now, create one work unit per inner field
        for (const innerField of scope.innerFields) {
            // Find matching pricing rule
            const rule = await PricingRule.findOne({
                field: scope.field,
                innerField: innerField,
                isActive: true,
            }).sort({ depth: -1 }); // Get highest depth if multiple exist

            if (!rule) {
                console.warn(`⚠️ No pricing rule found for ${scope.field} > ${innerField}`);
                // Use fallback pricing
                workUnits.push({
                    field: scope.field,
                    innerField: innerField,
                    deliverableType: 'Standard Deliverable',
                    quantity: 1,
                    minPrice: 100, // Fallback minimum
                    maxPrice: 500, // Fallback maximum
                });
            } else {
                workUnits.push({
                    field: rule.field,
                    innerField: rule.innerField,
                    deliverableType: rule.deliverableType,
                    quantity: 1,
                    minPrice: rule.minPrice,
                    maxPrice: rule.maxPrice,
                });
            }
        }

        // Add deliverables count as a multiplier
        const deliverableCount = scope.deliverables?.length || 1;
        const multiplier = Math.max(1, Math.floor(deliverableCount / 5)); // Every 5 deliverables = 1x multiplier

        workUnits.forEach(unit => {
            unit.quantity = multiplier;
            unit.minPrice = unit.minPrice * multiplier;
            unit.maxPrice = unit.maxPrice * multiplier;
        });

        return workUnits;
    }

    /**
     * STEP 2: Aggregate Base Prices
     */
    private static aggregateBasePrices(workUnits: IWorkUnit[]): { min: number; max: number } {
        const aggregatedMin = workUnits.reduce((sum, unit) => sum + unit.minPrice, 0);
        const aggregatedMax = workUnits.reduce((sum, unit) => sum + unit.maxPrice, 0);

        return { min: aggregatedMin, max: aggregatedMax };
    }

    /**
     * STEP 3: Analyze Difficulty Signals
     */
    private static async analyzeDifficulty(scopeId: string): Promise<IAppliedModifier[]> {
        const scope = await Scope.findById(scopeId);
        if (!scope) {
            throw new Error('Scope not found');
        }

        const appliedModifiers: IAppliedModifier[] = [];

        // 1. DEADLINE URGENCY
        const deadline = new Date(scope.intentAnswers?.deadline || Date.now());
        const daysUntilDeadline = Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        let deadlineLevel = 'NORMAL';
        if (daysUntilDeadline < 7) deadlineLevel = 'RUSH';
        else if (daysUntilDeadline < 14) deadlineLevel = 'URGENT';
        else if (daysUntilDeadline < 28) deadlineLevel = 'MODERATE';

        const deadlineModifier = await DifficultyModifier.findOne({
            modifierType: ModifierType.DEADLINE,
            level: deadlineLevel,
            isActive: true,
        });

        if (deadlineModifier) {
            appliedModifiers.push({
                modifierType: ModifierType.DEADLINE,
                level: deadlineLevel,
                percentageImpact: deadlineModifier.percentageImpact,
                reasoning: `Deadline in ${daysUntilDeadline} days`,
            });
        }

        // 2. COMPLEXITY LEVEL
        const deliverableCount = scope.deliverables?.length || 0;
        const inclusionCount = scope.inclusions?.length || 0;

        let complexityLevel = 'STANDARD';
        if (deliverableCount > 20 || inclusionCount > 30) complexityLevel = 'VERY_COMPLEX';
        else if (deliverableCount > 10 || inclusionCount > 15) complexityLevel = 'COMPLEX';
        else if (deliverableCount < 5) complexityLevel = 'SIMPLE';

        const complexityModifier = await DifficultyModifier.findOne({
            modifierType: ModifierType.COMPLEXITY,
            level: complexityLevel,
            isActive: true,
        });

        if (complexityModifier) {
            appliedModifiers.push({
                modifierType: ModifierType.COMPLEXITY,
                level: complexityLevel,
                percentageImpact: complexityModifier.percentageImpact,
                reasoning: `${deliverableCount} deliverables, ${inclusionCount} inclusions`,
            });
        }

        // 3. PRIORITY (maps to criticality)
        const priority = scope.intentAnswers?.priority || 'QUALITY';
        let criticalityLevel = 'PRODUCTION';
        if (priority === 'DEPTH') criticalityLevel = 'MISSION_CRITICAL';
        else if (priority === 'SPEED') criticalityLevel = 'PRODUCTION';

        const criticalityModifier = await DifficultyModifier.findOne({
            modifierType: ModifierType.CRITICALITY,
            level: criticalityLevel,
            isActive: true,
        });

        if (criticalityModifier) {
            appliedModifiers.push({
                modifierType: ModifierType.CRITICALITY,
                level: criticalityLevel,
                percentageImpact: criticalityModifier.percentageImpact,
                reasoning: `Priority: ${priority}`,
            });
        }

        return appliedModifiers;
    }

    /**
     * STEP 4: Apply Modifiers (BOUNDED)
     */
    private static applyModifiers(
        baseMin: number,
        baseMax: number,
        modifiers: IAppliedModifier[]
    ): { adjustedMin: number; adjustedMax: number; totalImpact: number } {
        // Calculate total modifier impact
        let totalImpact = modifiers.reduce((sum, mod) => sum + mod.percentageImpact, 0);

        // ENFORCEMENT: Cap at ABSOLUTE_MODIFIER_CAP
        if (Math.abs(totalImpact) > ABSOLUTE_MODIFIER_CAP) {
            console.warn(`⚠️ Modifier impact ${totalImpact}% exceeds cap. Capping at ±${ABSOLUTE_MODIFIER_CAP}%`);
            totalImpact = Math.sign(totalImpact) * ABSOLUTE_MODIFIER_CAP;
        }

        // Apply modifier to range
        const impactMultiplier = 1 + (totalImpact / 100);
        let adjustedMin = baseMin * impactMultiplier;
        let adjustedMax = baseMax * impactMultiplier;

        // ENFORCEMENT: Ensure adjusted prices don't violate base bounds
        adjustedMin = Math.max(adjustedMin, baseMin * 0.6); // Never below 60% of base
        adjustedMax = Math.min(adjustedMax, baseMax * 1.4); // Never above 140% of base

        return {
            adjustedMin: Math.round(adjustedMin),
            adjustedMax: Math.round(adjustedMax),
            totalImpact,
        };
    }

    /**
     * STEP 5: Position via Badge
     */
    private static async positionViaBadge(
        adjustedMin: number,
        adjustedMax: number,
        freelancerId?: string
    ): Promise<{ finalPrice: number; badgeLevel?: string; positioning?: number }> {
        if (!freelancerId) {
            // No freelancer yet - return median price for preview
            return {
                finalPrice: Math.round(adjustedMin + (adjustedMax - adjustedMin) * 0.5),
            };
        }

        const freelancer = await Freelancer.findById(freelancerId);
        if (!freelancer || !freelancer.badgeLevel) {
            throw new Error('Freelancer not found or has no badge level');
        }

        const badgeLevel = freelancer.badgeLevel as 'LOW' | 'MEDIUM' | 'HIGH';
        const positioning = BADGE_POSITIONING[badgeLevel];

        // Calculate final price
        const priceRange = adjustedMax - adjustedMin;
        const finalPrice = Math.round(adjustedMin + (priceRange * positioning));

        return {
            finalPrice,
            badgeLevel,
            positioning,
        };
    }

    /**
     * STEP 6: Generate Explanations
     */
    private static generateExplanations(
        workUnits: IWorkUnit[],
        modifiers: IAppliedModifier[],
        badgeLevel?: string,
        finalPrice?: number
    ): { clientExplanation: string; freelancerExplanation: string } {
        // Client explanation
        const scopeSize = workUnits.length > 1
            ? `${workUnits.length} work areas across ${workUnits[0].field}`
            : `${workUnits[0].field} project`;

        const complexityFactors = modifiers.length > 0
            ? modifiers.map(m => `${m.level.replace(/_/g, ' ').toLowerCase()} (${m.percentageImpact > 0 ? '+' : ''}${m.percentageImpact}%)`).join(', ')
            : 'Standard complexity';

        const skillLevel = badgeLevel ? `${badgeLevel} badge freelancer` : 'To be assigned';

        const clientExplanation = `This price is based on:\n✓ Project scope: ${scopeSize}\n✓ Complexity: ${complexityFactors}\n✓ Freelancer: ${skillLevel}\n\nThis is a fixed price. You can accept, reduce scope, or cancel.`;

        // Freelancer explanation
        const freelancerExplanation = badgeLevel
            ? `This price reflects your ${badgeLevel} badge level, project complexity, and platform fair pricing standards. You can accept or decline this invitation.`
            : 'Price will be finalized when a freelancer is assigned based on their badge level.';

        return { clientExplanation, freelancerExplanation };
    }

    /**
     * MAIN CALCULATION METHOD
     */
    public static async calculatePrice(params: PricingCalculationParams): Promise<PricingResult> {
        console.log('🔢 Starting pricing calculation for project:', params.projectId);

        try {
            // STEP 1: Extract work units
            const workUnits = await this.extractWorkUnits(params.scopeId);
            console.log(`  ✓ Extracted ${workUnits.length} work units`);

            // STEP 2: Aggregate base prices
            const { min: baseMin, max: baseMax } = this.aggregateBasePrices(workUnits);
            console.log(`  ✓ Base price range: ₹${baseMin} - ₹${baseMax}`);

            // ENFORCEMENT: Validate base prices
            if (baseMin <= 0 || baseMax <= 0) {
                throw new Error('FATAL: Invalid base price range');
            }
            if (baseMin >= baseMax) {
                throw new Error('FATAL: Base min price must be less than max price');
            }

            // STEP 3: Analyze difficulty
            const modifiers = await this.analyzeDifficulty(params.scopeId);
            console.log(`  ✓ Applied ${modifiers.length} difficulty modifiers`);

            // STEP 4: Apply modifiers
            const { adjustedMin, adjustedMax, totalImpact } = this.applyModifiers(baseMin, baseMax, modifiers);
            console.log(`  ✓ Adjusted price range: ₹${adjustedMin} - ₹${adjustedMax} (${totalImpact > 0 ? '+' : ''}${totalImpact}%)`);

            // STEP 5: Position via badge
            const { finalPrice, badgeLevel, positioning } = await this.positionViaBadge(
                adjustedMin,
                adjustedMax,
                params.freelancerId
            );
            console.log(`  ✓ Final price: ₹${finalPrice}${badgeLevel ? ` (${badgeLevel} badge)` : ''}`);

            // ENFORCEMENT: Final price validation
            if (finalPrice < baseMin * 0.5) {
                throw new Error('FATAL: Final price below absolute minimum');
            }
            if (finalPrice > baseMax * 1.5) {
                throw new Error('FATAL: Final price above absolute maximum');
            }

            // STEP 6: Generate explanations
            const { clientExplanation, freelancerExplanation } = this.generateExplanations(
                workUnits,
                modifiers,
                badgeLevel,
                finalPrice
            );

            // Create calculation log
            const calculationLog = {
                timestamp: new Date(),
                steps: {
                    step1_workUnits: workUnits,
                    step2_baseRange: { min: baseMin, max: baseMax },
                    step3_modifiers: modifiers,
                    step4_adjustedRange: { min: adjustedMin, max: adjustedMax, totalImpact },
                    step5_badgePositioning: { badgeLevel, positioning, finalPrice },
                },
            };

            // Save to database
            const projectPricing = await ProjectPricing.create({
                projectId: Types.ObjectId.isValid(params.projectId)
                    ? new Types.ObjectId(params.projectId)
                    : new Types.ObjectId(), // Generate new ObjectId if invalid
                scopeId: new Types.ObjectId(params.scopeId),
                baseWorkUnits: workUnits,
                aggregatedMinPrice: baseMin,
                aggregatedMaxPrice: baseMax,
                appliedModifiers: modifiers,
                totalModifierImpact: totalImpact,
                adjustedMinPrice: adjustedMin,
                adjustedMaxPrice: adjustedMax,
                freelancerBadgeLevel: badgeLevel as any,
                badgePositioning: positioning,
                finalPrice,
                currency: 'INR',
                calculationLog,
                clientExplanation,
                freelancerExplanation,
                status: PricingStatus.CALCULATED,
                calculatedAt: new Date(),
            });

            // Audit log
            await PricingAudit.create({
                action: PricingAuditAction.PRICE_CALCULATED,
                performedBy: new Types.ObjectId(params.userId),
                userRole: AuditUserRole.SYSTEM,
                entityType: AuditEntityType.PROJECT_PRICING,
                entityId: projectPricing._id,
                changes: { finalPrice, baseRange: { min: baseMin, max: baseMax } },
                timestamp: new Date(),
            });

            console.log('✅ Pricing calculation complete');

            return {
                finalPrice,
                currency: 'INR',
                clientExplanation,
                freelancerExplanation,
                priceRange: { min: adjustedMin, max: adjustedMax },
                calculationLog,
            };
        } catch (error: any) {
            console.error('❌ Pricing calculation error:', error.message);
            throw error;
        }
    }

    /**
     * Lock pricing (after client accepts)
     */
    public static async lockPrice(projectId: string, userId: string): Promise<void> {
        const pricing = await ProjectPricing.findOne({ projectId: new Types.ObjectId(projectId) });
        if (!pricing) {
            throw new Error('Pricing not found for project');
        }

        if (pricing.lockedAt) {
            throw new Error('Price already locked');
        }

        pricing.status = PricingStatus.PRESENTED_TO_CLIENT;
        pricing.lockedAt = new Date();
        await pricing.save();

        // Audit log
        await PricingAudit.create({
            action: PricingAuditAction.PRICE_LOCKED,
            performedBy: new Types.ObjectId(userId),
            userRole: AuditUserRole.CLIENT,
            entityType: AuditEntityType.PROJECT_PRICING,
            entityId: pricing._id,
            changes: { lockedAt: pricing.lockedAt },
            timestamp: new Date(),
        });

        console.log('🔒 Price locked for project:', projectId);
    }
}
