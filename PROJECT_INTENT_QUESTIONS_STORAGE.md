   # Project Intent Questions - Storage and Flow

## Quick Answer

**Project Intent Questions are stored in:**
- **Configuration File**: `server/src/config/intentQuestions.ts`
- **Database (Answers)**: Stored in the `Scope` model under `intentAnswers` field

---

## 1. Question Definitions (Configuration)

### Location: `server/src/config/intentQuestions.ts`

This file contains all the intent questions that are asked to clients before creating a project scope.

### Structure

```typescript
export interface IntentQuestion {
    id: string;                  // Unique identifier
    question: string;            // Question text
    type: 'text' | 'textarea' | 'select' | 'date' | 'multiselect';
    required: boolean;           // Is this question mandatory?
    options?: string[];          // For select/multiselect types
    placeholder?: string;        // Placeholder text
    helpText?: string;          // Help text shown to user
}
```

### Universal Questions (Asked to ALL clients)

These 9 questions are asked regardless of the project field:

1. **goalOfWork** (textarea, required)
   - "What is the primary goal of this project?"
   
2. **usageContext** (textarea, required)
   - "How will this work be used?"
   
3. **priority** (select, required)
   - Options: SPEED, QUALITY, DEPTH
   
4. **deadline** (date, required)
   - "When do you need this completed?"
   
5. **references** (textarea, optional)
   - "Do you have any reference materials or examples?"
   
6. **targetAudience** (textarea, required)
   - "Who is the target audience?"
   
7. **existingAssets** (textarea, optional)
   - "What existing assets do you have?"
   
8. **specificRequirements** (textarea, optional)
   - "Are there any specific requirements or must-haves?"
   
9. **budget** (select, optional)
   - Options: Under $500, $500-$1,000, etc.

### Field-Specific Questions

Additional questions based on the selected field:

#### UI/UX Design
- Number of screens/pages
- Design style preference

#### Web Development
- Platform preference (WordPress, React, etc.)
- Key features needed

#### Mobile App Development
- Platforms (iOS, Android, Both)
- App type

#### Graphic Design
- Branding status
- Deliverable formats

#### Digital Marketing
- Marketing channels
- Campaign duration

#### Content Writing
- Content type
- Word count

#### Video Production
- Video length
- Video type

#### Data Science
- Data source
- Analysis goal

#### Business Consulting
- Business stage
- Consulting focus

#### 3D Design & Animation
- Output format
- Complexity level

---

## 2. Answer Storage (Database)

### Location: `server/src/models/Scope.ts`

Client's answers to intent questions are stored in the **Scope** model.

### Database Schema

```typescript
export interface IIntentAnswers {
  goalOfWork: string;           // Primary goal
  usageContext: string;         // How it will be used
  priority: 'SPEED' | 'QUALITY' | 'DEPTH';
  references?: string[];        // Optional references
  deadline: Date;               // Project deadline
}

export interface IScope extends Document {
  projectId?: Types.ObjectId;
  field: string;
  innerFields: string[];
  intentAnswers: IIntentAnswers;  // ← Answers stored here
  // ... other scope fields
}
```

### MongoDB Collection

