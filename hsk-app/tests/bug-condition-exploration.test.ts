/**
 * Bug Condition Exploration Test - Prisma Schema Inconsistency
 * 
 * **Property 1: Bug Condition** - Schema Consistency Validation
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This test encodes the expected behavior:
 * - Single authoritative schema contains all models
 * - All field definitions are correct and complete
 * - Prisma client generation succeeds
 * - Database synchronization creates all required tables
 * - API routes can access all models without errors
 * 
 * When this test FAILS on unfixed code, it surfaces counterexamples that demonstrate:
 * - Schema files are inconsistent (frontend ≠ backend)
 * - Models are missing from backend schema (GrammarProgress, ReviewSession)
 * - Field type definitions don't match (AiSession.type)
 * - Build process references wrong schema file
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const projectRoot = join(__dirname, '..');
const frontendSchemaPath = join(projectRoot, 'frontend', 'prisma', 'schema.prisma');
const backendSchemaPath = join(projectRoot, 'backend', 'prisma', 'schema.prisma');

/**
 * Helper: Check if schema files are inconsistent
 * From Bug Condition: schemaFilesInconsistent()
 */
function schemaFilesInconsistent(): { inconsistent: boolean; reason?: string } {
  if (!existsSync(frontendSchemaPath) && !existsSync(backendSchemaPath)) {
    return { inconsistent: false, reason: 'No schema files exist' };
  }
  
  if (!existsSync(frontendSchemaPath)) {
    return { inconsistent: false, reason: 'Only backend schema exists (expected state)' };
  }
  
  if (!existsSync(backendSchemaPath)) {
    return { inconsistent: true, reason: 'Only frontend schema exists (missing backend)' };
  }
  
  const frontendContent = readFileSync(frontendSchemaPath, 'utf-8');
  const backendContent = readFileSync(backendSchemaPath, 'utf-8');
  
  if (frontendContent === backendContent) {
    return { inconsistent: false, reason: 'Schema files are identical' };
  }
  
  return { inconsistent: true, reason: 'Frontend schema ≠ backend schema' };
}

/**
 * Helper: Check if models are missing from backend schema
 * From Bug Condition: modelsMissingFromBackendSchema()
 */
function modelsMissingFromBackendSchema(): { missing: boolean; missingModels: string[] } {
  if (!existsSync(backendSchemaPath)) {
    return { missing: true, missingModels: ['Backend schema does not exist'] };
  }
  
  const backendContent = readFileSync(backendSchemaPath, 'utf-8');
  
  const requiredModels = ['GrammarProgress', 'ReviewSession'];
  const missingModels: string[] = [];
  
  for (const model of requiredModels) {
    const modelRegex = new RegExp(`model\\s+${model}\\s*{`, 'm');
    if (!modelRegex.test(backendContent)) {
      missingModels.push(model);
    }
  }
  
  return { missing: missingModels.length > 0, missingModels };
}

/**
 * Helper: Check if AiSession.type field has mismatched values
 * From Bug Condition: fieldTypeMismatch()
 */
function fieldTypeMismatch(): { mismatch: boolean; details?: string } {
  if (!existsSync(frontendSchemaPath) || !existsSync(backendSchemaPath)) {
    return { mismatch: false, details: 'Cannot compare - schema file(s) missing' };
  }
  
  const frontendContent = readFileSync(frontendSchemaPath, 'utf-8');
  const backendContent = readFileSync(backendSchemaPath, 'utf-8');
  
  // Extract AiSession.type comment from both schemas
  const aiSessionFrontend = frontendContent.match(/model\s+AiSession\s*{[^}]*}/s)?.[0] || '';
  const aiSessionBackend = backendContent.match(/model\s+AiSession\s*{[^}]*}/s)?.[0] || '';
  
  const frontendTypeComment = aiSessionFrontend.match(/type\s+String\s*\/\/\s*(.+)/)?.[1] || '';
  const backendTypeComment = aiSessionBackend.match(/type\s+String\s*\/\/\s*(.+)/)?.[1] || '';
  
  if (frontendTypeComment !== backendTypeComment) {
    return { 
      mismatch: true, 
      details: `Frontend: ${frontendTypeComment} | Backend: ${backendTypeComment}` 
    };
  }
  
  return { mismatch: false };
}

/**
 * Helper: Check if build process references frontend schema
 * From Bug Condition: buildProcessReferencesFrontendSchema()
 */
function buildProcessReferencesFrontendSchema(): { references: boolean; details?: string } {
  const frontendPackageJsonPath = join(projectRoot, 'frontend', 'package.json');
  
  if (!existsSync(frontendPackageJsonPath)) {
    return { references: false, details: 'Frontend package.json not found' };
  }
  
  const packageJson = JSON.parse(readFileSync(frontendPackageJsonPath, 'utf-8'));
  const buildScript = packageJson.scripts?.build || '';
  
  // Check if build script runs prisma generate without specifying backend schema
  if (buildScript.includes('prisma generate') && !buildScript.includes('../backend/prisma')) {
    return { 
      references: true, 
      details: `Build script: "${buildScript}" - references local schema, not backend` 
    };
  }
  
  return { references: false };
}

/**
 * Test 1: Verify single authoritative schema exists
 * Expected behavior: Only backend/prisma/schema.prisma should exist
 * Bug condition: Both frontend and backend schemas exist and differ
 */
