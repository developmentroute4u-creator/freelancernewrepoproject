// Intent questions configuration for scope generation
// These questions are asked to clients before generating scope

export interface IntentQuestion {
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'select' | 'date' | 'multiselect';
    required: boolean;
    options?: string[];
    placeholder?: string;
    helpText?: string;
}

export const INTENT_QUESTIONS: IntentQuestion[] = [
    {
        id: 'goalOfWork',
        question: 'What is the primary goal of this project?',
        type: 'textarea',
        required: true,
        placeholder: 'E.g., Create a modern e-commerce website to sell handmade products online...',
        helpText: 'Describe what you want to achieve with this project. Be as specific as possible.'
    },
    {
        id: 'usageContext',
        question: 'How will this work be used?',
        type: 'textarea',
        required: true,
        placeholder: 'E.g., The website will be used by customers to browse products, add to cart, and checkout...',
        helpText: 'Explain the context and how the deliverables will be utilized.'
    },
    {
        id: 'priority',
        question: 'What is your priority for this project?',
        type: 'select',
        required: true,
        options: ['SPEED', 'QUALITY', 'DEPTH'],
        helpText: 'SPEED: Fast delivery with good quality | QUALITY: High quality, take necessary time | DEPTH: Comprehensive and thorough work'
    },
    {
        id: 'deadline',
        question: 'When do you need this completed?',
        type: 'date',
        required: true,
        helpText: 'Select a realistic deadline. This will help determine the scope and feasibility.'
    },
    {
        id: 'references',
        question: 'Do you have any reference materials or examples? (Optional)',
        type: 'textarea',
        required: false,
        placeholder: 'Paste URLs or describe reference materials...',
        helpText: 'Share any websites, designs, or examples that inspire you or show what you want.'
    },
    {
        id: 'targetAudience',
        question: 'Who is the target audience?',
        type: 'textarea',
        required: true,
        placeholder: 'E.g., Young professionals aged 25-35 who value sustainability...',
        helpText: 'Describe who will use or benefit from this work.'
    },
    {
        id: 'existingAssets',
        question: 'What existing assets do you have? (Optional)',
        type: 'textarea',
        required: false,
        placeholder: 'E.g., Brand logo, color palette, content, images...',
        helpText: 'List any materials you already have that can be used in the project.'
    },
    {
        id: 'specificRequirements',
        question: 'Are there any specific requirements or must-haves?',
        type: 'textarea',
        required: false,
        placeholder: 'E.g., Must be mobile-responsive, must support payment gateway, must include analytics...',
        helpText: 'List any non-negotiable requirements or features.'
    },
    {
        id: 'budget',
        question: 'What is your budget range? (Optional)',
        type: 'select',
        required: false,
        options: ['Under $500', '$500-$1,000', '$1,000-$2,500', '$2,500-$5,000', '$5,000-$10,000', '$10,000+'],
        helpText: 'This helps ensure the scope aligns with your budget expectations.'
    }
];

