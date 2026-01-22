/**
 * DETERMINISTIC PRICING ENGINE
 * 
 * Prices WORK, not people.
 * Outputs LOW / MEDIUM / HIGH for each project.
 * Fair to clients and freelancers.
 * Auditable and scalable.
 * 
 * No human sets per-project prices.
 * No AI "guesses" money.
 * Rules decide.
 */

import { Scope } from '../models/Scope.js';
import { Types } from 'mongoose';
import { getBaseRate, GLOBAL_CAPS, PRICE_TIERS, roundToNearest50 } from '../config/baseRates.js';
import { getWorkUnitEU } from '../config/workUnitMappings.js';
import { calculateMultiplierProduct, inferDifficultyFactors } from '../config/difficultyMultipliers.js';
import { PricingAudit, PricingAuditAction, AuditUserRole, AuditEntityType } from '../models/PricingAudit.js';

/**
 * Work Unit (WU) - scope item mapped to EU
 */
export interface WorkUnit {
    field: string;
    itemDescription: string;
    euValue: number; // Effort Units for this work item
}

/**
 * Field-level aggregation
 */
export interface FieldAggregation {
    field: string;
    twu: number; // Total Work Units (sum of EU for this field)
    mp: number; // Multiplier Product (applied to all fields)
    ei: number; // Effort Index = TWU × MP
    baseRate: number; // ₹ per EU for this field
    fieldValue: number; // EI × BaseRate
}

/**
 * Pricing calculation result
 */
export interface PricingEstimate {
    // Core calculations
    workUnits: WorkUnit[];
    fieldAggregations: FieldAggregation[];
    twu: number; // Total Work Units across all fields
    mp: number; // Multiplier Product
    bpv: number; // Base Project Value
    
    // Price tiers
    low: number; // BPV × 0.85 (rounded to ₹50)
    medium: number; // BPV × 1.00 (rounded to ₹50)
    high: number; // BPV × 1.20 (rounded to ₹50)
    
    // Applied caps
    finalLow: number; // After global caps
    finalMedium: number; // After global caps
    finalHigh: number; // After global caps
    
