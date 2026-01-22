# Deterministic Pricing System - Complete Walkthrough

## 🎯 Overview

This document provides a complete walkthrough of where all pricing system changes are reflected and how the entire journey works from client project creation to freelancer pricing display.

---

## 📍 Where Changes Are Reflected

### 1. **Backend Configuration Files**

#### `server/src/config/baseRates.ts`
- **Purpose**: Defines base rates (₹/EU) for all 10 core fields
- **Used By**: Pricing engine during BPV calculation
- **Admin Access**: Can be updated via `PATCH /pricing/config/base-rates/:field`
- **Impact**: Changes affect all future pricing calculations

#### `server/src/config/workUnitMappings.ts`
- **Purpose**: Maps scope items to Effort Units (EU)
- **Used By**: Pricing engine to parse SOW → Work Units
- **Admin Access**: Code-based (requires deployment to change)
- **Impact**: Determines how scope items are quantified

#### `server/src/config/difficultyMultipliers.ts`
- **Purpose**: Defines difficulty multipliers and inference logic
- **Used By**: Pricing engine to calculate MP (Multiplier Product)
- **Admin Access**: View via `GET /pricing/config/multipliers`
- **Impact**: Affects complexity adjustments

### 2. **Backend Core Engine**

#### `server/src/utils/deterministicPricingEngine.ts`
- **Purpose**: Main pricing calculation logic
- **Used By**: API routes when calculating prices
- **Key Functions**:
  - `calculateDeterministicPrice()` - Main calculation
  - `getPriceForBadge()` - Get price for specific badge level
- **Impact**: All pricing calculations flow through here

### 3. **Database Models**

#### `server/src/models/DeterministicPricing.ts`
- **Purpose**: Stores pricing calculations in MongoDB
- **Collection**: `deterministicpricings`
- **Fields**: Work units, field aggregations, tiers, breakdown, audit ID
- **Used By**: API routes to store/retrieve pricing data

#### `server/src/models/PricingAudit.ts` (Existing)
- **Purpose**: Audit trail for all pricing actions
- **Collection**: `pricingaudits`
- **Used By**: Pricing engine to log all calculations

### 4. **API Routes**

#### `server/src/routes/pricing.ts`
- **New Endpoints Added**:
  - `POST /pricing/estimate` - Calculate pricing
  - `GET /pricing/estimate/:scopeId` - Get existing estimate
  - `GET /pricing/estimate/:scopeId/badge/:badgeLevel` - Get badge-specific price
  - `GET /pricing/config/base-rates` - View base rates (admin)
  - `PATCH /pricing/config/base-rates/:field` - Update base rate (admin)
  - `GET /pricing/config/multipliers` - View multipliers (admin)
  - `GET /pricing/config/global` - View global config (admin)
  - `PATCH /pricing/config/global/caps` - Update caps (admin)

---

## 🔄 Complete Journey Walkthrough

### **Phase 1: Client Creates Project & Scope**

#### Step 1.1: Client Fills Project Intent
**Location**: `client/app/client/projects/create/page.tsx` (or similar)

**What Happens**:
- Client provides:
  - Field selection (e.g., "Web Development")
  - Goal of work
  - Usage context
  - Priority (SPEED/QUALITY/DEPTH)
  - Deadline
- Scope is created via `POST /scopes` (existing endpoint)
- Scope stored in MongoDB with `intentAnswers`

**Data Stored**:
```javascript
{
  field: "Web Development",
  intentAnswers: {
    goalOfWork: "Build e-commerce website",
    usageContext: "Online retail store",
    priority: "QUALITY",
    deadline: "2024-02-15"
  },
  inScopeItems: [...],
  deliverables: [...]
}
```

---

### **Phase 2: Pricing Calculation Triggered**

#### Step 2.1: Client Requests Pricing Estimate
**Location**: Frontend calls `POST /pricing/estimate`

**API Call**:
```javascript
POST /api/pricing/estimate
{
  "scopeId": "507f1f77bcf86cd799439011",
  "projectId": "507f191e810c19729de860ea" // optional
}
```

