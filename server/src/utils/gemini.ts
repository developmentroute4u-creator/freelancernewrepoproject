import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables first
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️  WARNING: GEMINI_API_KEY is not set in environment variables. Test generation will use fallback.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export interface TestGenerationParams {
  field: string;
  innerFields: string[];
  testLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface GeneratedTest {
  title: string;
  description: string;
  instructions: string;
}

export const generateSkillTest = async (
  params: TestGenerationParams
): Promise<GeneratedTest> => {
  // Check if API key is available
  if (!genAI || !GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not configured. Using fallback test.');
    return {
      title: `${params.field} - ${params.testLevel} Level Assignment`,
      description: `A practical assignment to assess your ${params.testLevel.toLowerCase()} level skills in ${params.field} with focus on ${params.innerFields.join(', ')}. Please configure GEMINI_API_KEY in your .env file to generate dynamic tests.`,
      instructions: `🔹 Task Requirements\\nComplete the assignment based on your ${params.testLevel.toLowerCase()} level skills in ${params.field}.\\n\\n🔹 Deliverables\\nSubmit your work as a ZIP file or GitHub repository link.\\n\\n🔹 Submission Instructions\\nSubmit via ZIP file or GitHub repository link. Optionally include a live website or demo video.`,
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    // Determine complexity based on level
    const complexityMap = {
      LOW: {
        scope: 'focused, single-feature task',
        depth: 'basic execution, fundamentals',
        duration: '2-4 hours',
        decisionMaking: 'minimal, follow clear guidelines',
        deliverables: 'simple, well-defined outputs',
        calibration: `🟢 LOW LEVEL - Keep it Simple & Achievable:
- This is for beginners or those with basic skills
- Task should be straightforward and clearly defined
- Focus on fundamental skills only
- Should feel achievable and NOT overwhelming
- Avoid complex requirements or advanced techniques
- Use encouraging, supportive language
- Example: "Create a simple landing page" NOT "Build a full e-commerce platform"`
      },
      MEDIUM: {
        scope: 'realistic client project component',
        depth: 'structured thinking, best practices',
        duration: '4-8 hours',
        decisionMaking: 'some choices required, justify approach',
        deliverables: 'professional quality with documentation',
        calibration: `🟡 MEDIUM LEVEL - Balanced Challenge:
- This is for intermediate freelancers with some experience
- Task should require structured thinking and best practices
- Include realistic project constraints
- Should feel challenging but achievable
- Require some decision-making and justification
- Example: "Design a mobile app feature with user flow" NOT "Design an entire app ecosystem"`
      },
      HIGH: {
        scope: 'complex, open-ended problem',
        depth: 'strategic thinking, trade-offs, optimization',
        duration: '8-16 hours',
        decisionMaking: 'significant choices, justify all decisions',
        deliverables: 'production-ready with comprehensive documentation',
        calibration: `🔴 HIGH LEVEL - Professional Standards:
- This is for experienced professionals
- Task should require strategic thinking and trade-offs
- Include industry-standard checklists and requirements
- Should demonstrate production-ready capabilities
- Require comprehensive documentation and justification
- Must include: accessibility standards, performance considerations, scalability, best practices
- Example: "Design a complete design system with documentation" or "Build a scalable API with testing"`
      }
    };

    const complexity = complexityMap[params.testLevel];

    const prompt = `You are a Senior Hiring Manager + Domain Expert creating a real-world skill assessment task for freelancers.

This is NOT an exam.
This is NOT a theory test.
This is a company-style practical assignment used to evaluate whether a freelancer is fit for real client work.

Do NOT write generic descriptions like:
- "This test evaluates your skills…"
- "Follow the instructions carefully…"

Instead, write a clear problem statement exactly like a task a company would assign.

CONTEXT:
Field: ${params.field}
Inner Fields / Specializations: ${params.innerFields.join(', ')}
Test Level: ${params.testLevel}
Duration: ${complexity.duration}

The output must feel like: "A real task given by a company to check if this freelancer can actually do the job."

CRITICAL: DIFFICULTY CALIBRATION
The task MUST be appropriately challenging for the ${params.testLevel} level:

${complexity.calibration}

IMPORTANT: Prevent Freelancer Drop-offs
- Make the task feel DOABLE within the time frame (${complexity.duration})
- Use encouraging language that builds confidence
- Clearly state what is IN scope and OUT of scope
- Don't make it feel like an impossible challenge
- The goal is to assess skills, not to discourage freelancers

OUTPUT FORMAT (STRICT JSON):
Return ONLY valid JSON with this exact structure:
{
  "title": "A clear, role-based title (e.g., 'Design a Mobile App Onboarding Flow for a Fintech Startup')",
  "description": "PROBLEM STATEMENT - A complete real-world scenario (300-500 words) including: who the company is (fictional but realistic), what they are building, what problem they are facing, why they are hiring this freelancer, what outcome they expect. This should feel like 'Here is the task we are assigning you as a freelancer.' Make it practical, realistic, detailed enough to work independently, clearly reflect ${params.field} & ${params.innerFields.join(', ')}, and match ${params.testLevel} level complexity. Use encouraging tone.",
  "instructions": "TASK REQUIREMENTS + DELIVERABLES + SUBMISSION - Format as follows:\\n\\n🔹 Task Requirements\\n[List exactly what needs to be done in bullet points. Include: scope of work, depth expected (${complexity.depth}), constraints (time: ${complexity.duration}, assumptions, limitations), what NOT to do. ${params.testLevel === 'HIGH' ? 'Include industry-standard checklist items (accessibility, performance, security, scalability, documentation).' : ''} This should clearly define 'What work is expected from you.' Make it feel achievable.]\\n\\n🔹 Deliverables\\n[Clearly list: what files need to be submitted, acceptable formats, naming conventions (if any), whether documentation is required, whether explanation/rationale is required. Examples: Figma link, ZIP file with source files, GitHub repository, PDF explaining decisions. This removes ambiguity.]\\n\\n🔹 Submission Instructions\\n[Only include: how to submit (ZIP / GitHub), optional links (live/demo). Keep this short and practical. Add a brief encouraging note like 'We're excited to see your work!' No generic motivation text.]"
}

LEVEL DIFFERENTIATION:
- LOW: ${complexity.scope}, ${complexity.depth}, ${complexity.decisionMaking}, ${complexity.deliverables}
- MEDIUM: ${complexity.scope}, ${complexity.depth}, ${complexity.decisionMaking}, ${complexity.deliverables}
- HIGH: ${complexity.scope}, ${complexity.depth}, ${complexity.decisionMaking}, ${complexity.deliverables}

IMPORTANT CONSTRAINTS:
❌ Do NOT include generic test descriptions
❌ Do NOT include "this test evaluates…" language
❌ Do NOT include academic tone
❌ Do NOT include MCQs
❌ Do NOT make the task overwhelming or discouraging
✅ Treat this as a paid company task
✅ Use professional, clear, human language
✅ Make it feel like real client work
✅ Use encouraging, confidence-building language
✅ Make it feel achievable within the time frame

FINAL INSTRUCTION:
If a real hiring manager read this task, they should say: "Yes, if someone completes this well, they are ready for real projects."
If a freelancer reads this task, they should think: "This is challenging but I can do this!"

Generate the test now. Return ONLY the JSON object, no markdown, no code blocks, no explanations:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, '');
    cleanedText = cleanedText.replace(/^```\s*/i, '');
    cleanedText = cleanedText.replace(/\s*```$/i, '');
    cleanedText = cleanedText.trim();

    // Parse JSON from response
    try {
      // First try to parse the entire text
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Initial JSON parse failed, trying regex match...', parseError);
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            title: parsed.title || `${params.field} - ${params.testLevel} Level Assignment`,
            description: parsed.description || `A practical assignment to assess your ${params.testLevel.toLowerCase()} level skills in ${params.field}.`,
            instructions: parsed.instructions || `Complete the task requirements and submit your deliverables.`,
          };
        } catch (innerError) {
          console.error('Failed to parse JSON match:', jsonMatch[0]);
          throw innerError;
        }
      }
      console.error('No JSON block found in response:', cleanedText);
      throw new Error('Failed to parse Gemini response: No valid JSON found');
    }

    throw new Error('Failed to parse Gemini response');
  } catch (error: any) {
    console.error('Gemini API error:', error);

    // Check if it's an authentication error
    if (error.status === 403 || error.message?.includes('API Key') || error.message?.includes('unregistered callers')) {
      console.error('❌ Gemini API authentication failed. Please check your GEMINI_API_KEY in .env file.');
      return {
        title: `${params.field} - ${params.testLevel} Level Assignment`,
        description: `A practical assignment to assess your ${params.testLevel.toLowerCase()} level skills in ${params.field} with focus on ${params.innerFields.join(', ')}. Note: Gemini API is not properly configured. Please set a valid GEMINI_API_KEY in your .env file.`,
        instructions: `🔹 Task Requirements\\nComplete the assignment based on your ${params.testLevel.toLowerCase()} level skills in ${params.field}.\\n\\n🔹 Deliverables\\nSubmit your work as a ZIP file or GitHub repository link.\\n\\n🔹 Submission Instructions\\nSubmit via ZIP file or GitHub repository link. Optionally include a live website or demo video.`,
      };
    }

    // Fallback test for other errors
    return {
      title: `${params.field} - ${params.testLevel} Level Assignment`,
      description: `A practical assignment to assess your ${params.testLevel.toLowerCase()} level skills in ${params.field} with focus on ${params.innerFields.join(', ')}.`,
      instructions: `🔹 Task Requirements\\nComplete the assignment based on your ${params.testLevel.toLowerCase()} level skills in ${params.field}.\\n\\n🔹 Deliverables\\nSubmit your work as a ZIP file or GitHub repository link.\\n\\n🔹 Submission Instructions\\nSubmit via ZIP file or GitHub repository link. Optionally include a live website or demo video.`,
    };
  }
};

export interface ScopeGenerationParams {
  field: string;
  innerFields: string[];
  intentAnswers: {
    goalOfWork: string;
    usageContext: string;
    priority: 'SPEED' | 'QUALITY' | 'DEPTH';
    references?: string[];
    deadline: Date;
  };
}

export interface GeneratedScope {
  // Professional SOW Structure - New Format
  projectTitle: string;
  projectOverview: string;
  inScopeStructure: string[];
  detailedScopeBreakdown: {
    designScope?: string[];
    developmentScope?: string[];
    technicalScope?: string[];
    advancedElements?: string[];
    [key: string]: string[] | undefined;
  };
  functionalScope: {
    included: string[];
    excluded: string[];
  };
  nonFunctionalRequirements: string[];
  assumptions: {
    technical: string[];
    nonTechnical: string[];
  };
  outOfScopeItems: string[];
  deliverables: string[];
  projectPhases: Array<{
    phase: string;
    activities: string[];
    duration: string;
  }>;
  totalEstimatedTimeline: string;
  // Legacy format fields (for backward compatibility)
  inScopeItems: string[];
  timeline: string[];
  acceptanceCriteria: string[];
  inclusions: string[];
  exclusions: string[];
  completionCriteria: string[];
  revisionLimits: number;
}

export const generateScope = async (
  params: ScopeGenerationParams
): Promise<GeneratedScope> => {
  // Check if API key is available
  if (!genAI || !GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not configured. Using fallback scope.');
    const inScopeItems = [
      'Complete project implementation per stated goals',
      'All deliverables in industry-standard formats',
      'Project documentation and specifications',
      'Basic knowledge transfer session',
      'Quality assurance and testing'
    ];
    const outOfScopeItems = [
      'Hosting and domain services',
      'Third-party license costs',
      'Content creation (copywriting, photography)',
      'Post-launch maintenance beyond handover',
      'Ongoing support beyond project completion'
    ];
    const acceptanceCriteria = ['All deliverables completed', 'Client approval obtained'];

    return {
      projectTitle: `${params.field.toUpperCase()} PROJECT: ${params.intentAnswers.goalOfWork}`,
      projectOverview: `${params.field} project: ${params.intentAnswers.goalOfWork}. This project focuses on ${params.innerFields.join(', ')} and will be delivered by ${new Date(params.intentAnswers.deadline).toLocaleDateString()}.`,
      inScopeStructure: inScopeItems,
      detailedScopeBreakdown: {},
      functionalScope: {
        included: inScopeItems,
        excluded: outOfScopeItems,
      },
      nonFunctionalRequirements: [
        'Performance standards as per industry best practices',
        'Basic security measures',
        'Code maintainability standards'
      ],
      assumptions: {
        technical: [
          'Client will provide necessary assets and access',
          'Third-party services will be available and compatible'
        ],
        nonTechnical: [
          'Client will provide timely feedback within agreed timelines',
          'Client will assign a single point of contact for approvals'
        ],
      },
      outOfScopeItems: outOfScopeItems,
      deliverables: [`${params.field} project deliverables in agreed formats`],
      projectPhases: [
        {
          phase: 'Planning & Requirements',
          activities: ['Requirements gathering', 'Project setup'],
          duration: '1-2 weeks'
        },
        {
          phase: 'Implementation',
          activities: ['Core development/design work', 'Quality assurance'],
          duration: 'Varies based on scope'
        },
        {
          phase: 'Review & Handover',
          activities: ['Client review', 'Revisions', 'Final delivery'],
          duration: '1-2 weeks'
        }
      ],
      totalEstimatedTimeline: `Project completion by ${new Date(params.intentAnswers.deadline).toLocaleDateString()}`,
      inScopeItems: inScopeItems,
      timeline: [`Project completion by ${new Date(params.intentAnswers.deadline).toLocaleDateString()}`],
      acceptanceCriteria: acceptanceCriteria,
      inclusions: inScopeItems,
      exclusions: outOfScopeItems,
      completionCriteria: acceptanceCriteria,
      revisionLimits: 3,
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `ROLE

You are a Senior Project Manager + Technical Consultant.

Your job is to generate a formal, professional Statement of Work (SOW) for a client project.

This scope will later be:
- legally enforceable on the platform
- used for pricing
- used for accountability & dispute resolution

So it must be detailed, structured, and explicit.

ABSOLUTE CONSTRAINTS (DO NOT BREAK)

Scope MUST follow the SOW structure shown below
Scope MUST be derived ONLY from:
- client intent answers
- selected field & inner fields
Scope MUST NOT include anything the client did not imply
Scope MUST explicitly list INCLUDED and EXCLUDED items
Scope MUST be readable by a non-technical client
Scope MUST feel like it was written by a consulting firm, not AI

❌ No generic AI language
❌ No vague wording
❌ No missing sections

INPUTS YOU WILL RECEIVE

You will be provided with:
- Client answers to intent questions
- Selected Field (e.g., Design, Development, Marketing)
- Selected Inner Fields (e.g., UI/UX, CMS, SEO)
- Reference SOW documents (uploaded files)

Use the REFERENCE SOW documents only for structure, depth, and tone.
Do NOT copy text.

PROJECT CONTEXT:
- **Field**: ${params.field}
- **Inner Fields**: ${params.innerFields.join(', ')}
- **Goal of Work**: ${params.intentAnswers.goalOfWork}
- **Usage Context**: ${params.intentAnswers.usageContext}
- **Priority**: ${params.intentAnswers.priority} (${params.intentAnswers.priority === 'SPEED' ? 'Fast delivery with good quality' : params.intentAnswers.priority === 'QUALITY' ? 'High quality, take necessary time' : 'Comprehensive and thorough work'})
- **Deadline**: ${new Date(params.intentAnswers.deadline).toLocaleDateString()}
${params.intentAnswers.references && params.intentAnswers.references.length > 0 ? `- **References**: ${params.intentAnswers.references.join(', ')}` : ''}

REQUIRED OUTPUT STRUCTURE (STRICT)

You MUST generate the scope using the following sections IN THIS ORDER:

1. PROJECT TITLE

A clear, professional project title based on client intent.

Example: "COMPLETE WEBSITE REDESIGN & REDEVELOPMENT"

2. PROJECT OVERVIEW

A short but meaningful paragraph explaining:
- who the client is (generic description if unknown)
- what they are trying to achieve
- why this project exists
- what outcome they expect

This must reflect:
- client goal: "${params.intentAnswers.goalOfWork}"
- usage: "${params.intentAnswers.usageContext}"
- priority: ${params.intentAnswers.priority}

3. IN-SCOPE STRUCTURE / COMPONENTS

List all major sections, modules, or components included.

Examples (vary by field):
- Website pages
- App modules
- Design systems
- Marketing assets
- Functional features

Use bullet points. (8-15 items)

4. DETAILED SCOPE BREAKDOWN

This section MUST be subdivided logically based on the field.

4.1 Design Scope (if applicable)
Include:
- UI/UX approach
- wireframes / high-fidelity designs
- branding alignment
- responsiveness

4.2 Development / Technical Scope (if applicable)
Include:
- tech stack
- CMS or backend logic
- integrations
- performance expectations

4.3 Advanced / Visual / Functional Elements (if applicable)
Include:
- animations
- interactions
- automation
- special features implied by client intent

Generate subsections based on what applies to Field: ${params.field} and Inner Fields: ${params.innerFields.join(', ')}.

5. FUNCTIONAL SCOPE
Included
Explicitly list everything that IS included. (12-18 items)

Excluded
Explicitly list everything that is NOT included. (10-15 items)

This section is mandatory.

6. NON-FUNCTIONAL REQUIREMENTS

Include:
- performance expectations
- scalability
- security
- maintainability
- compliance (if implied)

(8-12 items)

7. ASSUMPTIONS
Technical Assumptions
(e.g., hosting, APIs, tools)
(6-10 items)

Non-Technical Assumptions
(e.g., approvals, content readiness, single point of contact)
(4-8 items)

8. OUT-OF-SCOPE ITEMS

Clearly list:
- features
- services
- integrations
that are not part of this engagement

This protects both client and freelancer. (10-15 items)

9. DELIVERABLES

List clear, tangible outputs, such as:
- final designs
- source files
- deployed product
- documentation
- handover/training

Each must specify format, quantity, and delivery method. (10-18 items)

10. PROJECT PHASES & TIMELINE

Create a phase-wise breakdown, similar to:
| Phase | Activities | Duration |

Timeline must be:
- realistic
- aligned with scope depth
- expressed in working days or weeks

Generate 5-8 phases that align with deadline: ${new Date(params.intentAnswers.deadline).toLocaleDateString()}

11. TOTAL ESTIMATED TIMELINE

Provide a final summary:
- total duration
- expressed as a range
- with a short disclaimer that it is approximate

REVISION LIMITS:
Calculate based on project complexity and priority:
- ${params.intentAnswers.priority === 'SPEED' ? 'SPEED priority: 2-3 revision rounds' : params.intentAnswers.priority === 'QUALITY' ? 'QUALITY priority: 3-4 revision rounds' : 'DEPTH priority: 4-5 revision rounds'}
- Each revision round includes: client feedback, implementation, and resubmission

LANGUAGE & STYLE RULES

Professional
Clear
Consulting-style
No emojis
No marketing fluff
No AI disclaimers

FINAL VALIDATION CHECK (MANDATORY)

Before outputting, internally check:
✔ All sections present
✔ Included vs excluded clearly defined
✔ Timeline matches scope size
✔ No generic AI language
✔ No missing assumptions

If any section is weak → regenerate internally before output.

Return the response in JSON format:
{
  "projectTitle": "Clear professional project title",
  "projectOverview": "Detailed paragraph (300-400 words) explaining who, what, why, expected outcome",
  "inScopeStructure": ["Major component 1", "Major component 2", ...],
  "detailedScopeBreakdown": {
    "designScope": ["Design item 1", "Design item 2", ...] (if applicable),
    "developmentScope": ["Dev item 1", "Dev item 2", ...] (if applicable),
    "technicalScope": ["Tech item 1", "Tech item 2", ...] (if applicable),
    "advancedElements": ["Advanced item 1", "Advanced item 2", ...] (if applicable)
  },
  "functionalScope": {
    "included": ["Functional included item 1", "Functional included item 2", ...],
    "excluded": ["Functional excluded item 1", "Functional excluded item 2", ...]
  },
  "nonFunctionalRequirements": ["Performance requirement 1", "Security requirement 1", ...],
  "assumptions": {
    "technical": ["Technical assumption 1", "Technical assumption 2", ...],
    "nonTechnical": ["Non-technical assumption 1", "Non-technical assumption 2", ...]
  },
  "outOfScopeItems": ["Out of scope item 1", "Out of scope item 2", ...],
  "deliverables": ["Deliverable 1 with format", "Deliverable 2 with format", ...],
  "projectPhases": [
    {
      "phase": "Phase 1 Name",
      "activities": ["Activity 1", "Activity 2", ...],
      "duration": "X weeks or Y working days"
    },
    ...
  ],
  "totalEstimatedTimeline": "Total duration range (e.g., '8-12 weeks' or '40-60 working days')",
  "revisionLimits": 3
}

IMPORTANT: Generate ONLY based on what the client implied in their intent answers. Do not add features or services they did not mention.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, '');
    cleanedText = cleanedText.replace(/^```\s*/i, '');
    cleanedText = cleanedText.replace(/\s*```$/i, '');
    cleanedText = cleanedText.trim();

    try {
      const parsed = JSON.parse(cleanedText);

      // Extract detailed scope breakdown sections
      const detailedScopeBreakdown: { [key: string]: string[] } = {};
      if (parsed.detailedScopeBreakdown) {
        if (parsed.detailedScopeBreakdown.designScope) {
          detailedScopeBreakdown.designScope = parsed.detailedScopeBreakdown.designScope;
        }
        if (parsed.detailedScopeBreakdown.developmentScope) {
          detailedScopeBreakdown.developmentScope = parsed.detailedScopeBreakdown.developmentScope;
        }
        if (parsed.detailedScopeBreakdown.technicalScope) {
          detailedScopeBreakdown.technicalScope = parsed.detailedScopeBreakdown.technicalScope;
        }
        if (parsed.detailedScopeBreakdown.advancedElements) {
          detailedScopeBreakdown.advancedElements = parsed.detailedScopeBreakdown.advancedElements;
        }
      }

      // Extract functional scope
      const functionalIncluded = parsed.functionalScope?.included || [];
      const functionalExcluded = parsed.functionalScope?.excluded || [];

      // Extract assumptions
      const technicalAssumptions = parsed.assumptions?.technical || [];
      const nonTechnicalAssumptions = parsed.assumptions?.nonTechnical || [];

      // Extract project phases and create timeline strings
      const projectPhases = parsed.projectPhases || [];
      const timelineStrings = projectPhases.map((phase: any) => {
        const activities = Array.isArray(phase.activities) ? phase.activities.join(', ') : '';
        return `${phase.phase}: ${phase.duration} - ${activities}`;
      });

      // Combine in-scope items from multiple sources for legacy format
      const inScopeItems = [
        ...(parsed.inScopeStructure || []),
        ...functionalIncluded,
        ...Object.values(detailedScopeBreakdown).flat()
      ];

      // Combine exclusions
      const outOfScopeItems = [
        ...(parsed.outOfScopeItems || []),
        ...functionalExcluded
      ];

      // Create acceptance criteria from deliverables
      const acceptanceCriteria = parsed.deliverables?.map((d: string) =>
        `Deliverable "${d}" completed and approved`
      ) || [];

      return {
        // New structure
        projectTitle: parsed.projectTitle || `${params.field.toUpperCase()} PROJECT: ${params.intentAnswers.goalOfWork}`,
        projectOverview: parsed.projectOverview || `${params.field} project for ${params.intentAnswers.goalOfWork}`,
        inScopeStructure: parsed.inScopeStructure || [],
        detailedScopeBreakdown: detailedScopeBreakdown,
        functionalScope: {
          included: functionalIncluded,
          excluded: functionalExcluded,
        },
        nonFunctionalRequirements: parsed.nonFunctionalRequirements || [],
        assumptions: {
          technical: technicalAssumptions,
          nonTechnical: nonTechnicalAssumptions,
        },
        outOfScopeItems: parsed.outOfScopeItems || [],
        deliverables: parsed.deliverables || [],
        projectPhases: projectPhases,
        totalEstimatedTimeline: parsed.totalEstimatedTimeline || 'Timeline to be determined',
        // Legacy fields for backward compatibility
        inScopeItems: inScopeItems.length > 0 ? inScopeItems : [parsed.inScopeStructure || []].flat(),
        timeline: timelineStrings.length > 0 ? timelineStrings : [`Project completion by ${new Date(params.intentAnswers.deadline).toLocaleDateString()}`],
        acceptanceCriteria: acceptanceCriteria.length > 0 ? acceptanceCriteria : ['All deliverables completed and approved'],
        inclusions: inScopeItems.length > 0 ? inScopeItems : [parsed.inScopeStructure || []].flat(),
        exclusions: outOfScopeItems,
        completionCriteria: acceptanceCriteria.length > 0 ? acceptanceCriteria : ['All deliverables completed and approved'],
        revisionLimits: parsed.revisionLimits || (params.intentAnswers.priority === 'SPEED' ? 2 : params.intentAnswers.priority === 'QUALITY' ? 3 : 4),
      };
    } catch (parseError: any) {
      console.error('Failed to parse Gemini response as JSON for scope:', parseError);
      throw parseError;
    }

    throw new Error('Failed to parse Gemini response');
  } catch (error: any) {
    console.error('Gemini API error:', error);

    // Check if it's an authentication error
    if (error.status === 403 || error.message?.includes('API Key') || error.message?.includes('unregistered callers')) {
      console.error('❌ Gemini API authentication failed. Please check your GEMINI_API_KEY in .env file.');
    }

    // Fallback scope
    const inScopeItems = [
      'Complete project implementation per stated goals',
      'All deliverables in industry-standard formats',
      'Project documentation and specifications',
      'Basic knowledge transfer session',
      'Quality assurance and testing'
    ];
    const outOfScopeItems = [
      'Hosting and domain services',
      'Third-party license costs',
      'Content creation (copywriting, photography)',
      'Post-launch maintenance beyond handover',
      'Ongoing support beyond project completion'
    ];
    const acceptanceCriteria = ['All deliverables completed', 'Client approval obtained'];

    return {
      projectTitle: `${params.field.toUpperCase()} PROJECT: ${params.intentAnswers.goalOfWork}`,
      projectOverview: `${params.field} project: ${params.intentAnswers.goalOfWork}. This project focuses on ${params.innerFields.join(', ')} and will be delivered by ${new Date(params.intentAnswers.deadline).toLocaleDateString()}.`,
      inScopeStructure: inScopeItems,
      detailedScopeBreakdown: {},
      functionalScope: {
        included: inScopeItems,
        excluded: outOfScopeItems,
      },
      nonFunctionalRequirements: [
        'Performance standards as per industry best practices',
        'Basic security measures',
        'Code maintainability standards'
      ],
      assumptions: {
        technical: [
          'Client will provide necessary assets and access',
          'Third-party services will be available and compatible'
        ],
        nonTechnical: [
          'Client will provide timely feedback within agreed timelines',
          'Client will assign a single point of contact for approvals'
        ],
      },
      outOfScopeItems: outOfScopeItems,
      deliverables: [`${params.field} project deliverables in agreed formats`],
      projectPhases: [
        {
          phase: 'Planning & Requirements',
          activities: ['Requirements gathering', 'Project setup'],
          duration: '1-2 weeks'
        },
        {
          phase: 'Implementation',
          activities: ['Core development/design work', 'Quality assurance'],
          duration: 'Varies based on scope'
        },
        {
          phase: 'Review & Handover',
          activities: ['Client review', 'Revisions', 'Final delivery'],
          duration: '1-2 weeks'
        }
      ],
      totalEstimatedTimeline: `Project completion by ${new Date(params.intentAnswers.deadline).toLocaleDateString()}`,
      inScopeItems: inScopeItems,
      timeline: [`Project completion by ${new Date(params.intentAnswers.deadline).toLocaleDateString()}`],
      acceptanceCriteria: acceptanceCriteria,
      inclusions: inScopeItems,
      exclusions: outOfScopeItems,
      completionCriteria: acceptanceCriteria,
      revisionLimits: 3,
    };
  }
};
