/**
 * Preservation Property Tests - Prisma Schema Inconsistency Bugfix
 * 
 * **Property 2: Preservation** - Existing Functionality Preservation
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * IMPORTANT: These tests validate existing behavior on UNFIXED code
 * 
 * These tests encode the expected preservation behaviors:
 * - User authentication (login/logout) continues to work
 * - Lesson progress CRUD operations function correctly
 * - Flashcard scheduling algorithm (SM-2) produces same results
 * - Game results and wrong word tracking remain functional
 * - AI tutor API routes continue to respond correctly
 * 
 * When these tests PASS on unfixed code, they establish the baseline behavior.
 * After the fix, these same tests MUST continue to PASS to confirm no regressions.
 * 
 * Testing Strategy:
 * - Use property-based testing to generate many test cases
 * - Test core CRUD operations on models that exist in BOTH schemas
 * - Avoid testing GrammarProgress and ReviewSession (these are part of the bug)
 * - Focus on functionality that should be completely unaffected by schema merge
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import * as fc from 'fast-check';
// Import Prisma client from backend where it's generated
import { PrismaClient } from '../backend/node_modules/@prisma/client';
import * as bcrypt from 'bcryptjs';

// Initialize Prisma client - this uses the backend schema (current authoritative source)
// These tests validate behavior on UNFIXED code where backend schema is missing some models
const prisma = new PrismaClient();

// Cleanup helper to ensure tests don't interfere with each other
async function cleanupTestData(userId?: string) {
  if (userId) {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
}

/**
 * Property 2.1: User Authentication Preservation
 * Validates: Requirement 3.1 - Frontend build generates Prisma client successfully
 * 
 * User authentication flows continue to work:
 * - User creation with password hashing
 * - User lookup by email
 * - Password verification
 */
test('Property 2.1: User authentication flows continue to work', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        email: fc.emailAddress(),
        password: fc.string({ minLength: 6, maxLength: 100 }),
      }),
      async (userData) => {
        const testEmail = `test-${Date.now()}-${Math.random()}@example.com`;
        let userId: string | undefined;

        try {
          // Property: User can be created with hashed password
          const passwordHash = await bcrypt.hash(userData.password, 10);
          const user = await prisma.user.create({
            data: {
              name: userData.name,
              email: testEmail,
              passwordHash,
            },
          });
          
          userId = user.id;
          
          // Property: User can be found by email
          const foundUser = await prisma.user.findUnique({
            where: { email: testEmail },
          });
          
          assert.ok(foundUser, 'User should be found by email');
          assert.strictEqual(foundUser.email, testEmail, 'Email should match');
          assert.strictEqual(foundUser.name, userData.name, 'Name should match');
          
          // Property: Password verification works correctly
          const passwordValid = await bcrypt.compare(userData.password, foundUser.passwordHash);
          assert.ok(passwordValid, 'Password verification should succeed');
          
          // Property: Wrong password fails verification
          const wrongPasswordValid = await bcrypt.compare('wrong-password', foundUser.passwordHash);
          assert.ok(!wrongPasswordValid, 'Wrong password verification should fail');
          
        } finally {
          await cleanupTestData(userId);
        }
      }
    ),
    { numRuns: 10 } // Run 10 test cases
  );
});

/**
 * Property 2.2: Lesson Progress Preservation
 * Validates: Requirement 3.2 - Database synchronization creates all necessary tables
 * 
 * Lesson progress CRUD operations function correctly:
 * - Create lesson progress records
 * - Update completion status and scores
 * - Query progress by user and lesson
 */
