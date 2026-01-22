/**
 * WORK UNIT MAPPINGS
 * 
 * Maps scope items to Effort Units (EU)
 * 1 EU = 1 person-day (8 productive hours, mid-level)
 */

export interface WorkUnitMapping {
    field: string;
    itemType: string;
    complexity: 'basic' | 'standard' | 'complex' | 'light' | 'deep' | 'core' | 'full';
    euValue: number;
}

/**
 * WORK-UNIT MAP (FIELD → EU)
 */

// 1) UI/UX Design
const UIUX_MAPPINGS: WorkUnitMapping[] = [
    { field: 'UI/UX Design', itemType: 'screen', complexity: 'basic', euValue: 0.5 },
    { field: 'UI/UX Design', itemType: 'screen', complexity: 'standard', euValue: 0.75 },
    { field: 'UI/UX Design', itemType: 'screen', complexity: 'complex', euValue: 1.5 },
    { field: 'UI/UX Design', itemType: 'user_research', complexity: 'light', euValue: 1 },
    { field: 'UI/UX Design', itemType: 'user_research', complexity: 'deep', euValue: 3 },
    { field: 'UI/UX Design', itemType: 'design_system', complexity: 'core', euValue: 3 },
    { field: 'UI/UX Design', itemType: 'design_system', complexity: 'full', euValue: 6 },
    { field: 'UI/UX Design', itemType: 'ux_audit', complexity: 'standard', euValue: 2 },
    { field: 'UI/UX Design', itemType: 'prototyping', complexity: 'standard', euValue: 2 },
];

// 2) Web Frontend / WordPress
const WEB_FRONTEND_MAPPINGS: WorkUnitMapping[] = [
    { field: 'Web Frontend / WordPress', itemType: 'page', complexity: 'basic', euValue: 0.5 },
    { field: 'Web Frontend / WordPress', itemType: 'page', complexity: 'standard', euValue: 0.75 },
    { field: 'Web Frontend / WordPress', itemType: 'page', complexity: 'complex', euValue: 1.5 },
    { field: 'Web Frontend / WordPress', itemType: 'custom_section', complexity: 'standard', euValue: 0.75 },
    { field: 'Web Frontend / WordPress', itemType: 'animation', complexity: 'standard', euValue: 0.75 },
    { field: 'Web Frontend / WordPress', itemType: 'cpt_admin_ui', complexity: 'standard', euValue: 2 },
    { field: 'Web Frontend / WordPress', itemType: 'form', complexity: 'standard', euValue: 1 },
    { field: 'Web Frontend / WordPress', itemType: 'workflow', complexity: 'standard', euValue: 1 },
    { field: 'Web Frontend / WordPress', itemType: 'integration', complexity: 'standard', euValue: 2 },
];

// 3) Backend / Full-Stack
const BACKEND_MAPPINGS: WorkUnitMapping[] = [
    { field: 'Backend / Full-Stack', itemType: 'api', complexity: 'basic', euValue: 0.5 },
    { field: 'Backend / Full-Stack', itemType: 'api', complexity: 'complex', euValue: 1.5 },
    { field: 'Backend / Full-Stack', itemType: 'auth_roles', complexity: 'standard', euValue: 2 },
    { field: 'Backend / Full-Stack', itemType: 'data_model', complexity: 'standard', euValue: 2 },
    { field: 'Backend / Full-Stack', itemType: 'payment', complexity: 'standard', euValue: 2 },
    { field: 'Backend / Full-Stack', itemType: 'payment', complexity: 'complex', euValue: 3 },
    { field: 'Backend / Full-Stack', itemType: 'crm', complexity: 'standard', euValue: 2 },
    { field: 'Backend / Full-Stack', itemType: 'crm', complexity: 'complex', euValue: 3 },
];

