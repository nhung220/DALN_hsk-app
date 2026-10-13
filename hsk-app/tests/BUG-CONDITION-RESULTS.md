# Bug Condition Exploration Test Results

**Test Date**: Task 1 Execution  
**Test Status**: ✅ EXPECTED FAILURE (Confirms bug exists on unfixed code)  
**Test Suite**: bug-condition-exploration.test.ts

## Summary

The bug condition exploration test **FAILED as expected** on the unfixed code, successfully surfacing counterexamples that demonstrate the Prisma schema inconsistency bug exists in the HSK application.

**Test Results**: 5 failures, 1 pass out of 6 tests

## Counterexamples Found

### 1. ✖ Property 1.1: Single authoritative schema file exists

**Expected Behavior**: Single authoritative schema in backend/prisma/schema.prisma  
**Actual Behavior**: Frontend schema ≠ backend schema  
**Counterexample**: Duplicate schema files exist with inconsistent content

**Root Cause**: Both `frontend/prisma/schema.prisma` and `backend/prisma/schema.prisma` exist and contain different content, violating the single source of truth principle.

---

### 2. ✖ Property 1.2: All required models exist in authoritative schema

**Expected Behavior**: Backend schema contains all models including GrammarProgress, ReviewSession  
**Actual Behavior**: Missing models: **GrammarProgress, ReviewSession**  
**Counterexample**: 2 model(s) missing from backend schema

**Root Cause**: The backend schema is missing critical models that exist in the frontend schema:
- `GrammarProgress` - tracks user progress on grammar exercises
- `ReviewSession` - tracks flashcard review sessions

These models are required by API routes like `/api/progress/grammar` and `/api/review/history`.

---

### 3. ✖ Property 1.3: Field type definitions are complete and consistent

**Expected Behavior**: AiSession.type includes all values: "pronunciation" | "grammar" | "translation" | "explain" | "examples"  
**Actual Behavior**: 
- Frontend: `"pronunciation" | "grammar" | "translation" | "explain"` (4 values)
- Backend: `"pronunciation" | "grammar" | "translation" | "explain" | "examples"` (5 values)

**Counterexample**: Field type definition is incomplete or inconsistent

**Root Cause**: The `AiSession.type` field comment shows different allowed values between schemas. Frontend is missing the `"examples"` value that exists in the backend schema, causing type safety issues.

---

### 4. ✖ Property 1.4: Build process uses authoritative schema

**Expected Behavior**: Build process references backend/prisma/schema.prisma  
**Actual Behavior**: Build script: `"prisma generate && prisma db push && next build"` - references local schema, not backend  
**Counterexample**: Build process references local frontend schema instead of authoritative backend schema

**Root Cause**: The frontend `package.json` build script runs `prisma generate` without specifying a schema file path, defaulting to the local `frontend/prisma/schema.prisma` instead of using the backend schema.

---

### 5. ✔ Property 1.5: Prisma client generation succeeds

**Status**: PASSED  
**Note**: Prisma client generation completes without errors, but it's generating from the incomplete backend schema. This is why the bug is subtle - the build doesn't fail, but the generated client is missing models.

---

### 6. ✖ Property 1.6: Backend schema complete for client generation

**Expected Behavior**: Backend schema is complete and ready for client generation  
**Actual Behavior**: 3 issue(s) found  
**Counterexamples**:
1. Duplicate inconsistent schemas exist
2. Missing models: GrammarProgress, ReviewSession
3. AiSession.type field mismatch

**Root Cause**: This is a summary test that confirms all the issues above prevent proper Prisma client generation with all required models.

---

## Bug Confirmation

✅ **Bug Condition Confirmed**: The test results prove that:

1. **Schema duplication exists** - Two separate schema files with different content
2. **Models are missing** - Backend schema lacks GrammarProgress and ReviewSession
3. **Type definitions mismatch** - AiSession.type field has different values
4. **Build configuration is wrong** - Frontend builds from its own schema instead of backend
5. **Client generation succeeds but is incomplete** - No build error, but missing models

These counterexamples validate the root cause analysis in the design document and confirm that the hypothesized fix (merging schemas into a single authoritative source in backend/prisma/) will resolve all identified issues.

## Next Steps

According to the bugfix workflow:

1. ✅ **Task 1 COMPLETE**: Bug condition exploration test written, run, and failures documented
2. ⏭️ **Task 2**: Write preservation property tests (observe behavior on unfixed code)
3. ⏭️ **Task 3**: Implement the fix
4. ⏭️ **Task 3.5**: Re-run this same test - it should PASS after the fix
5. ⏭️ **Task 3.6**: Verify preservation tests still pass (no regressions)

## Test File Location

- Test file: `tests/bug-condition-exploration.test.ts`
- Run command: `npm run test:bug-condition` (from `hsk-app` directory)
- Framework: Node.js built-in test runner with TypeScript (tsx)

## Important Notes

⚠️ **DO NOT fix the bug yet** - This test is designed to fail on unfixed code
⚠️ **DO NOT modify the test** - It encodes the expected behavior for validation after the fix
✅ **Test will pass after fix** - When schemas are merged correctly, all 6 tests should pass
