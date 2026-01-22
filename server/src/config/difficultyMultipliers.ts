/**
 * DIFFICULTY MULTIPLIERS CONFIGURATION
 * 
 * Objective multipliers that adjust effort based on project characteristics
 * Total MP cap = 1.5
 */

export interface DifficultyMultiplier {
    factor: string;
    level: string;
    multiplier: number;
    description: string;
}

/**
 * DIFFICULTY MULTIPLIERS (OBJECTIVE)
 * Updated per specification
 */
export const DIFFICULTY_MULTIPLIERS: Record<string, Record<string, number>> = {
    clarity: {
        clear: 0.95,
        medium: 1.00,
        low: 1.05,
    },
    urgency: {
        flexible: 1.00,
        balanced: 1.05,
        urgent: 1.10,
    },
    risk_compliance: {
        normal: 1.00,
        regulated: 1.08,
    },
    integrations: {
        none: 1.00,
        one: 1.05,
        multiple: 1.15, // Cap for integrations
    },
    ambiguity: {
        none: 1.00,
        some: 1.05,
    },
};

/**
 * Maximum multiplier product cap
 */
export const MAX_MULTIPLIER_PRODUCT = 1.25;

/**
 * Calculate multiplier product from difficulty factors
 * 
 * @param factors Object with clarity, urgency, risk_compliance, integrations, ambiguity
 * @returns Multiplier product (capped at 1.5)
 */
export function calculateMultiplierProduct(factors: {
    clarity?: 'clear' | 'medium' | 'low';
    urgency?: 'flexible' | 'balanced' | 'urgent';
    risk_compliance?: 'normal' | 'regulated';
    integrations?: 'none' | 'one' | 'multiple';
    ambiguity?: 'none' | 'some';
}): number {
    let mp = 1.0;
    
    // Clarity
    if (factors.clarity && DIFFICULTY_MULTIPLIERS.clarity[factors.clarity]) {
        mp *= DIFFICULTY_MULTIPLIERS.clarity[factors.clarity];
    }
    
    // Urgency
    if (factors.urgency && DIFFICULTY_MULTIPLIERS.urgency[factors.urgency]) {
        mp *= DIFFICULTY_MULTIPLIERS.urgency[factors.urgency];
    }
    
    // Risk/Compliance
    if (factors.risk_compliance && DIFFICULTY_MULTIPLIERS.risk_compliance[factors.risk_compliance]) {
        mp *= DIFFICULTY_MULTIPLIERS.risk_compliance[factors.risk_compliance];
    }
    
    // Integrations (cap at 1.15)
    if (factors.integrations && DIFFICULTY_MULTIPLIERS.integrations[factors.integrations]) {
        mp *= DIFFICULTY_MULTIPLIERS.integrations[factors.integrations];
    }
    
    // Ambiguity
    if (factors.ambiguity && DIFFICULTY_MULTIPLIERS.ambiguity[factors.ambiguity]) {
        mp *= DIFFICULTY_MULTIPLIERS.ambiguity[factors.ambiguity];
    }
    
    // Cap at 1.25
    return Math.min(mp, MAX_MULTIPLIER_PRODUCT);
}

/**
 * Infer difficulty factors from scope and intent answers
 */
export function inferDifficultyFactors(scope: {
    intentAnswers?: {
        goalOfWork?: string;
        usageContext?: string;
        priority?: string;
        deadline?: Date;
    };
    inScopeItems?: string[];
    deliverables?: string[];
}): {
    clarity: 'clear' | 'medium' | 'low';
    urgency: 'flexible' | 'balanced' | 'urgent';
    risk_compliance: 'normal' | 'regulated';
    integrations: 'none' | 'one' | 'multiple';
    ambiguity: 'none' | 'some';
} {
    const intent = scope.intentAnswers || {};
    const inScopeItems = scope.inScopeItems || [];
    const deliverables = scope.deliverables || [];
    
    // Clarity: based on detail in scope
    let clarity: 'clear' | 'medium' | 'low' = 'medium';
    const totalItems = inScopeItems.length + deliverables.length;
    if (totalItems >= 10 && intent.goalOfWork && intent.goalOfWork.length > 100) {
        clarity = 'clear';
    } else if (totalItems < 5 || !intent.goalOfWork || intent.goalOfWork.length < 50) {
        clarity = 'low';
    }
    
    // Urgency: based on deadline
    let urgency: 'flexible' | 'balanced' | 'urgent' = 'balanced';
    if (intent.deadline) {
        const daysUntilDeadline = Math.floor(
            (new Date(intent.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDeadline < 7) {
            urgency = 'urgent';
        } else if (daysUntilDeadline >= 30) {
            urgency = 'flexible';
        }
    }
    
    // Risk/Compliance: based on usage context
    let risk_compliance: 'normal' | 'regulated' = 'normal';
    const usageContext = (intent.usageContext || '').toLowerCase();
    if (usageContext.includes('healthcare') || 
        usageContext.includes('medical') || 
        usageContext.includes('finance') || 
        usageContext.includes('banking') || 
        usageContext.includes('legal') || 
        usageContext.includes('compliance') ||
        usageContext.includes('regulated')) {
        risk_compliance = 'regulated';
    }
    
    // Integrations: count integration mentions
    let integrations: 'none' | 'one' | 'multiple' = 'none';
    const allText = [
        ...inScopeItems,
        ...deliverables,
        intent.goalOfWork || '',
        intent.usageContext || '',
    ].join(' ').toLowerCase();
    
    const integrationKeywords = ['integration', 'api', 'connect', 'sync', 'webhook', 'third-party'];
    const integrationCount = integrationKeywords.filter(keyword => allText.includes(keyword)).length;
    if (integrationCount >= 2) {
        integrations = 'multiple';
    } else if (integrationCount === 1) {
        integrations = 'one';
    }
    
    // Ambiguity: based on content/assets mentions
    let ambiguity: 'none' | 'some' = 'none';
    const ambiguityKeywords = ['content', 'assets', 'materials', 'provided', 'supplied', 'tbd', 'to be determined'];
    if (ambiguityKeywords.some(keyword => allText.includes(keyword))) {
        ambiguity = 'some';
    }
    
    return {
        clarity,
        urgency,
        risk_compliance,
        integrations,
        ambiguity,
    };
}
