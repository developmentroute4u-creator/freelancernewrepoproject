# Freelancer Matching Criteria for Projects

## Current Implementation (BROKEN)

### Location

- **File**: `server/src/routes/freelancers.ts` (line 325-347)
- **Endpoint**: `GET /api/freelancers/by-project/:projectId`

### Current Matching Criteria

The system currently uses **ONLY 3 criteria** to find freelancers:

1. **Field Match** (BROKEN ❌)

   - **Query**: `field: scope.field`
   - **Problem**: Freelancer model doesn't have a `field` property
   - **Actual Property**: `education.field` (nested in education object)
   - **Result**: This query will NEVER match any freelancers, which is why you see no results

2. **Badge Level** (REQUIRED ✅)

   - **Query**: `badgeLevel: { $exists: true, $ne: null }`
   - **Meaning**: Freelancer must have completed a skill test and received a badge
   - **Values**: LOW, MEDIUM, or HIGH
   - **Status**: Working correctly

3. **Approval Status** (REQUIRED ✅)
   - **Query**: `status: FreelancerStatus.APPROVED`
   - **Meaning**: Freelancer profile must be approved by admin
   - **Status**: Working correctly

### Sorting

- Freelancers are sorted by badge level priority:
  - HIGH (priority 3) → MEDIUM (priority 2) → LOW (priority 1)

---

## Recommended Matching Criteria

### Primary Criteria (Must Match)

1. **Field Match** ✅

   - **Property**: `education.field`
   - **Match**: Must exactly match `scope.field` from project
   - **Example**: If project is "Design", freelancer's `education.field` must be "Design"

2. **Inner Fields Match** (Recommended)

   - **Property**: `education.innerFields` (array)
   - **Match**: Should have at least one matching inner field from `scope.innerFields`
   - **Example**: If project needs ["UI/UX", "Web Design"], freelancer should have at least one of these
   - **Priority**: Higher priority for freelancers with more matching inner fields

3. **Badge Level** ✅

   - **Property**: `badgeLevel`
   - **Requirement**: Must exist (LOW, MEDIUM, or HIGH)
   - **Purpose**: Ensures freelancer has passed skill assessment

4. **Approval Status** ✅
   - **Property**: `status`
   - **Requirement**: Must be `APPROVED`
   - **Purpose**: Only show verified freelancers

### Secondary Criteria (Scoring/Ranking)

5. **Badge Level Priority** (Sorting)

   - HIGH badge → Higher priority
   - MEDIUM badge → Medium priority
   - LOW badge → Lower priority

6. **Badge Score** (Sorting)

   - **Property**: `badgeScore`
   - **Purpose**: Within same badge level, sort by score
   - **Higher score** = Better performance on test

7. **Experience Level** (Optional Filter)

   - **Property**: `yearsOfExperience`
   - **Usage**: Could filter by minimum experience if needed
   - **Example**: Only show freelancers with 3+ years experience

8. **Inner Fields Match Count** (Scoring)
   - **Calculation**: Count how many `scope.innerFields` match `education.innerFields`
   - **Higher count** = Better match
   - **Example**: Project needs ["UI/UX", "Web Design", "Mobile Design"]
     - Freelancer A has all 3 → Score: 3
     - Freelancer B has 2 → Score: 2
     - Freelancer C has 1 → Score: 1

### Optional Criteria (Could Add)

9. **Location** (Optional Filter)

   - **Property**: `location`
   - **Usage**: Filter by geographic location if needed
   - **Note**: May not be relevant for remote work

10. **Availability** (Optional Filter)

    - **Property**: `availability`
    - **Values**: FULL_TIME, PART_TIME, CONTRACT_BASED, HOURLY_BASED
    - **Usage**: Match project requirements with freelancer availability

11. **Hourly Rate** (Optional Filter)

    - **Property**: `hourlyRate`
    - **Usage**: Filter by budget range if client specifies
    - **Note**: Currently set by admin, not freelancer

12. **Portfolio Quality** (Optional Scoring)
    - **Property**: `portfolioUrls` (array)
    - **Usage**: More portfolio items = potentially better match
    - **Scoring**: Could count portfolio URLs

---

## Recommended Matching Algorithm

### Step 1: Primary Filtering (Must Pass)

```javascript
{
  'education.field': scope.field,  // FIX: Use education.field, not field
  badgeLevel: { $exists: true, $ne: null },
  status: FreelancerStatus.APPROVED
}
```

### Step 2: Calculate Match Score

For each freelancer that passes Step 1:

```javascript
matchScore = {
  badgeLevelScore:
    badgeLevel === "HIGH" ? 30 : badgeLevel === "MEDIUM" ? 20 : 10,
  badgeScore: badgeScore || 0, // Raw test score
  innerFieldsMatchCount: countMatchingInnerFields(
    scope.innerFields,
    freelancer.education.innerFields
  ),
  experienceScore: yearsOfExperience || 0,
  portfolioScore: portfolioUrls.length * 2, // Optional
};

totalScore =
  badgeLevelScore +
  badgeScore / 10 +
  innerFieldsMatchCount * 15 +
  experienceScore * 2 +
  portfolioScore;
```

### Step 3: Sort by Total Score

- Sort by `totalScore` descending
- Within same score, sort by `badgeLevel` (HIGH > MEDIUM > LOW)
- Within same badge level, sort by `badgeScore` descending

---

## Current Issues

### Issue 1: Field Property Mismatch ❌

**Problem**: Query uses `field: scope.field` but Freelancer model has `education.field`

**Current Code** (Line 335 in `freelancers.ts`):

```javascript
const freelancers = await Freelancer.find({
  field: scope.field,  // ❌ This property doesn't exist
  ...
});
```

**Fix**:

```javascript
const freelancers = await Freelancer.find({
  'education.field': scope.field,  // ✅ Use nested property
  ...
});
```

### Issue 2: No Inner Fields Matching ❌

**Problem**: Doesn't consider specializations (inner fields)

**Fix**: Add inner fields matching logic:

```javascript
// Option 1: Filter by inner fields (strict)
'education.innerFields': { $in: scope.innerFields }

// Option 2: Score by inner fields (flexible - recommended)
// Calculate match count in scoring algorithm
```

### Issue 3: Limited Sorting ❌

**Problem**: Only sorts by badge level, not considering other factors

**Fix**: Implement multi-factor sorting:

```javascript
freelancers.sort((a, b) => {
  // First: Badge level
  const badgeDiff = badgePriority[b.badgeLevel] - badgePriority[a.badgeLevel];
  if (badgeDiff !== 0) return badgeDiff;

  // Second: Badge score
  const scoreDiff = (b.badgeScore || 0) - (a.badgeScore || 0);
  if (scoreDiff !== 0) return scoreDiff;

  // Third: Inner fields match count
  const aMatches = countMatchingInnerFields(
    scope.innerFields,
    a.education.innerFields
  );
  const bMatches = countMatchingInnerFields(
    scope.innerFields,
    b.education.innerFields
  );
  return bMatches - aMatches;
});
```

---

## Summary

### Current Criteria (Broken)

1. ❌ Field match (wrong property name)
2. ✅ Badge level (working)
3. ✅ Approval status (working)

### Recommended Criteria

1. ✅ Field match (fix property name)
2. ✅ Inner fields match (add this)
3. ✅ Badge level (keep)
4. ✅ Approval status (keep)
5. ✅ Badge score (add to sorting)
6. ✅ Experience (optional filter)
7. ✅ Inner fields match count (add to scoring)

### Priority Fix

**URGENT**: Fix the `field` property mismatch - this is why no freelancers are showing up!