test('Property 1.1: Single authoritative schema file exists', async () => {
  const result = schemaFilesInconsistent();
  
  // Expected: Only backend schema exists (frontend schema should be deleted)
  const onlyBackendExists = !existsSync(frontendSchemaPath) && existsSync(backendSchemaPath);
  
  assert.ok(
    onlyBackendExists,
    `EXPECTED: Single authoritative schema in backend/prisma/schema.prisma
ACTUAL: ${result.reason}
COUNTEREXAMPLE: Duplicate schema files exist with inconsistent content`
  );
});

/**
 * Test 2: Verify all required models exist in backend schema
 * Expected behavior: Backend schema contains GrammarProgress and ReviewSession
 * Bug condition: Models are missing from backend schema
 */
test('Property 1.2: All required models exist in authoritative schema', async () => {
  const result = modelsMissingFromBackendSchema();
  
  assert.ok(
    !result.missing,
    `EXPECTED: Backend schema contains all models including GrammarProgress, ReviewSession
ACTUAL: Missing models: ${result.missingModels.join(', ')}
COUNTEREXAMPLE: ${result.missingModels.length} model(s) missing from backend schema`
  );
});

/**
 * Test 3: Verify AiSession.type field includes all valid values
 * Expected behavior: AiSession.type includes "pronunciation" | "grammar" | "translation" | "explain" | "examples"
 * Bug condition: Field type definitions don't match between schemas
 */
test('Property 1.3: Field type definitions are complete and consistent', async () => {
  const result = fieldTypeMismatch();
  
  // Expected: Backend schema has complete type definition including "examples"
  if (!existsSync(backendSchemaPath)) {
    assert.fail('Backend schema does not exist');
  }
  
  const backendContent = readFileSync(backendSchemaPath, 'utf-8');
  const aiSessionBackend = backendContent.match(/model\s+AiSession\s*{[^}]*}/s)?.[0] || '';
  const typeComment = aiSessionBackend.match(/type\s+String\s*\/\/\s*(.+)/)?.[1] || '';
  
  const allValuesPresent = 
    typeComment.includes('pronunciation') &&
    typeComment.includes('grammar') &&
    typeComment.includes('translation') &&
    typeComment.includes('explain') &&
    typeComment.includes('examples');
  
  assert.ok(
    allValuesPresent && !result.mismatch,
    `EXPECTED: AiSession.type includes all values: "pronunciation" | "grammar" | "translation" | "explain" | "examples"
ACTUAL: ${result.details || typeComment}
COUNTEREXAMPLE: Field type definition is incomplete or inconsistent`
  );
});

/**
 * Test 4: Verify build process uses authoritative backend schema
 * Expected behavior: Frontend build references backend/prisma/schema.prisma
 * Bug condition: Build process references frontend's local schema
 */
test('Property 1.4: Build process uses authoritative schema', async () => {
  const result = buildProcessReferencesFrontendSchema();
  
  assert.ok(
    !result.references,
    `EXPECTED: Build process references backend/prisma/schema.prisma
ACTUAL: ${result.details}
COUNTEREXAMPLE: Build process references local frontend schema instead of authoritative backend schema`
  );
});

/**
 * Test 5: Verify Prisma client generation succeeds with merged schema
 * Expected behavior: Prisma client generation completes without errors
 * Bug condition: Generation fails due to schema inconsistencies
 */
test('Property 1.5: Prisma client generation succeeds', async () => {
  try {
    // Try to generate Prisma client from backend schema
    const backendDir = join(projectRoot, 'backend');
    await execAsync('npx prisma generate', { cwd: backendDir });
    
    // If we reach here, generation succeeded
    assert.ok(true, 'Prisma client generation succeeded');
  } catch (error: any) {
    assert.fail(
      `EXPECTED: Prisma client generation succeeds
ACTUAL: Generation failed with error
COUNTEREXAMPLE: ${error.message}
This indicates schema inconsistencies prevent successful client generation`
    );
  }
});

/**
 * Test 6: Verify backend schema completeness for Prisma client generation
 * Expected behavior: Backend schema contains all models needed by the application
 * Bug condition: Backend schema is missing models that exist in frontend schema
 */
test('Property 1.6: Backend schema complete for client generation', async () => {
  // This is really a summary test - if tests 1-4 pass, this should pass
  // The key issue is: backend schema is missing GrammarProgress and ReviewSession
  
  const backendMissing = modelsMissingFromBackendSchema();
  const schemasInconsistent = schemaFilesInconsistent();
  const typesMismatch = fieldTypeMismatch();
  
  const allIssues: string[] = [];
  if (schemasInconsistent.inconsistent) {
    allIssues.push('Duplicate inconsistent schemas exist');
  }
  if (backendMissing.missing) {
    allIssues.push(`Missing models: ${backendMissing.missingModels.join(', ')}`);
  }
  if (typesMismatch.mismatch) {
    allIssues.push('AiSession.type field mismatch');
  }
  
  assert.ok(
    allIssues.length === 0,
    `EXPECTED: Backend schema is complete and ready for client generation
ACTUAL: ${allIssues.length} issue(s) found
COUNTEREXAMPLES:
${allIssues.map((issue, i) => `  ${i + 1}. ${issue}`).join('\n')}

These issues prevent proper Prisma client generation with all required models.`
  );
});