**Backend Flow** (`server/src/routes/pricing.ts`):
1. Authenticates user (must be CLIENT or ADMIN)
2. Calls `calculateDeterministicPrice()` from `deterministicPricingEngine.ts`

#### Step 2.2: Pricing Engine Calculation
**Location**: `server/src/utils/deterministicPricingEngine.ts`

**Step-by-Step Process**:

1. **Load Scope** (Line ~310)
   ```typescript
   const scope = await Scope.findById(params.scopeId);
   ```

2. **Parse SOW → Work Units** (Line ~315)
   - Calls `parseSOWToWorkUnits(scope)`
   - For each `inScopeItem` and `deliverable`:
     - Calls `getWorkUnitEU(field, itemDescription)` from `workUnitMappings.ts`
     - Maps item to Effort Units (EU)
   - **Example**: "Build 5 pages (standard)" → 5 × 0.75 EU = 3.75 EU

3. **Calculate TWU per Field** (Line ~320)
   - Sums EU values by field
   - **Example**: Web Development field = 3.75 EU

4. **Infer Difficulty Factors** (Line ~325)
   - Calls `inferDifficultyFactors(scope)` from `difficultyMultipliers.ts`
   - Analyzes:
     - **Clarity**: Based on scope detail (clear/medium/low)
     - **Urgency**: Based on deadline (<7 days = urgent)
     - **Risk/Compliance**: Based on usage context (healthcare/finance = regulated)
     - **Integrations**: Counts integration keywords
     - **Ambiguity**: Checks for content/assets mentions
   - **Example**: `{ clarity: 'medium', urgency: 'balanced', risk_compliance: 'normal', integrations: 'one', ambiguity: 'none' }`

5. **Calculate Multiplier Product (MP)** (Line ~326)
   - Calls `calculateMultiplierProduct(difficultyFactors)`
   - Multiplies all factors: 1.00 × 1.05 × 1.00 × 1.10 × 1.00 = 1.155
   - Caps at 1.5

6. **Calculate Effort Index (EI) per Field** (Line ~335)
   - EI = TWU × MP
   - **Example**: 3.75 × 1.155 = 4.33 EI

7. **Calculate Base Project Value (BPV)** (Line ~340)
   - For each field: BPV += EI × BaseRate
   - Gets base rate from `baseRates.ts`: Web Frontend = ₹10,000/EU
   - **Example**: 4.33 × ₹10,000 = ₹43,300

8. **Calculate Price Tiers** (Line ~345)
   - LOW = BPV × 0.85 = ₹36,805 → rounded to ₹36,800
   - MEDIUM = BPV × 1.00 = ₹43,300 → rounded to ₹43,300
   - HIGH = BPV × 1.20 = ₹51,960 → rounded to ₹52,000

9. **Apply Global Caps** (Line ~350)
   - Enforces min ₹2,000 and max ₹50,00,000
   - **Example**: All tiers within caps, no adjustment needed

10. **Generate Breakdown** (Line ~353)
    - Creates human-readable description
    - Identifies complexity drivers
    - Sets recommended tier (default: MEDIUM)

11. **Create Audit Log** (Line ~356)
    - Saves to `PricingAudit` collection
    - Records all calculations and reasoning

12. **Save to Database** (Line ~365)
    - Creates `DeterministicPricing` document
    - Stores all calculation details

#### Step 2.3: API Response
**Location**: `server/src/routes/pricing.ts` (Line ~440)

**Response to Client**:
```json
{
  "tiers": {
    "low": 36800,
    "medium": 43300,
    "high": 52000
  },
  "breakdown": {
    "scopeSize": "Medium scope",
    "complexityDrivers": ["Standard complexity"],
    "recommended": "MEDIUM"
  },
  "calculationId": "507f1f77bcf86cd799439012"
}
```

**Response to Admin** (includes details):
```json
{
  "tiers": { ... },
  "breakdown": { ... },
  "calculationId": "...",
  "details": {
    "twu": 3.75,
    "mp": 1.155,
    "bpv": 43300,
    "fieldBreakdown": [
      {
        "field": "Web Frontend / WordPress",
        "twu": 3.75,
        "ei": 4.33,
        "value": 43300
      }
    ],
    "difficultyFactors": { ... }
  }
}
```

