export interface FieldConfig {
    name: string;
    subFields: string[];
}

export const FIELDS: Record<string, string[]> = {
    'UI/UX Design': [
        'UX Research',
        'UX Strategy',
        'UX Writing',
        'Wireframing',
        'Prototyping',
        'Interaction Design',
        'User Testing',
        'Information Architecture',
    ],
    'Graphic Design': [
        'Brand Identity',
        'Logo Design',
        'Print Design',
        'Illustration',
        'Typography',
        'Packaging Design',
        'Motion Graphics',
    ],
    'Web Development': [
        'Frontend Development',
        'Backend Development',
        'Full Stack Development',
        'WordPress Development',
        'E-commerce Development',
        'Web Performance Optimization',
    ],
    'Mobile App Development': [
        'iOS Development',
        'Android Development',
        'React Native',
        'Flutter',
        'Cross-Platform Development',
        'Mobile UI/UX',
    ],
    'Digital Marketing': [
        'SEO (Search Engine Optimization)',
        'SEM (Search Engine Marketing)',
        'Social Media Marketing',
        'Email Marketing',
        'Content Marketing',
        'Marketing Analytics',
    ],
    'Content Writing': [
        'Blog Writing',
        'Copywriting',
        'Technical Writing',
        'SEO Writing',
        'Creative Writing',
        'Ghostwriting',
    ],
    'Video Production': [
        'Video Editing',
        'Motion Graphics',
        'Animation',
        'Color Grading',
        'Sound Design',
        'Scriptwriting',
    ],
    'Data Science': [
        'Data Analysis',
        'Machine Learning',
        'Data Visualization',
        'Statistical Modeling',
        'Big Data',
        'Python/R Programming',
    ],
    'Business Consulting': [
        'Strategy Consulting',
        'Business Analysis',
        'Market Research',
        'Financial Planning',
        'Operations Management',
        'Project Management',
    ],
    '3D Design & Animation': [
        '3D Modeling',
        'Character Design',
        'Product Visualization',
        'Architectural Visualization',
        '3D Animation',
        'Texturing & Rendering',
        'VR/AR Design',
    ],
};

export const getFieldNames = (): string[] => {
    return Object.keys(FIELDS);
};

export const getSubFields = (field: string): string[] => {
    return FIELDS[field] || [];
};

export const isValidField = (field: string): boolean => {
    return field in FIELDS;
};

export const isValidSubField = (field: string, subField: string): boolean => {
    const subFields = FIELDS[field];
    return subFields ? subFields.includes(subField) : false;
};