// 4) Mobile App Development
const MOBILE_MAPPINGS: WorkUnitMapping[] = [
    { field: 'Mobile App Development', itemType: 'screen', complexity: 'basic', euValue: 1 },
    { field: 'Mobile App Development', itemType: 'screen', complexity: 'standard', euValue: 1.5 },
    { field: 'Mobile App Development', itemType: 'screen', complexity: 'complex', euValue: 2 },
    { field: 'Mobile App Development', itemType: 'api_sync', complexity: 'standard', euValue: 1 },
    { field: 'Mobile App Development', itemType: 'push_notifications', complexity: 'standard', euValue: 1 },
    { field: 'Mobile App Development', itemType: 'analytics', complexity: 'standard', euValue: 1 },
    { field: 'Mobile App Development', itemType: 'app_store_prep', complexity: 'standard', euValue: 1 },
];

// 5) Graphic Design / Branding
const GRAPHIC_MAPPINGS: WorkUnitMapping[] = [
    { field: 'Graphic Design / Branding', itemType: 'static_asset', complexity: 'basic', euValue: 0.125 },
    { field: 'Graphic Design / Branding', itemType: 'logo_system', complexity: 'standard', euValue: 2 },
    { field: 'Graphic Design / Branding', itemType: 'brand_kit', complexity: 'standard', euValue: 3 },
    { field: 'Graphic Design / Branding', itemType: 'campaign_pack', complexity: 'standard', euValue: 2 },
];

// 6) Motion / Video / Advanced Visuals
const MOTION_MAPPINGS: WorkUnitMapping[] = [
    { field: 'Motion / Video / Advanced Visuals', itemType: 'video_clip_30s', complexity: 'standard', euValue: 2 },
    { field: 'Motion / Video / Advanced Visuals', itemType: 'storyboard', complexity: 'standard', euValue: 1 },
    { field: 'Motion / Video / Advanced Visuals', itemType: 'explainer_60_90s', complexity: 'standard', euValue: 4 },
];

// 7) Content Writing & Strategy
const CONTENT_MAPPINGS: WorkUnitMapping[] = [
    { field: 'Content Writing & Strategy', itemType: 'content_500_words', complexity: 'standard', euValue: 0.25 },
    { field: 'Content Writing & Strategy', itemType: 'page_strategy_copy', complexity: 'standard', euValue: 1 },
    { field: 'Content Writing & Strategy', itemType: 'editorial_calendar', complexity: 'standard', euValue: 1 },
    { field: 'Content Writing & Strategy', itemType: 'seo_cluster_5_pages', complexity: 'standard', euValue: 2 },
];

// 8) Digital Marketing (SEO/Ads/Social)
const MARKETING_MAPPINGS: WorkUnitMapping[] = [
    { field: 'Digital Marketing (SEO/Ads/Social)', itemType: 'seo_audit', complexity: 'standard', euValue: 1 },
    { field: 'Digital Marketing (SEO/Ads/Social)', itemType: 'keyword_set_50', complexity: 'standard', euValue: 0.5 },
    { field: 'Digital Marketing (SEO/Ads/Social)', itemType: 'campaign_setup', complexity: 'standard', euValue: 1 },
    { field: 'Digital Marketing (SEO/Ads/Social)', itemType: 'monthly_management', complexity: 'standard', euValue: 2 },
];

// 9) Data / Automation / Integrations
const DATA_MAPPINGS: WorkUnitMapping[] = [
    { field: 'Data / Automation / Integrations', itemType: 'etl_connector', complexity: 'standard', euValue: 2 },
    { field: 'Data / Automation / Integrations', itemType: 'workflow_automation', complexity: 'standard', euValue: 1 },
    { field: 'Data / Automation / Integrations', itemType: 'dashboard', complexity: 'standard', euValue: 2 },
    { field: 'Data / Automation / Integrations', itemType: 'rpa_bot', complexity: 'standard', euValue: 3 },
];