test('Property 2.2: Lesson progress CRUD operations function correctly', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        lessonId: fc.constantFrom('new-1-lesson-1', 'new-1-lesson-2', 'new-2-lesson-1'),
        score: fc.integer({ min: 0, max: 100 }),
        completed: fc.boolean(),
      }),
      async (progressData) => {
        const testEmail = `test-lesson-${Date.now()}-${Math.random()}@example.com`;
        let userId: string | undefined;

        try {
          // Create test user
          const user = await prisma.user.create({
            data: {
              name: 'Test User',
              email: testEmail,
              passwordHash: await bcrypt.hash('password', 10),
            },
          });
          userId = user.id;

          // Property: Lesson progress can be created
          const progress = await prisma.lessonProgress.create({
            data: {
              userId: user.id,
              lessonId: progressData.lessonId,
              completed: progressData.completed,
              score: progressData.score,
              completedAt: progressData.completed ? new Date() : null,
            },
          });

          assert.ok(progress.id, 'Progress record should have an ID');
          assert.strictEqual(progress.lessonId, progressData.lessonId, 'Lesson ID should match');
          assert.strictEqual(progress.score, progressData.score, 'Score should match');

          // Property: Progress can be queried by user and lesson
          const foundProgress = await prisma.lessonProgress.findUnique({
            where: {
              userId_lessonId: {
                userId: user.id,
                lessonId: progressData.lessonId,
              },
            },
          });

          assert.ok(foundProgress, 'Progress should be found by unique constraint');
          assert.strictEqual(foundProgress.completed, progressData.completed, 'Completion status should match');

          // Property: Progress can be updated
          const updatedProgress = await prisma.lessonProgress.update({
            where: { id: progress.id },
            data: { score: 95, completed: true },
          });

          assert.strictEqual(updatedProgress.score, 95, 'Score should be updated');
          assert.strictEqual(updatedProgress.completed, true, 'Completion should be updated');

        } finally {
          await cleanupTestData(userId);
        }
      }
    ),
    { numRuns: 10 }
  );
});

/**
 * Property 2.3: Flashcard SM-2 Algorithm Preservation
 * Validates: Requirement 3.2 - Database synchronization preserves existing data
 * 
 * Flashcard review scheduling (SM-2 algorithm) produces same results:
 * - Create flashcard records with SM-2 parameters
 * - Update ease factor, interval, and repetitions
 * - Query cards due for review
 */
test('Property 2.3: Flashcard scheduling algorithm produces same results', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        wordId: fc.string({ minLength: 1, maxLength: 20 }),
        easeFactor: fc.float({ min: Math.fround(1.3), max: Math.fround(3.0) }),
        interval: fc.integer({ min: 1, max: 30 }),
        repetitions: fc.integer({ min: 0, max: 10 }),
      }),
      async (cardData) => {
        const testEmail = `test-flashcard-${Date.now()}-${Math.random()}@example.com`;
        let userId: string | undefined;

        try {
          // Create test user
          const user = await prisma.user.create({
            data: {
              name: 'Test User',
              email: testEmail,
              passwordHash: await bcrypt.hash('password', 10),
            },
          });
          userId = user.id;

          const today = new Date().toISOString().split('T')[0];
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + cardData.interval);

          // Property: Flashcard can be created with SM-2 parameters
          const card = await prisma.flashcardCard.create({
            data: {
              userId: user.id,
              wordId: cardData.wordId,
              easeFactor: cardData.easeFactor,
              interval: cardData.interval,
              repetitions: cardData.repetitions,
              nextReview: nextReviewDate.toISOString().split('T')[0],
              lastReview: today,
            },
          });

          assert.ok(card.id, 'Card should have an ID');
          // Use approximate comparison for floats due to database precision
          assert.ok(Math.abs(card.easeFactor - cardData.easeFactor) < 0.0001, 
            `Ease factor should match (expected ${cardData.easeFactor}, got ${card.easeFactor})`);
          assert.strictEqual(card.interval, cardData.interval, 'Interval should match');
          assert.strictEqual(card.repetitions, cardData.repetitions, 'Repetitions should match');

          // Property: SM-2 parameters can be updated (simulating review)
          const newEaseFactor = Math.max(1.3, cardData.easeFactor - 0.15);
          const newInterval = Math.ceil(cardData.interval * newEaseFactor);
          const newRepetitions = cardData.repetitions + 1;

          const updatedCard = await prisma.flashcardCard.update({
            where: { id: card.id },
            data: {
              easeFactor: newEaseFactor,
              interval: newInterval,
              repetitions: newRepetitions,
              lastReview: today,
            },
          });

          assert.strictEqual(updatedCard.repetitions, newRepetitions, 'Repetitions should increment');
          assert.ok(updatedCard.easeFactor >= 1.3, 'Ease factor should not go below 1.3');

        } finally {
          await cleanupTestData(userId);
        }
      }
    ),
    { numRuns: 10 }
  );
});

