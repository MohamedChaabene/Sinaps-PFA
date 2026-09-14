# P1-2 Root Cause Analysis: Test Data Isolation Failure

## Root Cause

The test data isolation failure is caused by legacy QA/audit records lacking proper `isTestData` classification:

1. **Backend filtering logic exists but is ineffective for legacy data**
   - The backend has proper test data filtering in `conversationController.js` (lines 49-52)
   - It filters conversations where `isTestData !== true` when `includeTestData !== 'true'`
   - The frontend properly sets `includeTestData: false` by default in `conversation-history.tsx`

2. **Legacy QA/audit records lack proper classification**
   - Existing production QA/audit records were created before the `isTestData` field was properly implemented
   - These records have the default value `isTestData: false` 
   - The backend filter excludes only records with `isTestData: true`, so these legacy records appear in normal history

3. **Specific affected records identified by Manus**
   - IDOR Audit Client B 20260913
   - IDOR Audit Client A 20260913
   - P3 Audit QA 20260913
   - QA Escalation Fresh
   - QA Client 20260913 0345
   - P1 Regression QA
   - QA Test User
   - Marc Bug002 Fix QA
   - Claire Bug002 QA
   - Nadia Regression QA
   - Sophie Martin QA
   - QA Escalation Client
   - QA Test Client

## Recommended Solution: Safe Database Migration

A safe, non-destructive migration to classify existing test data:

1. **Identify test records by client name matching**
   - Use the specific client names identified in Manus's audit
   - Find User records matching these names
   - Mark their associated conversations as `isTestData: true`

2. **Execute migration with proper approval**
   - This migration only updates the `isTestData` field
   - It does not delete any data
   - It can be safely rolled back if needed (set `isTestData: false`)

3. **Verify results**
   - After migration, the default Admin history should show only production records
   - The "Données test" control should reveal the test records when enabled

## Migration Implementation

Create a migration script that:
- Connects to the database
- Finds users with test client names
- Marks their conversations as test data
- Provides detailed logging for verification

## Execution Instructions

**DO NOT RUN IN PRODUCTION WITHOUT EXPLICIT APPROVAL**

To execute the migration after approval:

```bash
cd sinaps-backend
node migrations/classifyTestData.js
```

## Rollback Plan

If needed, the migration can be rolled back by:

```javascript
// Reset test data classification
Conversation.updateMany(
  { isTestData: true },
  { isTestData: false }
)
```

## Verification

After migration, verify:

1. Admin history with "Données test" OFF shows only production records
2. Admin history with "Données test" ON shows the test records
3. KPI/statistics queries follow the same isolation
4. No production data is hidden or lost