- **Collection Name**: `scopes`
- **Field**: `intentAnswers` (embedded document)

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "field": "Web Development",
  "innerFields": ["E-commerce", "Payment Integration"],
  "intentAnswers": {
    "goalOfWork": "Create a modern e-commerce website to sell handmade products",
    "usageContext": "Customers will browse products, add to cart, and checkout",
    "priority": "QUALITY",
    "deadline": "2026-03-15T00:00:00.000Z",
    "references": ["https://example.com/inspiration"],
    "targetAudience": "Young professionals aged 25-35",
    "existingAssets": "Brand logo and color palette",
    "specificRequirements": "Must be mobile-responsive and support Stripe",
    "budget": "$2,500-$5,000"
  },
  "projectOverview": "...",
  "inScopeItems": [...],
  "outOfScopeItems": [...],
  // ... other fields
}
```

---

## 3. How It Works (Flow)

### Step 1: Client Starts Project Creation

**Frontend**: Client fills out a form with intent questions

**Questions Source**: 
- Universal questions from `INTENT_QUESTIONS` array
- Field-specific questions from `FIELD_SPECIFIC_QUESTIONS[field]`

### Step 2: Client Submits Answers

**API Endpoint**: `POST /api/scopes/generate`

**Request Body**:
```json
{
  "field": "Web Development",
  "innerFields": ["E-commerce", "Payment Integration"],
  "intentAnswers": {
    "goalOfWork": "Create e-commerce website...",
    "usageContext": "Customers will browse and buy...",
    "priority": "QUALITY",
    "deadline": "2026-03-15",
    "references": ["https://example.com"],
    "targetAudience": "Young professionals...",
    "existingAssets": "Logo and colors",
    "specificRequirements": "Mobile-responsive, Stripe",
    "budget": "$2,500-$5,000"
  }
}
```

### Step 3: System Generates Scope

**Location**: `server/src/routes/scopes.ts`

**Process**:
1. Validate intent answers
2. Use Gemini AI to generate scope based on answers
3. Create Scope document in database
4. Return generated scope to client

**Code**:
```typescript
// server/src/routes/scopes.ts
router.post('/generate', async (req, res) => {
  const { field, innerFields, intentAnswers } = req.body;
  
  // Validate intent answers
  if (!intentAnswers || !intentAnswers.goalOfWork || !intentAnswers.usageContext) {
    return res.status(400).json({ 
      error: 'Please provide complete intent answers' 
    });
  }
  
  // Generate scope using Gemini AI
  const generatedScope = await generateScope({
    field,
    innerFields,
    intentAnswers,
  });
  
  // Save to database
  const scope = await Scope.create({
    field,
    innerFields,
    intentAnswers,  // ← Answers stored here
    ...generatedScope
  });
  
  res.json(scope);
});
```

### Step 4: Scope Used Throughout Project

The `intentAnswers` are used for:

1. **Pricing Calculation** (`server/src/utils/pricingEngine.ts`)
   - Deadline affects urgency multiplier
   - Priority affects quality multiplier

2. **Scope Generation** (`server/src/utils/gemini.ts`)
   - AI uses answers to generate detailed scope
   - Creates project overview, deliverables, timeline

3. **Project Documentation**
   - Stored permanently with the scope
   - Reference for both client and freelancer

---

## 4. API Endpoints

### Get Intent Questions Configuration

**Endpoint**: Not currently exposed via API
**Access**: Questions are hardcoded in `intentQuestions.ts`
**Usage**: Frontend should import or fetch these questions

**Recommended**: Create an endpoint to fetch questions:
```typescript
// GET /api/config/intent-questions
router.get('/intent-questions', (req, res) => {
  const { field } = req.query;
  
  const questions = [...INTENT_QUESTIONS];
  
  if (field && FIELD_SPECIFIC_QUESTIONS[field]) {
    questions.push(...FIELD_SPECIFIC_QUESTIONS[field]);
  }
  
  res.json(questions);
});
```

### Generate Scope with Intent Answers

**Endpoint**: `POST /api/scopes/generate`
**Auth**: Required (Client role)
**Body**:
```json
{
  "field": "string",
  "innerFields": ["string"],
  "intentAnswers": {
    "goalOfWork": "string",
    "usageContext": "string",
    "priority": "SPEED | QUALITY | DEPTH",
    "deadline": "date",
    "references": ["string"],
    // ... other answers
  }
}
```

### Get Scope (with Intent Answers)

**Endpoint**: `GET /api/scopes/:scopeId`
**Auth**: Required
**Response**: Includes `intentAnswers` field

---

## 5. Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `intentQuestions.ts` | Question definitions | `server/src/config/intentQuestions.ts` |
| `Scope.ts` | Database model | `server/src/models/Scope.ts` |
| `scopes.ts` | API routes | `server/src/routes/scopes.ts` |
| `gemini.ts` | Scope generation | `server/src/utils/gemini.ts` |
| `pricingEngine.ts` | Uses intent for pricing | `server/src/utils/pricingEngine.ts` |

---

## 6. Database Queries

### Find Scopes by Priority

```javascript
const qualityScopes = await Scope.find({
  'intentAnswers.priority': 'QUALITY'
});
```

### Find Scopes by Deadline Range

```javascript
const urgentScopes = await Scope.find({
  'intentAnswers.deadline': {
    $lte: new Date('2026-02-01')
  }
});
```

### Find Scopes by Goal (Text Search)

```javascript
const ecommerceScopes = await Scope.find({
  'intentAnswers.goalOfWork': {
    $regex: 'e-commerce',
    $options: 'i'
  }
});
```

---

## Summary

### Question Definitions
- **Stored**: `server/src/config/intentQuestions.ts`
- **Type**: TypeScript configuration file
- **Contains**: Universal + Field-specific questions

### Client Answers
- **Stored**: MongoDB `scopes` collection
- **Field**: `intentAnswers` (embedded document)
- **Model**: `server/src/models/Scope.ts`

### Flow
1. Client sees questions from `intentQuestions.ts`
2. Client fills out answers
3. Answers sent to `POST /api/scopes/generate`
4. Answers stored in `Scope.intentAnswers`
5. AI generates scope based on answers
6. Answers used for pricing and project management

### Access
- **Questions**: Import from `intentQuestions.ts`
- **Answers**: Query `Scope` model, access `intentAnswers` field
