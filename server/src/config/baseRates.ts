/**
 * BASE RATES CONFIGURATION
 * 
 * Base rates in ₹ (INR) per Effort Unit (EU)
 * 1 EU = 1 person-day (8 productive hours, mid-level)
 * 
 * Admin can tune quarterly via API
 */

export interface BaseRateConfig {
    field: string;
    baseRatePerEU: number; // ₹ per Effort Unit
    lastUpdated?: Date;
    updatedBy?: string;
}

/**
 * The 10 Core Fields + Base Rates (₹ / EU)
 * Updated rates per specification
 */
export const BASE_RATES: Record<string, number> = {
    'UI/UX Design': 5000,
    'Web Frontend / WordPress': 4000,
    'Backend / Full-Stack': 6000,
    'Mobile App Development': 6500,
    'Graphic Design / Branding': 2000,
    'Motion / Video / Advanced Visuals': 5000,
    'Content Writing & Strategy': 2000,
    'Digital Marketing (SEO/Ads/Social)': 3000,
    'Data / Automation / Integrations': 7000,
    'QA / Testing / Optimization': 3000,
};

/**
 * Field name mappings (from client field names to pricing field names)
 */
export const FIELD_MAPPINGS: Record<string, string> = {
    'UI/UX Design': 'UI/UX Design',
    'Graphic Design': 'Graphic Design / Branding',
    'Web Development': 'Web Frontend / WordPress', // Default, can be refined
    'Frontend Development': 'Web Frontend / WordPress',
    'Backend Development': 'Backend / Full-Stack',
    'Full Stack Development': 'Backend / Full-Stack',
    'WordPress Development': 'Web Frontend / WordPress',
    'Mobile App Development': 'Mobile App Development',
    'iOS Development': 'Mobile App Development',
    'Android Development': 'Mobile App Development',
    'Video Production': 'Motion / Video / Advanced Visuals',
    'Motion Graphics': 'Motion / Video / Advanced Visuals',
    'Content Writing': 'Content Writing & Strategy',
    'Digital Marketing': 'Digital Marketing (SEO/Ads/Social)',
    'SEO (Search Engine Optimization)': 'Digital Marketing (SEO/Ads/Social)',
    'Data Science': 'Data / Automation / Integrations',
    'Data Analysis': 'Data / Automation / Integrations',
};

/**
 * Get base rate for a field
 */
export function getBaseRate(field: string): number {
    // Try direct match first
    if (BASE_RATES[field]) {
        return BASE_RATES[field];
    }
    
    // Try field mapping
    const mappedField = FIELD_MAPPINGS[field];
    if (mappedField && BASE_RATES[mappedField]) {
        return BASE_RATES[mappedField];
    }
    
    // Default fallback (average of all rates)
    const averageRate = Object.values(BASE_RATES).reduce((sum, rate) => sum + rate, 0) / Object.values(BASE_RATES).length;
    console.warn(`⚠️ No base rate found for field "${field}", using average: ₹${averageRate}`);
    return Math.round(averageRate);
}

/**
 * Global caps (admin configurable)
 */
export const GLOBAL_CAPS = {
    min: 1000,      // ₹1,000 minimum
    max: 2000000,   // ₹20,00,000 maximum
};

/**
 * Price tier multipliers
 */
export const PRICE_TIERS = {
    LOW: 0.85,      // BPV × 0.85
    MEDIUM: 1.00,   // BPV × 1.00
    HIGH: 1.20,     // BPV × 1.20
};

/**
 * Rounding increment (nearest ₹50)
 */
export const ROUNDING_INCREMENT = 50;

/**
 * Round to nearest ₹50
 */
export function roundToNearest50(amount: number): number {
    return Math.round(amount / ROUNDING_INCREMENT) * ROUNDING_INCREMENT;
}
