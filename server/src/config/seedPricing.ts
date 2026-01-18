import { PricingRule, DepthLevel } from '../models/PricingRule.js';
import { DifficultyModifier, ModifierType } from '../models/DifficultyModifier.js';
import { User, UserRole } from '../models/User.js';

/**
 * Seed Initial Pricing Rules and Difficulty Modifiers
 * Run this once to populate the database with base pricing data
 */
export const seedPricingData = async () => {
    try {
        // Find admin user for createdBy
        const admin = await User.findOne({ role: UserRole.ADMIN });
        if (!admin) {
            console.log('⚠️ No admin user found. Skipping pricing seed.');
            return;
        }

        // Check if already seeded
        const existingRules = await PricingRule.countDocuments();
        const existingModifiers = await DifficultyModifier.countDocuments();

        if (existingRules > 0 || existingModifiers > 0) {
            console.log('✓ Pricing data already seeded');
            return;
        }

        console.log('🌱 Seeding pricing rules and modifiers...');

        // ==================== PRICING RULES ====================

        const pricingRules = [
            // WEB DEVELOPMENT
            {
                field: 'Web Development',
                innerField: 'Frontend Development',
                deliverableType: 'Landing Page',
                depth: DepthLevel.STANDARD,
                minPrice: 500,
                maxPrice: 2000,
            },
            {
                field: 'Web Development',
                innerField: 'Frontend Development',
                deliverableType: 'Multi-Page Website',
                depth: DepthLevel.STANDARD,
                minPrice: 1500,
                maxPrice: 5000,
            },
            {
                field: 'Web Development',
                innerField: 'Backend Development',
                deliverableType: 'API Development',
                depth: DepthLevel.STANDARD,
                minPrice: 1000,
                maxPrice: 4000,
            },
            {
                field: 'Web Development',
                innerField: 'Full Stack Development',
                deliverableType: 'Web Application',
                depth: DepthLevel.COMPREHENSIVE,
                minPrice: 3000,
                maxPrice: 10000,
            },

            // UI/UX DESIGN
            {
                field: 'Design',
                innerField: 'UI Design',
                deliverableType: 'Mobile App Screens',
                depth: DepthLevel.STANDARD,
                minPrice: 800,
                maxPrice: 3000,
            },
            {
                field: 'Design',
                innerField: 'UX Design',
                deliverableType: 'User Research & Wireframes',
                depth: DepthLevel.STANDARD,
                minPrice: 1000,
                maxPrice: 3500,
            },
            {
                field: 'Design',
                innerField: 'Graphic Design',
                deliverableType: 'Brand Identity',
                depth: DepthLevel.COMPREHENSIVE,
                minPrice: 1500,
                maxPrice: 5000,
            },

            // CONTENT WRITING
            {
                field: 'Content Writing',
                innerField: 'Blog Writing',
                deliverableType: 'Blog Posts',
                depth: DepthLevel.STANDARD,
                minPrice: 200,
                maxPrice: 800,
            },
            {
                field: 'Content Writing',
                innerField: 'Technical Writing',
                deliverableType: 'Documentation',
                depth: DepthLevel.STANDARD,
                minPrice: 500,
                maxPrice: 2000,
            },
            {
                field: 'Content Writing',
                innerField: 'Copywriting',
                deliverableType: 'Marketing Copy',
                depth: DepthLevel.STANDARD,
                minPrice: 300,
                maxPrice: 1500,
            },

            // MOBILE DEVELOPMENT
            {
                field: 'Mobile Development',
                innerField: 'iOS Development',
                deliverableType: 'Mobile App',
                depth: DepthLevel.COMPREHENSIVE,
                minPrice: 4000,
                maxPrice: 15000,
            },
            {
                field: 'Mobile Development',
                innerField: 'Android Development',
                deliverableType: 'Mobile App',
                depth: DepthLevel.COMPREHENSIVE,
                minPrice: 4000,
                maxPrice: 15000,
            },

            // MARKETING
            {
                field: 'Marketing',
                innerField: 'SEO',
                deliverableType: 'SEO Optimization',
                depth: DepthLevel.STANDARD,
                minPrice: 800,
                maxPrice: 3000,
            },
            {
                field: 'Marketing',
                innerField: 'Social Media Marketing',
                deliverableType: 'Campaign Management',
                depth: DepthLevel.STANDARD,
                minPrice: 600,
                maxPrice: 2500,
            },
        ];

        for (const rule of pricingRules) {
            await PricingRule.create({
                ...rule,
                currency: 'USD',
                isActive: true,
                createdBy: admin._id,
                lastUpdated: new Date(),
                auditLog: [{
                    action: 'SEEDED',
                    changedBy: admin._id,
                    timestamp: new Date(),
                    oldValues: null,
                    newValues: { minPrice: rule.minPrice, maxPrice: rule.maxPrice },
                }],
            });
        }

        console.log(`✓ Created ${pricingRules.length} pricing rules`);

        // ==================== DIFFICULTY MODIFIERS ====================

        const difficultyModifiers = [
            // DEADLINE URGENCY
            {
                modifierType: ModifierType.DEADLINE,
                level: 'NORMAL',
                percentageImpact: 0,
                maxCap: 30,
                description: 'Normal deadline (>4 weeks)',
            },
            {
                modifierType: ModifierType.DEADLINE,
                level: 'MODERATE',
                percentageImpact: 10,
                maxCap: 30,
                description: 'Moderate urgency (2-4 weeks)',
            },
            {
                modifierType: ModifierType.DEADLINE,
                level: 'URGENT',
                percentageImpact: 20,
                maxCap: 30,
                description: 'Urgent deadline (1-2 weeks)',
            },
            {
                modifierType: ModifierType.DEADLINE,
                level: 'RUSH',
                percentageImpact: 30,
                maxCap: 30,
                description: 'Rush delivery (<1 week)',
            },

            // COMPLEXITY LEVEL
            {
                modifierType: ModifierType.COMPLEXITY,
                level: 'SIMPLE',
                percentageImpact: -5,
                maxCap: 25,
                description: 'Simple project with few deliverables',
            },
            {
                modifierType: ModifierType.COMPLEXITY,
                level: 'STANDARD',
                percentageImpact: 0,
                maxCap: 25,
                description: 'Standard complexity project',
            },
            {
                modifierType: ModifierType.COMPLEXITY,
                level: 'COMPLEX',
                percentageImpact: 15,
                maxCap: 25,
                description: 'Complex project with many deliverables',
            },
            {
                modifierType: ModifierType.COMPLEXITY,
                level: 'VERY_COMPLEX',
                percentageImpact: 25,
                maxCap: 25,
                description: 'Very complex project with extensive requirements',
            },

            // REQUIREMENT AMBIGUITY
            {
                modifierType: ModifierType.AMBIGUITY,
                level: 'CLEAR',
                percentageImpact: 0,
                maxCap: 10,
                description: 'Clear and detailed requirements',
            },
            {
                modifierType: ModifierType.AMBIGUITY,
                level: 'MODERATE',
                percentageImpact: 5,
                maxCap: 10,
                description: 'Moderately clear requirements',
            },
            {
                modifierType: ModifierType.AMBIGUITY,
                level: 'VAGUE',
                percentageImpact: 10,
                maxCap: 10,
                description: 'Vague or exploratory requirements',
            },

            // INDUSTRY RISK
            {
                modifierType: ModifierType.INDUSTRY,
                level: 'STANDARD',
                percentageImpact: 0,
                maxCap: 15,
                description: 'Standard industry',
            },
            {
                modifierType: ModifierType.INDUSTRY,
                level: 'REGULATED',
                percentageImpact: 15,
                maxCap: 15,
                description: 'Regulated industry (Healthcare, Finance, etc.)',
            },

            // USAGE CRITICALITY
            {
                modifierType: ModifierType.CRITICALITY,
                level: 'INTERNAL',
                percentageImpact: -5,
                maxCap: 10,
                description: 'Internal/testing use',
            },
            {
                modifierType: ModifierType.CRITICALITY,
                level: 'PRODUCTION',
                percentageImpact: 0,
                maxCap: 10,
                description: 'Production/public use',
            },
            {
                modifierType: ModifierType.CRITICALITY,
                level: 'MISSION_CRITICAL',
                percentageImpact: 10,
                maxCap: 10,
                description: 'Mission-critical system',
            },
        ];

        for (const modifier of difficultyModifiers) {
            await DifficultyModifier.create({
                ...modifier,
                isActive: true,
            });
        }

        console.log(`✓ Created ${difficultyModifiers.length} difficulty modifiers`);
        console.log('✅ Pricing data seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding pricing data:', error);
    }
};