// 10) QA / Testing / Optimization
const QA_MAPPINGS: WorkUnitMapping[] = [
    { field: 'QA / Testing / Optimization', itemType: 'test_plan', complexity: 'standard', euValue: 1 },
    { field: 'QA / Testing / Optimization', itemType: 'regression_cycle', complexity: 'standard', euValue: 2 },
    { field: 'QA / Testing / Optimization', itemType: 'performance_audit', complexity: 'standard', euValue: 1.5 },
    { field: 'QA / Testing / Optimization', itemType: 'fix_sprint', complexity: 'standard', euValue: 2 },
];

/**
 * All work unit mappings combined
 */
const ALL_MAPPINGS: WorkUnitMapping[] = [
    ...UIUX_MAPPINGS,
    ...WEB_FRONTEND_MAPPINGS,
    ...BACKEND_MAPPINGS,
    ...MOBILE_MAPPINGS,
    ...GRAPHIC_MAPPINGS,
    ...MOTION_MAPPINGS,
    ...CONTENT_MAPPINGS,
    ...MARKETING_MAPPINGS,
    ...DATA_MAPPINGS,
    ...QA_MAPPINGS,
];

/**
 * Maximum EU cap per item to prevent over-estimation
 */
const MAX_EU_PER_ITEM = 3;

/**
 * Get EU value for a work item
 * 
 * This function attempts to match scope items to work units by:
 * 1. Exact field + itemType + complexity match
 * 2. Field + itemType match (uses standard complexity)
 * 3. Field match only (uses default EU value)
 * 
 * Optimizations:
 * - Caps maximum EU per item to prevent over-estimation
 * - Uses conservative estimates for unmatched items
 */
export function getWorkUnitEU(
    field: string,
    itemDescription: string,
    complexity?: 'basic' | 'standard' | 'complex'
): number {
    // Normalize field name
    const normalizedField = normalizeFieldName(field);
    
    // Try to infer itemType from description
    const itemType = inferItemType(itemDescription, normalizedField);
    
    // Use provided complexity or default to 'standard'
    const itemComplexity = complexity || inferComplexity(itemDescription);
    
    // Try exact match first
    const exactMatch = ALL_MAPPINGS.find(
        m => m.field === normalizedField && 
        m.itemType === itemType && 
        m.complexity === itemComplexity
    );
    
    if (exactMatch) {
        return Math.min(exactMatch.euValue, MAX_EU_PER_ITEM);
    }
    
    // Try field + itemType match (standard complexity)
    const standardMatch = ALL_MAPPINGS.find(
        m => m.field === normalizedField && 
        m.itemType === itemType && 
        m.complexity === 'standard'
    );
    
    if (standardMatch) {
        return Math.min(standardMatch.euValue, MAX_EU_PER_ITEM);
    }
    
    // Try field match only (use average EU for that field)
    const fieldMatches = ALL_MAPPINGS.filter(m => m.field === normalizedField);
    if (fieldMatches.length > 0) {
        const avgEU = fieldMatches.reduce((sum, m) => sum + m.euValue, 0) / fieldMatches.length;
        // Use conservative estimate: 75% of average
        return Math.min(avgEU * 0.75, MAX_EU_PER_ITEM);
    }
    
    // Default fallback: 0.5 EU (more conservative)
    console.warn(`⚠️ No work unit mapping found for "${field}" / "${itemDescription}", using conservative 0.5 EU`);
    return 0.5;
}

/**
 * Normalize field name to match pricing field names
 */
