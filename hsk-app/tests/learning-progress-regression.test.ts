import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const frontend = resolve(__dirname, "../frontend");
const frontendRequire = createRequire(resolve(frontend, "package.json"));
const user = { id: "test-user", name: "Test", email: "test@example.com" };
const card = (wordId = "new-1-0") => ({ wordId, easeFactor: 2.5, interval: 6, repetitions: 2, nextReview: "2000-01-01", lastReview: "2000-01-01" });
const word = (id = "new-1-0") => ({ id, simplified: "爱", pinyin: "ài", meaning: "love", meanings: ["love"], meaningVi: "yêu", classifiers: [] });

// Execute actual route/component code with isolated I/O. No real database or AI calls.
function loader(mocks: Record<string, unknown> = {}, globals: Record<string, unknown> = {}) {
  const cache = new Map<string, { exports: any }>();
  const context = { console, Date, setTimeout, clearTimeout, ...globals };
  const load = (filename: string): any => {
    const absolute = resolve(frontend, filename);
    if (cache.has(absolute)) return cache.get(absolute)!.exports;
    const module = { exports: {} as any };
    cache.set(absolute, module);
    const output = ts.transpileModule(readFileSync(absolute, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (name: string) => {
      if (name in mocks) return mocks[name];
      if (name.startsWith("@/") || name.startsWith(".")) {
        const target = name.startsWith("@/") ? resolve(frontend, name.slice(2)) : resolve(dirname(absolute), name);
        return load(/\.tsx?$/.test(target) ? target : existsSync(`${target}.ts`) ? `${target}.ts` : `${target}.tsx`);
      }
      return frontendRequire(name);
    };
    runInNewContext(`(function(require, module, exports) { ${output}\n})`, context)(localRequire, module, module.exports);
    return module.exports;
  };
  return load;
}

function hooks() {
  const states: any[] = [], refs: any[] = [], effects: any[] = [], pending: Array<() => void> = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0;
  return {
    react: {
      useState(initial: any) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], (next: any) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      },
      useRef(initial: any) { const index = refIndex++; return refs[index] ??= { current: initial }; },
      useMemo: (fn: () => unknown) => fn(),
      useCallback: (fn: unknown) => fn,
      useEffect(fn: () => void, deps: any[]) {
        const index = effectIndex++;
        if (!effects[index] || deps.some((value, i) => value !== effects[index].deps[i])) {
          pending.push(() => { effects[index]?.cleanup?.(); effects[index] = { deps, cleanup: fn() }; });
        }
      },
    },
    render(component: (props: any) => any, props = {}) {
      stateIndex = refIndex = effectIndex = 0;
      const tree = component(props);
      pending.splice(0).forEach(fn => fn());
      return tree;
    },
  };
}

function find(tree: any, predicate: (node: any) => boolean): any {
  if (!tree || typeof tree !== "object") return null;
  if (predicate(tree)) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) {
    const result = find(child, predicate);
    if (result) return result;
  }
  return null;
}
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)); };
const response = (data: unknown) => ({ ok: true, json: async () => data });
const authMock = { getUserIdFromRequest: () => user.id };
const request = (search: string) => new (frontendRequire("next/server").NextRequest)(`http://localhost${search}`);

test("Bulk import preserves existing schedules, inserts new cards, and ignores supplied userId", async () => {
  const existing = { ...card(), repetitions: 8, interval: 30 };
  const stored = new Map([[existing.wordId, existing]]);
  let insertedUser: string | undefined;
  const load = loader({ "@/lib/auth": authMock, "@/lib/prisma": { prisma: { flashcardCard: {
    createMany: async ({ data, skipDuplicates }: any) => {
      assert.equal(skipDuplicates, true);
      let count = 0;
      for (const incoming of data) if (!stored.has(incoming.wordId)) { stored.set(incoming.wordId, incoming); insertedUser = incoming.userId; count++; }
      return { count };
    },
  } } } });
  const result = await load("app/api/progress/flashcard/bulk/route.ts").POST({ json: async () => ({ cards: [{ ...card(), repetitions: 0 }, { ...card("new-1-1"), userId: "other-user" }] }) });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).saved, 1);
  assert.equal(stored.get(existing.wordId)!.repetitions, 8);
  assert.equal(stored.get(existing.wordId)!.interval, 30);
  assert.equal(insertedUser, user.id);
});

test("Flashcards hydrate the account schedule before initializing a fresh browser", async () => {
  const h = hooks(), calls: string[] = [];
  const load = loader({ react: h.react, "@/components/auth/AuthProvider": { useAuth: () => ({ user, loading: false }) } }, {
    window: {}, localStorage: { getItem: () => null, setItem: () => {} },
    fetch: async (url: string) => { calls.push(url); assert.equal(url, "/api/progress/flashcard"); return response({ cards: [{ ...card(), nextReview: "9999-01-01" }] }); },
  });
  const component = load("components/vocabulary/FlashcardClient.tsx").default;
  const props = { lesson: { id: "new-1-lesson-1", words: [word()] } };
  h.render(component, props);
  await flush();
  const tree = h.render(component, props);
  assert.ok(find(tree, node => node.props?.children === "Chưa đến lịch ôn"));
  assert.deepEqual(calls, ["/api/progress/flashcard"]);
});

