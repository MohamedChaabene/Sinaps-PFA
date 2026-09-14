# Migration Plan: Add Test/Audit Data Marker

## Problem
The production admin history currently contains seeded QA/audit records such as:
- "IDOR Audit Client A"
- "IDOR Audit Client B"  
- "P1 Regression QA"
- Other obvious test/audit records

These records contaminate normal production customer history/KPIs.

## Current State Analysis
1. **Seed Script Investigation**: The existing `seed.js` creates demo users with realistic names (Amine Trabelsi, Sonia Gharbi, Omar Farouk) - these are normal demo data, not the QA/audit records mentioned.

2. **Schema Analysis**: The current schemas (`User.js`, `Conversation.js`) do not have any field to distinguish test/audit data from production customer data.

3. **Root Cause**: The QA/audit records mentioned in the requirements were created during actual QA/audit testing in production, not from the seed script. They have no identifying metadata in the current schema.

## Proposed Solution
Add a `isTestData` boolean field to both User and Conversation schemas to mark test/audit records.

## Migration Steps

### Phase 1: Schema Changes
1. Add `isTestData: { type: Boolean, default: false }` to User schema
2. Add `isTestData: { type: Boolean, default: false }` to Conversation schema
3. Update seed.js to mark demo data with `isTestData: true`

### Phase 2: Data Cleanup (Requires Manual Review)
Before executing on production:
1. Export all users and conversations to backup
2. Identify specific QA/audit records based on names/patterns
3. Update identified records with `isTestData: true`
4. Review the list of marked records with stakeholders
5. Only after approval, execute the update query

### Phase 3: API Changes
1. Update `getConversations` to filter out `isTestData: true` records by default
2. Add optional `includeTestData` parameter for admin debugging
3. Update admin dashboard to respect the filtering

### Phase 4: Frontend Changes
1. Update admin history to only show non-test data by default
2. Add toggle for admins to include test data when needed

## Safe Implementation Approach
Since this requires production data changes:
- **DO NOT** execute automatic data cleanup
- **DO NOT** implement fragile string-based filters
- **DO** provide this migration plan for review
- **DO** implement schema changes and filtering logic
- **DO** mark future seed data as test data

## Query for Manual Data Cleanup (Review Before Execution)
```javascript
// Backup first
db.users.find().forEach(doc => {
  print(JSON.stringify(doc));
});

// Identify potential test records (review these patterns)
db.users.find({
  $or: [
    { name: /IDOR/i },
    { name: /Audit/i },
    { name: /QA/i },
    { name: /Test/i },
    { name: /Regression/i }
  ]
});

// After review and approval, mark as test data
db.users.updateMany(
  { name: /IDOR|Audit|QA|Test|Regression/i },
  { $set: { isTestData: true } }
);

db.conversations.updateMany(
  { client: { $in: /* array of test user IDs */ } },
  { $set: { isTestData: true } }
);
```

## Alternative: Temporary Filter
If immediate isolation is needed without schema changes, implement a temporary filter in the admin API based on known test patterns, but document this as a stopgap measure only.

## Recommendation
Implement the schema changes and filtering logic now. Provide the manual cleanup plan for production data to be reviewed and executed by the operations team with proper backup and approval processes.
