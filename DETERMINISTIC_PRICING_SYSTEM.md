# Deterministic Pricing System

## Overview

A rule-based pricing engine that **prices WORK, not people**. The system outputs **LOW / MEDIUM / HIGH** tiers for each project based on deterministic calculations.

**Key Principles:**
- No human sets per-project prices
- No AI "guesses" money
- Rules decide
- Fair to clients and freelancers
- Auditable and scalable

## Architecture

### Core Components

1. **Base Rates Configuration** (`server/src/config/baseRates.ts`)
   - 10 core fields with ₹/EU (Effort Unit) rates
   - Global caps: min ₹2,000 | max ₹50,00,000
   - Price tier multipliers: LOW (0.85), MEDIUM (1.00), HIGH (1.20)
   - Rounding: nearest ₹50

2. **Work Unit Mappings** (`server/src/config/workUnitMappings.ts`)
   - Maps scope items to Effort Units (EU)
   - Field-specific mappings for all 10 core fields
   - 1 EU = 1 person-day (8 productive hours, mid-level)

3. **Difficulty Multipliers** (`server/src/config/difficultyMultipliers.ts`)
   - Objective multipliers based on project characteristics
   - Factors: Clarity, Urgency, Risk/Compliance, Integrations, Ambiguity
   - Total MP cap = 1.5

4. **Deterministic Pricing Engine** (`server/src/utils/deterministicPricingEngine.ts`)
   - Implements EU/WU/TWU/MP/EI/BPV calculation logic
   - Parses SOW → Work Units
   - Calculates price tiers
   - Applies global caps

5. **Models**
   - `DeterministicPricing` - Stores pricing calculations
   - `PricingAudit` - Audit trail for all pricing actions

## Calculation Flow

### Step-by-Step Process

1. **Parse SOW → Extract Work Units (WU) by field**
   - Analyze `inScopeItems` and `deliverables`
   - Map each item to EU using work unit mappings

2. **Calculate TWU per field**
   - TWU_field = Σ(WU_field)

3. **Calculate Multiplier Product (MP)**
   - Infer difficulty factors from scope and intent answers
   - Apply multipliers (cap at 1.5)

4. **Calculate Effort Index (EI) per field**
   - EI_field = TWU_field × MP

5. **Calculate Base Project Value (BPV)**
   - BPV = Σ(EI_field × BaseRate_field)

6. **Calculate Price Tiers**
   - LOW = BPV × 0.85 (rounded to ₹50)
   - MEDIUM = BPV × 1.00 (rounded to ₹50)
   - HIGH = BPV × 1.20 (rounded to ₹50)

7. **Apply Global Caps**
   - Enforce min ₹2,000 and max ₹50,00,000

8. **Create Audit Log**
   - Store all calculations and reasoning

## API Endpoints

### Client/Admin Endpoints

#### `POST /pricing/estimate`
Calculate pricing estimate for a scope.

**Request:**
```json
{
  "scopeId": "scope_id_here",
  "projectId": "project_id_here" // optional
}
```

**Response:**
```json
{
  "tiers": {
    "low": 8500,
    "medium": 10000,
    "high": 12000
  },
  "breakdown": {
    "scopeSize": "Medium scope",
    "complexityDrivers": ["Standard complexity"],
    "recommended": "MEDIUM"
  },
  "calculationId": "pricing_id_here"
}
```

#### `GET /pricing/estimate/:scopeId`
Get existing pricing estimate.

### Freelancer Endpoints

#### `GET /pricing/estimate/:scopeId/badge/:badgeLevel`
Get price matching freelancer's badge level (LOW/MEDIUM/HIGH).

**Response:**
```json
{
  "price": 10000,
  "currency": "INR",
  "badgeLevel": "MEDIUM",
  "breakdown": {
    "scopeSize": "Medium scope",
    "complexityDrivers": ["Standard complexity"]
  }
}
```

### Admin Configuration Endpoints

#### `GET /pricing/config/base-rates`
View current base rates configuration.

#### `PATCH /pricing/config/base-rates/:field`
Update base rate for a field (quarterly tuning).

**Request:**
```json
{
  "baseRatePerEU": 12500,
  "reasoning": "Market rate adjustment Q1 2024"
}
```

#### `GET /pricing/config/multipliers`
View difficulty multipliers configuration.

#### `GET /pricing/config/global`
View global caps and tier multipliers.

#### `PATCH /pricing/config/global/caps`
Update global min/max caps.