---

### **Phase 3: Client Views Pricing**

#### Step 3.1: Frontend Displays Pricing Tiers
**Location**: `client/app/client/projects/[projectId]/page.tsx` (or similar)

**What Client Sees**:
```
Project Pricing

LOW:    ₹36,800
MEDIUM: ₹43,300  ← Recommended (professional)
HIGH:   ₹52,000

Scope: Medium scope
Complexity: Standard complexity

[Accept MEDIUM] [Modify Scope] [Cancel]
```

**API Call** (if needed):
```javascript
GET /api/pricing/estimate/:scopeId
```

---

### **Phase 4: Freelancer Views Invitation**

#### Step 4.1: Freelancer Receives Invitation
**Location**: `client/app/freelancer/invitations/page.tsx`

**What Happens**:
- Freelancer has badge level (LOW/MEDIUM/HIGH)
- System fetches pricing for their badge only

#### Step 4.2: API Call for Badge-Specific Price
**Location**: `server/src/routes/pricing.ts` (Line ~520)

**API Call**:
```javascript
GET /api/pricing/estimate/:scopeId/badge/MEDIUM
```

**Backend Flow**:
1. Loads `DeterministicPricing` document
2. Calls `getPriceForBadge(estimate, 'MEDIUM')`
3. Returns only the MEDIUM tier price

**Response**:
```json
{
  "price": 43300,
  "currency": "INR",
  "badgeLevel": "MEDIUM",
  "breakdown": {
    "scopeSize": "Medium scope",
    "complexityDrivers": ["Standard complexity"]
  }
}
```

#### Step 4.3: Frontend Displays to Freelancer
**Location**: `client/app/freelancer/invitations/page.tsx`

**What Freelancer Sees**:
```
Project Invitation

Scope: Build e-commerce website
Price: ₹43,300

This price reflects your MEDIUM badge level, project complexity, 
and platform fair pricing standards.

[Accept] [Decline]
```

**Key Point**: Freelancer only sees their badge price, not all tiers.

---

### **Phase 5: Admin Configuration**

#### Step 5.1: Admin Views Current Configuration
**Location**: Admin dashboard (to be created)

**API Calls**:
```javascript
GET /api/pricing/config/base-rates
GET /api/pricing/config/multipliers
GET /api/pricing/config/global
```

**Response Examples**:

**Base Rates**:
```json
{
  "baseRates": {
    "UI/UX Design": 12000,
    "Web Frontend / WordPress": 10000,
    "Backend / Full-Stack": 14000,
    ...
  },
  "currency": "INR",
  "unit": "per Effort Unit (EU)"
}
```

**Global Config**:
```json
{
  "caps": {
    "min": 2000,
    "max": 5000000
  },
  "priceTiers": {
    "LOW": 0.85,
    "MEDIUM": 1.00,
    "HIGH": 1.20
  },
  "roundingIncrement": 50
}
```

#### Step 5.2: Admin Updates Base Rate (Quarterly)
**Location**: Admin configuration panel

**API Call**:
```javascript
PATCH /api/pricing/config/base-rates/Web%20Frontend%20%2F%20WordPress
{
  "baseRatePerEU": 10500,
  "reasoning": "Market rate adjustment Q1 2024 - increased demand"
}
```

**Backend Flow** (`server/src/routes/pricing.ts` Line ~620):
1. Validates request (must be ADMIN)
2. Updates `BASE_RATES` object in memory
3. Creates audit log entry
4. **Note**: Changes take effect immediately for new calculations

**Impact**:
- ✅ New pricing calculations use updated rate
- ❌ Existing pricing remains unchanged (locked)
- ✅ All changes audited

#### Step 5.3: Admin Updates Global Caps
**API Call**:
```javascript
PATCH /api/pricing/config/global/caps
{
  "min": 2500,
  "max": 6000000,
  "reasoning": "Market expansion - higher value projects"
}
```

**Impact**:
- ✅ All new calculations respect new caps
- ❌ Existing pricing unchanged

---