function normalizeFieldName(field: string): string {
    const fieldLower = field.toLowerCase();
    
    // UI/UX
    if (fieldLower.includes('ui') || fieldLower.includes('ux') || fieldLower.includes('design')) {
        if (fieldLower.includes('graphic')) {
            return 'Graphic Design / Branding';
        }
        return 'UI/UX Design';
    }
    
    // Web
    if (fieldLower.includes('web') || fieldLower.includes('frontend') || fieldLower.includes('wordpress')) {
        if (fieldLower.includes('backend') || fieldLower.includes('full stack') || fieldLower.includes('fullstack')) {
            return 'Backend / Full-Stack';
        }
        return 'Web Frontend / WordPress';
    }
    
    // Backend
    if (fieldLower.includes('backend') || fieldLower.includes('api') || fieldLower.includes('server')) {
        return 'Backend / Full-Stack';
    }
    
    // Mobile
    if (fieldLower.includes('mobile') || fieldLower.includes('app') || fieldLower.includes('ios') || fieldLower.includes('android')) {
        return 'Mobile App Development';
    }
    
    // Graphic
    if (fieldLower.includes('graphic') || fieldLower.includes('branding') || fieldLower.includes('logo')) {
        return 'Graphic Design / Branding';
    }
    
    // Motion/Video
    if (fieldLower.includes('motion') || fieldLower.includes('video') || fieldLower.includes('animation')) {
        return 'Motion / Video / Advanced Visuals';
    }
    
    // Content
    if (fieldLower.includes('content') || fieldLower.includes('writing') || fieldLower.includes('copy')) {
        return 'Content Writing & Strategy';
    }
    
    // Marketing
    if (fieldLower.includes('marketing') || fieldLower.includes('seo') || fieldLower.includes('social') || fieldLower.includes('ads')) {
        return 'Digital Marketing (SEO/Ads/Social)';
    }
    
    // Data/Automation
    if (fieldLower.includes('data') || fieldLower.includes('automation') || fieldLower.includes('integration') || fieldLower.includes('etl')) {
        return 'Data / Automation / Integrations';
    }
    
    // QA/Testing
    if (fieldLower.includes('qa') || fieldLower.includes('test') || fieldLower.includes('quality')) {
        return 'QA / Testing / Optimization';
    }
    
    // Default
    return field;
}

/**
 * Infer item type from description
 */