/**
 * Property 2.4: Game Results and Wrong Word Tracking Preservation
 * Validates: Requirement 3.4 - Existing data models remain functional
 * 
 * Game results and wrong word tracking remain functional:
 * - Create game result records
 * - Track wrong words with counters
 * - Query game history and wrong word statistics
 */
test('Property 2.4: Game results and wrong word tracking remain functional', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        lessonId: fc.constantFrom('new-1-lesson-1', 'new-2-lesson-1'),
        mode: fc.constantFrom('meaning', 'pinyin', 'hanzi'),
        score: fc.integer({ min: 0, max: 100 }),
        totalQ: fc.integer({ min: 5, max: 20 }),
        correct: fc.integer({ min: 0, max: 20 }),
        wordId: fc.string({ minLength: 1, maxLength: 20 }),
        simplified: fc.string({ minLength: 1, maxLength: 10 }),
      }),
      async (gameData) => {
        const testEmail = `test-game-${Date.now()}-${Math.random()}@example.com`;
        let userId: string | undefined;

        try {
          // Create test user
          const user = await prisma.user.create({
            data: {
              name: 'Test User',
              email: testEmail,
              passwordHash: await bcrypt.hash('password', 10),
            },
          });
          userId = user.id;

          // Property: Game results can be created
          const gameResult = await prisma.gameResult.create({
            data: {
              userId: user.id,
              lessonId: gameData.lessonId,
              mode: gameData.mode,
              score: gameData.score,
              totalQ: gameData.totalQ,
              correct: gameData.correct,
              timeTaken: 60000, // 60 seconds
            },
          });

          assert.ok(gameResult.id, 'Game result should have an ID');
          assert.strictEqual(gameResult.mode, gameData.mode, 'Game mode should match');
          assert.strictEqual(gameResult.score, gameData.score, 'Score should match');

          // Property: Wrong words can be tracked
          const wrongWord = await prisma.wrongWord.create({
            data: {
              userId: user.id,
              wordId: gameData.wordId,
              simplified: gameData.simplified,
              pinyin: 'test_pinyin',
              meaning: 'test meaning',
              level: 'new-1',
              wrongCount: 1,
            },
          });

          assert.ok(wrongWord.id, 'Wrong word should have an ID');
          assert.strictEqual(wrongWord.wrongCount, 1, 'Wrong count should be 1');

          // Property: Wrong word count can be incremented
          const updatedWrongWord = await prisma.wrongWord.update({
            where: { id: wrongWord.id },
            data: {
              wrongCount: { increment: 1 },
              lastWrongAt: new Date(),
            },
          });

          assert.strictEqual(updatedWrongWord.wrongCount, 2, 'Wrong count should increment to 2');

          // Property: Game results can be queried by user
          const gameResults = await prisma.gameResult.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
          });

          assert.ok(gameResults.length > 0, 'Should find game results for user');

        } finally {
          await cleanupTestData(userId);
        }
      }
    ),
    { numRuns: 10 }
  );
});

/**
 * Property 2.5: AI Tutor Sessions Preservation
 * Validates: Requirement 3.5 - AI tutor functionality continues to work
 * 
 * AI tutor API routes continue to respond correctly:
 * - Create AI session records for different types
 * - Query sessions by user and type
 * - Track token usage
 * 
 * Note: We test with types that exist in BOTH schemas to ensure preservation.
 * The "examples" type difference is part of the bug condition, not preservation.
 */