    // Breakdown for display
    breakdown: {
        scopeSize: string; // Human-readable scope description
        complexityDrivers: string[]; // Major complexity factors
        recommended: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    
    // Audit data
    auditId?: string;
    calculationDetails: {
        timestamp: Date;
        difficultyFactors: any;
        appliedCaps: {
            minCap: number;
            maxCap: number;
            lowCapped: boolean;
            mediumCapped: boolean;
            highCapped: boolean;
        };
    };
}

/**
 * Parse SOW → Extract Work Units (WU) by field
 * 
 * Optimizations:
 * - Deduplicates items between inScopeItems and deliverables
 * - Uses inScopeItems as primary source (more detailed)
 * - Only adds unique deliverables not already covered
 */
function parseSOWToWorkUnits(scope: any): WorkUnit[] {
    const workUnits: WorkUnit[] = [];
    const field = scope.field || 'Unknown';
    const seenItems = new Set<string>();
    
    // Primary source: inScopeItems (more detailed)
    if (scope.inScopeItems && Array.isArray(scope.inScopeItems)) {
        for (const item of scope.inScopeItems) {
            if (typeof item === 'string' && item.trim()) {
                const normalizedItem = item.trim().toLowerCase();
                // Skip if we've seen a similar item
                if (!seenItems.has(normalizedItem)) {
                    const euValue = getWorkUnitEU(field, item);
                    workUnits.push({
                        field,
                        itemDescription: item,
                        euValue,
                    });
                    seenItems.add(normalizedItem);
                }
            }
        }
    }
    
    // Secondary source: deliverables (only add if not already covered)
    if (scope.deliverables && Array.isArray(scope.deliverables)) {
        for (const deliverable of scope.deliverables) {
            if (typeof deliverable === 'string' && deliverable.trim()) {
                const normalizedDeliverable = deliverable.trim().toLowerCase();
                // Check if this deliverable is already covered by an inScopeItem
                const isDuplicate = Array.from(seenItems).some(seen => 
                    normalizedDeliverable.includes(seen) || seen.includes(normalizedDeliverable)
                );
                
                if (!isDuplicate && !seenItems.has(normalizedDeliverable)) {
                    const euValue = getWorkUnitEU(field, deliverable);
                    workUnits.push({
                        field,
                        itemDescription: deliverable,
                        euValue,
                    });
                    seenItems.add(normalizedDeliverable);
                }
            }
        }
    }
    
    // If no work units found, create a default one
    if (workUnits.length === 0) {
        workUnits.push({
            field,
            itemDescription: 'Standard project scope',
            euValue: 1, // Default 1 EU
        });
    }
    
    return workUnits;
}

/**
 * Calculate TWU per field
 */
function calculateTWUByField(workUnits: WorkUnit[]): Map<string, number> {
    const twuByField = new Map<string, number>();
    
    for (const wu of workUnits) {
        const current = twuByField.get(wu.field) || 0;
        twuByField.set(wu.field, current + wu.euValue);
    }
    
    return twuByField;
}

/**
 * Calculate field aggregations
 * 
 * Formula: EI = TWU × MP, BPV = Σ(EI_field × BaseRate_field)
 */
function calculateFieldAggregations(
    twuByField: Map<string, number>,
    mp: number
): FieldAggregation[] {
    const aggregations: FieldAggregation[] = [];
    
    for (const [field, twu] of twuByField.entries()) {
        const baseRate = getBaseRate(field);
        const ei = twu * mp; // Effort Index = TWU × MP
        const fieldValue = ei * baseRate; // EI × BaseRate
        
        aggregations.push({
            field,
            twu,
            mp,
            ei,
            baseRate,
            fieldValue,
        });
    }
    
    return aggregations;
}

/**
 * Generate breakdown for display
 */
function generateBreakdown(
    workUnits: WorkUnit[],
    fieldAggregations: FieldAggregation[],
    difficultyFactors: any,
    mp: number,
    totalTWU: number
): {
    scopeSize: string;
    complexityDrivers: string[];
    recommended: 'LOW' | 'MEDIUM' | 'HIGH';
} {
    // Scope size description
    const totalEU = totalTWU;
    let scopeSize = '';
    if (totalEU < 2) {
        scopeSize = 'Small scope';
    } else if (totalEU < 5) {
        scopeSize = 'Medium scope';
    } else if (totalEU < 10) {
        scopeSize = 'Large scope';
    } else {
        scopeSize = 'Very large scope';
    }
    
    if (fieldAggregations.length > 1) {
        scopeSize += ` across ${fieldAggregations.length} fields`;
    }
    
    
    // Complexity drivers
    const drivers: string[] = [];
    
    if (difficultyFactors.urgency === 'urgent') {
        drivers.push('Urgent deadline');
    }
    
    if (difficultyFactors.risk_compliance === 'regulated') {
        drivers.push('Regulated industry requirements');
    }
    
    if (difficultyFactors.integrations === 'multiple') {
        drivers.push('Multiple integrations');
    }
    
    if (difficultyFactors.ambiguity === 'some') {
        drivers.push('Content/assets to be provided');
    }
    
    if (difficultyFactors.clarity === 'low') {
        drivers.push('Unclear requirements');
    }
    
    if (mp > 1.2) {
        drivers.push('High complexity multiplier');
    }
    
    if (drivers.length === 0) {
        drivers.push('Standard complexity');
    }
    
    // Recommended tier (default to MEDIUM)
    const recommended: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    
    return {
        scopeSize,
        complexityDrivers: drivers,
        recommended,
    };
}

/**
 * Apply global caps
 */
function applyGlobalCaps(low: number, medium: number, high: number): {
    finalLow: number;
    finalMedium: number;
    finalHigh: number;
    lowCapped: boolean;
    mediumCapped: boolean;
    highCapped: boolean;
} {
    const finalLow = Math.max(GLOBAL_CAPS.min, Math.min(low, GLOBAL_CAPS.max));
    const finalMedium = Math.max(GLOBAL_CAPS.min, Math.min(medium, GLOBAL_CAPS.max));
    const finalHigh = Math.max(GLOBAL_CAPS.min, Math.min(high, GLOBAL_CAPS.max));
    
    return {
        finalLow,
        finalMedium,
        finalHigh,
        lowCapped: finalLow !== low,
        mediumCapped: finalMedium !== medium,
        highCapped: finalHigh !== high,
    };
}

/**
 * MAIN CALCULATION METHOD
 * 
 * FORMULA:
 * TWU = Σ(workUnits)
 * EI = TWU × multipliers (cap 1.25)
 * BPV = Σ(EI_field × BaseRate_field)
 * LOW/MED/HIGH = BPV × (0.85/1.0/1.2)
 * 
 * CALCULATION ORDER (MUST FOLLOW):
 * 1. Parse SOW → WU by field
 * 2. TWU_field = Σ(WU_field)
 * 3. MP from answers (cap at 1.25)
 * 4. EI_field = TWU_field × MP
 * 5. BPV = Σ(EI_field × BaseRate_field)
 * 6. LOW/MED/HIGH with rounding (×0.85/1.0/1.2)
 * 7. Enforce global caps (min ₹1,000, max ₹20,00,000)
 * 8. Write pricingAudit (TWU, EI, multipliers, prices)
 */
export async function calculateDeterministicPrice(params: {
    scopeId: string;
    projectId?: string;
    userId: string;
}): Promise<PricingEstimate> {
    console.log('🔢 Starting deterministic pricing calculation for scope:', params.scopeId);
    
    try {
        // Load scope
        const scope = await Scope.findById(params.scopeId);
        if (!scope) {
            throw new Error('Scope not found');
        }
        
        // STEP 1: Parse SOW → WU by field
        const workUnits = parseSOWToWorkUnits(scope);
        console.log(`  ✓ Extracted ${workUnits.length} work units`);
        
        // STEP 2: Calculate TWU per field
        const twuByField = calculateTWUByField(workUnits);
        const totalTWU = Array.from(twuByField.values()).reduce((sum, twu) => sum + twu, 0);
        console.log(`  ✓ Total Work Units (TWU): ${totalTWU.toFixed(2)}`);
        
        // STEP 3: Calculate Multiplier Product (MP) from difficulty factors
        const difficultyFactors = inferDifficultyFactors(scope);
        const mp = calculateMultiplierProduct(difficultyFactors);
        console.log(`  ✓ Multiplier Product (MP): ${mp.toFixed(2)} (cap: 1.25)`);
        console.log(`    - Clarity: ${difficultyFactors.clarity}`);
        console.log(`    - Urgency: ${difficultyFactors.urgency}`);
        console.log(`    - Risk/Compliance: ${difficultyFactors.risk_compliance}`);
        console.log(`    - Integrations: ${difficultyFactors.integrations}`);
        console.log(`    - Ambiguity: ${difficultyFactors.ambiguity}`);
        
        // STEP 4: Calculate Effort Index (EI) per field
        const fieldAggregations = calculateFieldAggregations(twuByField, mp);
        console.log(`  ✓ Calculated ${fieldAggregations.length} field aggregations`);
        
        // STEP 5: Calculate Base Project Value (BPV)
        const bpv = fieldAggregations.reduce((sum, f) => sum + f.fieldValue, 0);
        console.log(`  ✓ Base Project Value (BPV): ₹${bpv.toFixed(2)}`);
        
        // STEP 6: Calculate LOW/MEDIUM/HIGH with rounding
        const low = roundToNearest50(bpv * PRICE_TIERS.LOW);
        const medium = roundToNearest50(bpv * PRICE_TIERS.MEDIUM);
        const high = roundToNearest50(bpv * PRICE_TIERS.HIGH);
        console.log(`  ✓ Price tiers: LOW=₹${low}, MEDIUM=₹${medium}, HIGH=₹${high}`);
        
        // STEP 7: Enforce global caps
        const capped = applyGlobalCaps(low, medium, high);
        console.log(`  ✓ Applied global caps: min=₹${GLOBAL_CAPS.min}, max=₹${GLOBAL_CAPS.max}`);
        
        // Generate breakdown
        const breakdown = generateBreakdown(workUnits, fieldAggregations, difficultyFactors, mp, totalTWU);
        
        // Create audit log
        const audit = await PricingAudit.create({
            action: PricingAuditAction.PRICE_CALCULATED,
            performedBy: new Types.ObjectId(params.userId),
            userRole: AuditUserRole.SYSTEM,
            entityType: AuditEntityType.PROJECT_PRICING,
            entityId: params.projectId ? new Types.ObjectId(params.projectId) : new Types.ObjectId(),
            changes: {
                calculation: {
                    workUnits,
                    fieldAggregations,
                    twu: totalTWU,
                    mp,
                    bpv,
                    tiers: {
                        low,
                        medium,
                        high,
                    },
                    finalTiers: {
                        low: capped.finalLow,
                        medium: capped.finalMedium,
                        high: capped.finalHigh,
                    },
                    difficultyFactors,
                    appliedCaps: capped,
                },
            },
            timestamp: new Date(),
        });
        
        console.log('✅ Deterministic pricing calculation complete');
        
        return {
            workUnits,
            fieldAggregations,
            twu: totalTWU,
            mp,
            bpv,
            low,
            medium,
            high,
            finalLow: capped.finalLow,
            finalMedium: capped.finalMedium,
            finalHigh: capped.finalHigh,
            breakdown,
            auditId: audit._id.toString(),
            calculationDetails: {
                timestamp: new Date(),
                difficultyFactors,
                appliedCaps: {
                    minCap: GLOBAL_CAPS.min,
                    maxCap: GLOBAL_CAPS.max,
                    lowCapped: capped.lowCapped,
                    mediumCapped: capped.mediumCapped,
                    highCapped: capped.highCapped,
                },
            },
        };
    } catch (error: any) {
        console.error('❌ Deterministic pricing calculation error:', error.message);
        throw error;
    }
}

/**
 * Get price for freelancer based on their badge
 * Freelancers see only the price matching their badge
 */
export function getPriceForBadge(
    estimate: PricingEstimate,
    badgeLevel: 'LOW' | 'MEDIUM' | 'HIGH'
): number {
    switch (badgeLevel) {
        case 'LOW':
            return estimate.finalLow;
        case 'MEDIUM':
            return estimate.finalMedium;
        case 'HIGH':
            return estimate.finalHigh;
        default:
            return estimate.finalMedium;
    }
}