## 🔍 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT CREATES SCOPE                     │
│  Frontend → POST /scopes → MongoDB (scopes collection)     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT REQUESTS PRICING ESTIMATE               │
│  Frontend → POST /pricing/estimate                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              DETERMINISTIC PRICING ENGINE                   │
│                                                              │
│  1. Load Scope (MongoDB)                                    │
│  2. Parse SOW → Work Units (workUnitMappings.ts)            │
│  3. Calculate TWU per field                                 │
│  4. Infer Difficulty Factors (difficultyMultipliers.ts)    │
│  5. Calculate MP (capped at 1.5)                           │
│  6. Calculate EI = TWU × MP                                │
│  7. Calculate BPV = Σ(EI × BaseRate) (baseRates.ts)        │
│  8. Calculate Tiers: LOW/MEDIUM/HIGH                        │
│  9. Apply Global Caps                                       │
│  10. Generate Breakdown                                     │
│  11. Create Audit Log (PricingAudit collection)            │
│  12. Save Pricing (DeterministicPricing collection)        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API RESPONSE                              │
│  Returns: tiers, breakdown, calculationId                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  CLIENT VIEW     │          │ FREELANCER VIEW  │
│  All 3 tiers     │          │ Badge price only │
│  Recommended     │          │ GET /estimate/   │
│  displayed       │          │   :scopeId/      │
│                  │          │   badge/:level   │
└──────────────────┘          └──────────────────┘
```

---

## 📊 Database Collections

### `deterministicpricings`
**Schema**:
```javascript
{
  _id: ObjectId,
  projectId: ObjectId (optional),
  scopeId: ObjectId (required),
  workUnits: [
    {
      field: "Web Frontend / WordPress",
      itemDescription: "Build 5 pages",
      euValue: 3.75
    }
  ],
  fieldAggregations: [
    {
      field: "Web Frontend / WordPress",
      twu: 3.75,
      mp: 1.155,
      ei: 4.33,
      baseRate: 10000,
      fieldValue: 43300
    }
  ],
  twu: 3.75,
  mp: 1.155,
  bpv: 43300,
  low: 36800,
  medium: 43300,
  high: 52000,
  finalLow: 36800,
  finalMedium: 43300,
  finalHigh: 52000,
  breakdown: {
    scopeSize: "Medium scope",
    complexityDrivers: ["Standard complexity"],
    recommended: "MEDIUM"
  },
  calculationDetails: { ... },
  auditId: ObjectId,
  status: "CALCULATED",
  calculatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### `pricingaudits`
**Schema** (existing, enhanced):
```javascript
{
  _id: ObjectId,
  action: "PRICE_CALCULATED",
  performedBy: ObjectId,
  userRole: "SYSTEM",
  entityType: "PROJECT_PRICING",
  entityId: ObjectId,
  changes: {
    calculation: {
      workUnits: [...],
      fieldAggregations: [...],
      twu: 3.75,
      mp: 1.155,
      bpv: 43300,
      tiers: { low, medium, high },
      finalTiers: { low, medium, high },
      difficultyFactors: { ... },
      appliedCaps: { ... }
    }
  },
  timestamp: Date
}
```

---

## 🎨 Frontend Integration Points

### Where to Add Pricing Display

#### 1. **Client Project Creation Flow**
**File**: `client/app/client/projects/create/page.tsx`

**Add After Scope Creation**:
```typescript
// After scope is created
const response = await fetch('/api/pricing/estimate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scopeId: createdScope._id })
});

const pricing = await response.json();

// Display tiers
setPricingTiers(pricing.tiers);
setRecommended(pricing.breakdown.recommended);
```

#### 2. **Client Project View**
**File**: `client/app/client/projects/[projectId]/page.tsx`

**Display Pricing**:
```typescript
useEffect(() => {
  fetch(`/api/pricing/estimate/${scopeId}`)
    .then(res => res.json())
    .then(data => {
      setPricing(data.tiers);
      setBreakdown(data.breakdown);
    });
}, [scopeId]);
```

#### 3. **Freelancer Invitation View**
**File**: `client/app/freelancer/invitations/page.tsx`

**Display Badge Price**:
```typescript
const fetchPrice = async (scopeId: string, badgeLevel: string) => {
  const response = await fetch(
    `/api/pricing/estimate/${scopeId}/badge/${badgeLevel}`
  );
  const data = await response.json();
  return data.price; // Only their badge price
};
```

#### 4. **Admin Configuration Panel** (New)
**File**: `client/app/admin/pricing/page.tsx` (to be created)

**Display & Edit Configuration**:
```typescript
// View base rates
const baseRates = await fetch('/api/pricing/config/base-rates');

// Update base rate
await fetch(`/api/pricing/config/base-rates/${encodeURIComponent(field)}`, {
  method: 'PATCH',
  body: JSON.stringify({
    baseRatePerEU: newRate,
    reasoning: 'Market adjustment'
  })
});
```

---

## 🔐 Security & Access Control

### Endpoint Access

| Endpoint | Client | Freelancer | Admin |
|----------|--------|------------|-------|
| `POST /pricing/estimate` | ✅ | ❌ | ✅ |
| `GET /pricing/estimate/:scopeId` | ✅ | ❌ | ✅ |
| `GET /pricing/estimate/:scopeId/badge/:level` | ❌ | ✅ | ✅ |
| `GET /pricing/config/*` | ❌ | ❌ | ✅ |
| `PATCH /pricing/config/*` | ❌ | ❌ | ✅ |

### Data Visibility

- **Clients**: See all 3 tiers (LOW/MEDIUM/HIGH)
- **Freelancers**: See only their badge price
- **Admins**: See all tiers + detailed breakdown + configuration

---

## 📝 Key Files Summary

### Backend Files Created/Modified

1. **Configuration**:
   - `server/src/config/baseRates.ts` ✨ NEW
   - `server/src/config/workUnitMappings.ts` ✨ NEW
   - `server/src/config/difficultyMultipliers.ts` ✨ NEW

2. **Engine**:
   - `server/src/utils/deterministicPricingEngine.ts` ✨ NEW
   - `server/src/utils/deterministicPricingEngine.test.ts` ✨ NEW

3. **Models**:
   - `server/src/models/DeterministicPricing.ts` ✨ NEW
   - `server/src/models/PricingAudit.ts` (existing, used)

4. **Routes**:
   - `server/src/routes/pricing.ts` ✏️ MODIFIED (added new endpoints)

### Frontend Integration Needed

1. **Client Side**:
   - `client/app/client/projects/create/page.tsx` - Add pricing display
   - `client/app/client/projects/[projectId]/page.tsx` - Show pricing tiers

2. **Freelancer Side**:
   - `client/app/freelancer/invitations/page.tsx` - Show badge price

3. **Admin Side**:
   - `client/app/admin/pricing/page.tsx` - ✨ NEW (configuration panel)

---

## 🚀 Next Steps for Full Integration

1. **Frontend Integration**:
   - Add pricing display to client project creation flow
   - Add pricing display to project view pages
   - Add badge-specific pricing to freelancer invitations
   - Create admin pricing configuration panel

2. **Testing**:
   - Set up test database
   - Run unit tests from `deterministicPricingEngine.test.ts`
   - Test API endpoints with Postman/Thunder Client
   - Test edge cases (very small/large projects, urgent deadlines, etc.)

3. **Monitoring**:
   - Add logging for pricing calculations
   - Monitor pricing distribution
   - Track acceptance rates by tier

4. **Documentation**:
   - Update API documentation
   - Create admin guide for configuration
   - Document pricing rules for support team

---

## ✅ Summary

**All changes are reflected in**:
- ✅ Backend configuration files (base rates, work units, multipliers)
- ✅ Pricing calculation engine
- ✅ Database models (DeterministicPricing, PricingAudit)
- ✅ API routes (new endpoints for pricing and admin config)
- ⏳ Frontend (needs integration - see Next Steps)

**The journey flows**:
1. Client creates scope → Stored in MongoDB
2. Pricing calculated → Uses deterministic engine → Stored in DeterministicPricing
3. Client sees all tiers → Via GET /pricing/estimate
4. Freelancer sees badge price → Via GET /pricing/estimate/:scopeId/badge/:level
5. Admin manages config → Via /pricing/config/* endpoints

**Everything is audited** → All calculations logged in PricingAudit collection.