**Request:**
```json
{
  "min": 2500,
  "max": 6000000,
  "reasoning": "Market adjustment"
}
```

## The 10 Core Fields

1. **UI/UX Design** → ₹12,000/EU
2. **Web Frontend / WordPress** → ₹10,000/EU
3. **Backend / Full-Stack** → ₹14,000/EU
4. **Mobile App Development** → ₹15,000/EU
5. **Graphic Design / Branding** → ₹4,000/EU
6. **Motion / Video / Advanced Visuals** → ₹12,000/EU
7. **Content Writing & Strategy** → ₹4,000/EU
8. **Digital Marketing (SEO/Ads/Social)** → ₹6,000/EU
9. **Data / Automation / Integrations** → ₹16,000/EU
10. **QA / Testing / Optimization** → ₹6,000/EU

## Work Unit Examples

### UI/UX Design
- Screen: basic 0.5 EU | standard 0.75 EU | complex 1.5 EU
- User research: light 1 EU | deep 3 EU
- Design system: core 3 EU | full 6 EU

### Web Frontend
- Page: basic 0.5 EU | standard 0.75 EU | complex 1.5 EU
- Custom section/animation: 0.75 EU
- CPT + admin UI: 2 EU
- Integration: 2 EU each

### Backend / Full-Stack
- Simple API: 0.5 EU | complex API: 1.5 EU
- Auth/roles: 2 EU
- Data model per module: 2 EU
- Payment/CRM: 2-3 EU

## Difficulty Multipliers

| Factor | Levels | Multiplier |
|--------|--------|------------|
| Clarity | clear / medium / low | 0.95 / 1.00 / 1.10 |
| Urgency | flexible / balanced / urgent | 1.00 / 1.05 / 1.20 |
| Risk/Compliance | normal / regulated | 1.00 / 1.15 |
| Integrations | none / one / multiple | 1.00 / 1.10 / 1.30 (cap) |
| Ambiguity | none / some | 1.00 / 1.10 |

**Total MP cap = 1.5**

## Display Rules

### Client View
- Sees LOW/MEDIUM/HIGH with 2-3 bullets:
  - Scope size (TWU → EI)
  - Major complexity drivers
  - "Recommended: MEDIUM (professional)"

### Freelancer View
- Sees only the price matching their badge level
- No access to other tiers

## Hard Rules

- ✅ No bidding
- ✅ No negotiation
- ✅ No per-job overrides
- ✅ Only scope change → price change
- ✅ All calculations logged (auditId)

## Testing

Unit tests are defined in `server/src/utils/deterministicPricingEngine.test.ts`:

1. **Small Project (Content-Only)** - Tests small scope handling
2. **Mixed Scope Project** - Tests multiple fields
3. **Urgent Project** - Tests urgency multiplier
4. **Regulated Industry Project** - Tests compliance multiplier
5. **Content-Only Project (Detailed)** - Tests content field mappings

## Files Created/Modified

### New Files
- `server/src/config/baseRates.ts` - Base rates configuration
- `server/src/config/workUnitMappings.ts` - Work unit mappings
- `server/src/config/difficultyMultipliers.ts` - Difficulty multipliers
- `server/src/utils/deterministicPricingEngine.ts` - Main pricing engine
- `server/src/models/DeterministicPricing.ts` - Pricing model
- `server/src/utils/deterministicPricingEngine.test.ts` - Unit tests

### Modified Files
- `server/src/routes/pricing.ts` - Added new endpoints

## Usage Example

```typescript
import { calculateDeterministicPrice } from './utils/deterministicPricingEngine.js';

const estimate = await calculateDeterministicPrice({
    scopeId: 'scope_id',
    projectId: 'project_id', // optional
    userId: 'user_id',
});

console.log('LOW:', estimate.finalLow);
console.log('MEDIUM:', estimate.finalMedium);
console.log('HIGH:', estimate.finalHigh);
```

## Next Steps

1. **Database Migration**: Run migration to create `DeterministicPricing` collection
2. **Testing**: Set up test framework and run unit tests
3. **Integration**: Integrate with frontend to display pricing tiers
4. **Monitoring**: Set up monitoring for pricing calculations
5. **Quarterly Review**: Admin reviews and adjusts base rates quarterly

## Notes

- All prices are in INR (₹)
- Calculations are deterministic and repeatable
- Full audit trail for all pricing decisions
- Admin can tune base rates quarterly
- Global caps prevent extreme pricing