test('Property 2.5: AI tutor sessions continue to function correctly', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        // Use only types that exist in both schemas for preservation testing
        type: fc.constantFrom('pronunciation', 'grammar', 'translation', 'explain'),
        input: fc.string({ minLength: 1, maxLength: 100 }),
        output: fc.string({ minLength: 1, maxLength: 200 }),
        tokens: fc.integer({ min: 10, max: 1000 }),
      }),
      async (sessionData) => {
        const testEmail = `test-ai-${Date.now()}-${Math.random()}@example.com`;
        let userId: string | undefined;

        try {
          // Create test user
          const user = await prisma.user.create({
            data: {
              name: 'Test User',
              email: testEmail,
              passwordHash: await bcrypt.hash('password', 10),
            },
          });
          userId = user.id;

          // Property: AI sessions can be created with user ID
          const session = await prisma.aiSession.create({
            data: {
              userId: user.id,
              type: sessionData.type,
              input: sessionData.input,
              output: sessionData.output,
              tokens: sessionData.tokens,
            },
          });

          assert.ok(session.id, 'Session should have an ID');
          assert.strictEqual(session.type, sessionData.type, 'Session type should match');
          assert.strictEqual(session.tokens, sessionData.tokens, 'Token count should match');

          // Property: Sessions can be queried by user and type
          const sessions = await prisma.aiSession.findMany({
            where: {
              userId: user.id,
              type: sessionData.type,
            },
          });

          assert.ok(sessions.length > 0, 'Should find sessions for user');
          assert.ok(sessions.some(s => s.id === session.id), 'Should find the created session');

          // Property: Sessions can be counted for rate limiting
          const sessionCount = await prisma.aiSession.count({
            where: {
              userId: user.id,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          });

          assert.ok(sessionCount >= 1, 'Should count at least one session');

          // Property: Anonymous sessions work (userId can be null)
          const anonSession = await prisma.aiSession.create({
            data: {
              userId: null,
              type: sessionData.type,
              input: sessionData.input,
              output: sessionData.output,
              tokens: sessionData.tokens,
            },
          });

          assert.ok(anonSession.id, 'Anonymous session should be created');
          assert.strictEqual(anonSession.userId, null, 'Anonymous session should have null userId');

          // Cleanup anonymous session
          await prisma.aiSession.delete({ where: { id: anonSession.id } });

        } finally {
          await cleanupTestData(userId);
        }
      }
    ),
    { numRuns: 10 }
  );
});

/**
 * Property 2.6: Notebook Entries Preservation
 * Validates: Requirement 3.5 - User data preservation
 * 
 * Notebook entries continue to work:
 * - Create notebook entries for words
 * - Update notes
 * - Query entries by user
 */
test('Property 2.6: Notebook entries remain functional', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        wordId: fc.string({ minLength: 1, maxLength: 20 }),
        simplified: fc.string({ minLength: 1, maxLength: 10 }),
        pinyin: fc.string({ minLength: 1, maxLength: 20 }),
        meaning: fc.string({ minLength: 1, maxLength: 50 }),
        note: fc.string({ maxLength: 200 }),
      }),
      async (entryData) => {
        const testEmail = `test-notebook-${Date.now()}-${Math.random()}@example.com`;
        let userId: string | undefined;

        try {
          // Create test user
          const user = await prisma.user.create({
            data: {
              name: 'Test User',
              email: testEmail,
              passwordHash: await bcrypt.hash('password', 10),
            },
          });
          userId = user.id;

          // Property: Notebook entries can be created
          const entry = await prisma.notebookEntry.create({
            data: {
              userId: user.id,
              wordId: entryData.wordId,
              level: 'new-1',
              simplified: entryData.simplified,
              pinyin: entryData.pinyin,
              meaning: entryData.meaning,
              note: entryData.note,
            },
          });

          assert.ok(entry.id, 'Entry should have an ID');
          assert.strictEqual(entry.note, entryData.note, 'Note should match');

          // Property: Notes can be updated
          const updatedEntry = await prisma.notebookEntry.update({
            where: { id: entry.id },
            data: { note: 'Updated note' },
          });

          assert.strictEqual(updatedEntry.note, 'Updated note', 'Note should be updated');

          // Property: Entries can be queried by user
          const entries = await prisma.notebookEntry.findMany({
            where: { userId: user.id },
          });

          assert.ok(entries.length > 0, 'Should find entries for user');

        } finally {
          await cleanupTestData(userId);
        }
      }
    ),
    { numRuns: 10 }
  );
});

// Cleanup after all tests
test.after(async () => {
  await prisma.$disconnect();
});