function inferItemType(description: string, field: string): string {
    const descLower = description.toLowerCase();
    
    // UI/UX patterns
    if (field === 'UI/UX Design') {
        if (descLower.includes('screen') || descLower.includes('page') || descLower.includes('interface')) return 'screen';
        if (descLower.includes('research') || descLower.includes('user research')) return 'user_research';
        if (descLower.includes('design system') || descLower.includes('component library')) return 'design_system';
        if (descLower.includes('audit') || descLower.includes('review')) return 'ux_audit';
        if (descLower.includes('prototype') || descLower.includes('mockup')) return 'prototyping';
        return 'screen'; // default
    }
    
    // Web patterns
    if (field === 'Web Frontend / WordPress') {
        if (descLower.includes('page') || descLower.includes('landing')) return 'page';
        if (descLower.includes('section') || descLower.includes('component')) return 'custom_section';
        if (descLower.includes('animation') || descLower.includes('interactive')) return 'animation';
        if (descLower.includes('cpt') || descLower.includes('custom post type') || descLower.includes('admin')) return 'cpt_admin_ui';
        if (descLower.includes('form')) return 'form';
        if (descLower.includes('workflow') || descLower.includes('process')) return 'workflow';
        if (descLower.includes('integration') || descLower.includes('api')) return 'integration';
        return 'page'; // default
    }
    
    // Backend patterns
    if (field === 'Backend / Full-Stack') {
        if (descLower.includes('api') || descLower.includes('endpoint')) return 'api';
        if (descLower.includes('auth') || descLower.includes('login') || descLower.includes('role')) return 'auth_roles';
        if (descLower.includes('model') || descLower.includes('schema') || descLower.includes('database')) return 'data_model';
        if (descLower.includes('payment') || descLower.includes('stripe') || descLower.includes('paypal')) return 'payment';
        if (descLower.includes('crm') || descLower.includes('customer')) return 'crm';
        return 'api'; // default
    }
    
    // Mobile patterns
    if (field === 'Mobile App Development') {
        if (descLower.includes('screen') || descLower.includes('view')) return 'screen';
        if (descLower.includes('sync') || descLower.includes('api')) return 'api_sync';
        if (descLower.includes('push') || descLower.includes('notification')) return 'push_notifications';
        if (descLower.includes('analytics') || descLower.includes('tracking')) return 'analytics';
        if (descLower.includes('store') || descLower.includes('publish')) return 'app_store_prep';
        return 'screen'; // default
    }
    
    // Graphic patterns
    if (field === 'Graphic Design / Branding') {
        if (descLower.includes('logo')) return 'logo_system';
        if (descLower.includes('brand') || descLower.includes('identity')) return 'brand_kit';
        if (descLower.includes('campaign') || descLower.includes('marketing')) return 'campaign_pack';
        return 'static_asset'; // default
    }
    
    // Motion/Video patterns
    if (field === 'Motion / Video / Advanced Visuals') {
        if (descLower.includes('30s') || descLower.includes('30 second')) return 'video_clip_30s';
        if (descLower.includes('storyboard') || descLower.includes('story board')) return 'storyboard';
        if (descLower.includes('explainer') || descLower.includes('60') || descLower.includes('90')) return 'explainer_60_90s';
        return 'video_clip_30s'; // default
    }
    
    // Content patterns
    if (field === 'Content Writing & Strategy') {
        if (descLower.includes('500') || descLower.includes('word')) return 'content_500_words';
        if (descLower.includes('strategy') || descLower.includes('copy')) return 'page_strategy_copy';
        if (descLower.includes('calendar') || descLower.includes('editorial')) return 'editorial_calendar';
        if (descLower.includes('seo') || descLower.includes('cluster') || descLower.includes('5 page')) return 'seo_cluster_5_pages';
        return 'content_500_words'; // default
    }
    
    // Marketing patterns
    if (field === 'Digital Marketing (SEO/Ads/Social)') {
        if (descLower.includes('audit') || descLower.includes('seo audit')) return 'seo_audit';
        if (descLower.includes('keyword') || descLower.includes('50')) return 'keyword_set_50';
        if (descLower.includes('campaign') || descLower.includes('setup')) return 'campaign_setup';
        if (descLower.includes('management') || descLower.includes('monthly')) return 'monthly_management';
        return 'seo_audit'; // default
    }
    
    // Data patterns
    if (field === 'Data / Automation / Integrations') {
        if (descLower.includes('etl') || descLower.includes('connector') || descLower.includes('data pipeline')) return 'etl_connector';
        if (descLower.includes('workflow') || descLower.includes('automation')) return 'workflow_automation';
        if (descLower.includes('dashboard') || descLower.includes('visualization')) return 'dashboard';
        if (descLower.includes('rpa') || descLower.includes('bot') || descLower.includes('robot')) return 'rpa_bot';
        return 'workflow_automation'; // default
    }
    
    // QA patterns
    if (field === 'QA / Testing / Optimization') {
        if (descLower.includes('test plan') || descLower.includes('planning')) return 'test_plan';
        if (descLower.includes('regression') || descLower.includes('cycle')) return 'regression_cycle';
        if (descLower.includes('performance') || descLower.includes('audit')) return 'performance_audit';
        if (descLower.includes('fix') || descLower.includes('sprint')) return 'fix_sprint';
        return 'test_plan'; // default
    }
    
    return 'standard';
}

/**
 * Infer complexity from description
 */
function inferComplexity(description: string): 'basic' | 'standard' | 'complex' {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('basic') || descLower.includes('simple') || descLower.includes('minimal')) {
        return 'basic';
    }
    
    if (descLower.includes('complex') || descLower.includes('advanced') || descLower.includes('sophisticated') || descLower.includes('enterprise')) {
        return 'complex';
    }
    
    return 'standard';
}