// Field-specific additional questions
export const FIELD_SPECIFIC_QUESTIONS: Record<string, IntentQuestion[]> = {
    'UI/UX Design': [
        {
            id: 'numberOfScreens',
            question: 'How many screens/pages do you need designed?',
            type: 'text',
            required: true,
            placeholder: 'E.g., 10-15 screens',
            helpText: 'Approximate number of unique screens or pages.'
        },
        {
            id: 'designStyle',
            question: 'What design style do you prefer?',
            type: 'select',
            required: false,
            options: ['Modern/Minimalist', 'Bold/Vibrant', 'Professional/Corporate', 'Playful/Creative', 'Luxury/Premium', 'Not sure'],
            helpText: 'This helps set the visual direction.'
        }
    ],
    'Web Development': [
        {
            id: 'platformPreference',
            question: 'Do you have a platform preference?',
            type: 'select',
            required: false,
            options: ['WordPress', 'Custom (React/Next.js)', 'Shopify', 'Wix/Squarespace', 'No preference'],
            helpText: 'Choose a platform or let the freelancer recommend.'
        },
        {
            id: 'features',
            question: 'What key features do you need?',
            type: 'multiselect',
            required: true,
            options: ['Contact Form', 'Blog', 'E-commerce', 'User Authentication', 'Search', 'Analytics', 'Payment Integration', 'Admin Dashboard'],
            helpText: 'Select all features you need.'
        }
    ],
    'Mobile App Development': [
        {
            id: 'platforms',
            question: 'Which platforms do you need?',
            type: 'multiselect',
            required: true,
            options: ['iOS', 'Android', 'Both'],
            helpText: 'Select target platforms.'
        },
        {
            id: 'appType',
            question: 'What type of app is this?',
            type: 'select',
            required: true,
            options: ['Social', 'E-commerce', 'Productivity', 'Entertainment', 'Education', 'Health & Fitness', 'Other'],
            helpText: 'App category helps determine features and design.'
        }
    ],
    'Graphic Design': [
        {
            id: 'brandingStatus',
            question: 'Do you have existing branding?',
            type: 'select',
            required: true,
            options: ['Yes, complete brand guidelines', 'Yes, but need updates', 'No, need new branding'],
            helpText: 'This affects the scope of design work.'
        },
        {
            id: 'deliverableFormats',
            question: 'What file formats do you need?',
            type: 'multiselect',
            required: true,
            options: ['AI/EPS (Vector)', 'PNG', 'JPG', 'PDF', 'SVG', 'Print-ready files'],
            helpText: 'Select all formats you need.'
        }
    ],
    'Digital Marketing': [
        {
            id: 'channels',
            question: 'Which marketing channels do you want to focus on?',
            type: 'multiselect',
            required: true,
            options: ['SEO', 'Social Media', 'Email Marketing', 'Content Marketing', 'PPC Advertising', 'Influencer Marketing'],
            helpText: 'Select all channels you want to include.'
        },
        {
            id: 'duration',
            question: 'What is the campaign duration?',
            type: 'select',
            required: true,
            options: ['1 month', '3 months', '6 months', '12 months', 'Ongoing'],
            helpText: 'Marketing campaigns typically run for extended periods.'
        }
    ],
    'Content Writing': [
        {
            id: 'contentType',
            question: 'What type of content do you need?',
            type: 'multiselect',
            required: true,
            options: ['Blog Posts', 'Website Copy', 'Product Descriptions', 'Social Media Content', 'Email Newsletters', 'Technical Documentation'],
            helpText: 'Select all content types needed.'
        },
        {
            id: 'wordCount',
            question: 'Approximate total word count needed?',
            type: 'text',
            required: false,
            placeholder: 'E.g., 5,000 words',
            helpText: 'Helps estimate scope and pricing.'
        }
    ],
    'Video Production': [
        {
            id: 'videoLength',
            question: 'What is the desired video length?',
            type: 'select',
            required: true,
            options: ['Under 1 minute', '1-3 minutes', '3-5 minutes', '5-10 minutes', '10+ minutes'],
            helpText: 'Video length significantly affects production time.'
        },
        {
            id: 'videoType',
            question: 'What type of video do you need?',
            type: 'select',
            required: true,
            options: ['Promotional', 'Explainer', 'Tutorial', 'Product Demo', 'Social Media', 'Documentary', 'Animation'],
            helpText: 'Video type determines production approach.'
        }
    ],
    'Data Science': [
        {
            id: 'dataSource',
            question: 'Where is your data coming from?',
            type: 'textarea',
            required: true,
            placeholder: 'E.g., CSV files, database, API, web scraping...',
            helpText: 'Describe your data sources.'
        },
        {
            id: 'analysisGoal',
            question: 'What do you want to learn from the data?',
            type: 'textarea',
            required: true,
            placeholder: 'E.g., Predict customer churn, identify trends, optimize pricing...',
            helpText: 'Specific analysis goals help define deliverables.'
        }
    ],
    'Business Consulting': [
        {
            id: 'businessStage',
            question: 'What stage is your business in?',
            type: 'select',
            required: true,
            options: ['Idea/Pre-launch', 'Startup (0-2 years)', 'Growth (2-5 years)', 'Established (5+ years)'],
            helpText: 'Business stage affects consulting approach.'
        },
        {
            id: 'consultingFocus',
            question: 'What area do you need help with?',
            type: 'multiselect',
            required: true,
            options: ['Strategy', 'Operations', 'Finance', 'Marketing', 'Sales', 'HR', 'Technology'],
            helpText: 'Select all areas you need consulting on.'
        }
    ],
    '3D Design & Animation': [
        {
            id: 'outputFormat',
            question: 'What will the 3D work be used for?',
            type: 'select',
            required: true,
            options: ['Product Visualization', 'Architectural Rendering', 'Game Assets', 'Animation/Film', 'VR/AR', 'Print/Marketing'],
            helpText: 'Usage determines technical requirements.'
        },
        {
            id: 'complexity',
            question: 'How complex is the 3D work?',
            type: 'select',
            required: true,
            options: ['Simple (basic shapes)', 'Moderate (detailed objects)', 'Complex (characters, environments)', 'Very Complex (photorealistic)'],
            helpText: 'Complexity affects timeline and pricing.'
        }
    ]
};