test("Cloud gates unlock both a set and its lesson with an empty local cache", async () => {
  const load = loader({}, { window: {}, localStorage: { getItem: () => null } });
  const hsk = load("lib/hskData.ts");
  const gates = { "new-1-set-1": { passed: true, score: 90, attempts: 1, lastAttemptAt: "2026-10-13" } };
  assert.equal(hsk.isSetUnlocked(1, 2, gates), true);
  assert.equal(hsk.isLessonUnlocked(1, 4, gates), true);
  assert.equal(hsk.isSetUnlocked(1, 3, gates), false);
  const h = hooks();
  const client = loader({ react: h.react, "@/components/auth/AuthProvider": { useAuth: () => ({ user, loading: false }) } }, {
    window: {}, localStorage: { getItem: () => null },
    fetch: async () => response({ gates: [{ setId: "new-1-set-1", ...gates["new-1-set-1"] }] }),
  })("components/vocabulary/LessonDetailClient.tsx").default;
  const props = { lesson: { id: "new-1-lesson-4", level: "new-1", title: "Bài 4", description: "", words: [word()] } };
  h.render(client, props); await flush();
  const tree = h.render(client, props);
  assert.equal(find(tree, node => typeof node.props?.children === "string" && node.props.children.includes("đang bị khóa")), null);
  assert.ok(find(tree, node => node.props?.children === "Lật thẻ") || find(tree, node => node.props?.href?.includes("/vocabulary/flashcard/")));
});

test("Review totals count all 151 cards while response lists remain bounded", async () => {
  const cards = Array.from({ length: 151 }, (_, index) => card(`new-1-${index}`));
  const load = loader({ "@/lib/auth": authMock, "@/lib/prisma": { prisma: {
    flashcardCard: { findMany: async ({ take }: any) => cards.slice(0, take), count: async () => cards.length },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  } } });
  const route = load("app/api/review/route.ts");
  const result = await (await route.GET(request("/api/review?date=2026-10-13"))).json();
  assert.equal(result.totalCards, 151); assert.equal(result.dueCount, 151);
  assert.equal(result.cards.length, 50); assert.equal(result.allCards.length, 100);
  const invalidLimit = await (await route.GET(request("/api/review?limit=invalid"))).json();
  assert.equal(invalidLimit.cards.length, 50);
});

test("Review resolves overdue words outside the levels of the 100 most recent cards and replays use updated SM-2", async () => {
  const h = hooks(), requests: Array<{ url: string; body?: any }> = [];
  const local = new Map<string, string>();
  const load = loader({ react: h.react, "@/components/auth/AuthProvider": { useAuth: () => ({ user }) } }, {
    window: { setTimeout: () => 1, clearTimeout: () => {} },
    localStorage: { getItem: (key: string) => local.get(key) ?? null, setItem: (key: string, value: string) => local.set(key, value) },
    fetch: async (url: string, options?: any) => {
      requests.push({ url, body: options?.body ? JSON.parse(options.body) : undefined });
      if (url.startsWith("/api/review?")) return response({ cards: [card()], allCards: Array.from({ length: 100 }, (_, index) => card(`new-2-${index}`)) });
      if (url === "/data/hsk-new-1.json") return response({ lessons: [{ words: [word()] }] });
      if (url === "/data/hsk-new-2.json") return response({ lessons: [] });
      return response({});
    },
  });
  const component = load("components/review/ReviewClient.tsx").default;
  h.render(component); await flush();
  const rate = () => {
    let tree = h.render(component);
    find(tree, node => node.type === "button" && node.props.children === "Lật thẻ").props.onClick();
    tree = h.render(component);
    find(tree, node => node.type === "button" && find(node, child => child.props?.children === "Đã thuộc")).props.onClick({ stopPropagation() {} });
    h.render(component);
    return h.render(component);
  };
  const summary = rate();
  assert.ok(requests.some(item => item.url === "/data/hsk-new-1.json"));
  assert.equal(summary.props.total, 1);
  summary.props.onRestart();
  rate();
  const updates = requests.filter(item => item.url === "/api/progress/flashcard").map(item => item.body);
  assert.equal(updates[0].repetitions, 3); assert.equal(updates[1].repetitions, 4);
  assert.ok(updates[1].interval > updates[0].interval);
  assert.equal(requests.filter(item => item.url === "/api/review/history").length, 2);
});

test("History uses the learner date for streak, due cards, and calendar boundaries", async () => {
  let dueDate: string | undefined, bounds: any;
  const load = loader({ "@/lib/auth": authMock, "@/lib/prisma": { prisma: {
    reviewSession: { findMany: async ({ where }: any) => { bounds = where.date; return ["2026-10-12", "2026-10-13"].map(date => ({ date, totalCards: 1, correctCards: 1, durationSec: 1 })); } },
    flashcardCard: { count: async ({ where }: any) => { if (where.nextReview) dueDate = where.nextReview.lte; return 1; } },
  } } });
  const body = await (await load("app/api/review/history/route.ts").GET(request("/api/review/history?days=2&date=2026-10-13"))).json();
  assert.equal(body.stats.streak, 2); assert.equal(dueDate, "2026-10-13");
  assert.equal(bounds.gte, "2026-10-11"); assert.equal(bounds.lte, "2026-10-13");
  const dates = load("lib/dateKey.ts");
  assert.equal(dates.addDateKeyDays("2024-03-01", -1), "2024-02-29");
  assert.equal(dates.isDateKey("2026-02-30"), false);
});
