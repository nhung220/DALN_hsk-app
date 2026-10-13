import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname, extname } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const frontend = resolve(__dirname, "../frontend");
const frontendRequire = createRequire(resolve(frontend, "package.json"));
const syllables = JSON.parse(readFileSync(resolve(frontend, "public/data/pinyin-syllables.json"), "utf8"));
const firstId: string = syllables.find((item: any) => item.syllable === "ma" && item.tone === 1).id;
const secondId: string = syllables.find((item: any) => item.syllable === "ma" && item.tone === 2).id;
const user = { id: "learner-a", name: "A", email: "a@example.com" };

function loader(mocks: Record<string, any>, globals: Record<string, any> = {}) {
  const cache = new Map<string, any>();
  function load(filename: string): any {
    const absolute = resolve(frontend, filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    if (extname(absolute) === ".json") return JSON.parse(readFileSync(absolute, "utf8"));
    const module = { exports: {} as any };
    cache.set(absolute, module);
    const output = ts.transpileModule(readFileSync(absolute, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const requireModule = (name: string) => {
      if (name in mocks) return mocks[name];
      if (name.startsWith("@/") || name.startsWith(".")) {
        const target = name.startsWith("@/") ? resolve(frontend, name.slice(2)) : resolve(dirname(absolute), name);
        const alias = "@/" + target.slice(frontend.length + 1).replaceAll("\\", "/").replace(/\.tsx?$/, "");
        if (alias in mocks) return mocks[alias];
        return load(existsSync(target) ? target : existsSync(target + ".ts") ? target + ".ts" : target + ".tsx");
      }
      return frontendRequire(name);
    };
    runInNewContext(`(function(require, module, exports) { ${output}\n})`, { console, Date, ...globals })(requireModule, module, module.exports);
    return module.exports;
  }
  return load;
}

function hooks() {
  const states: any[] = [], refs: any[] = [], effects: any[] = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0;
  let pending: Array<() => void> = [];
  return {
    react: {
      useState(initial: any) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], (next: any) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      },
      useRef(initial: any) { return refs[refIndex++] ??= { current: initial }; },
      useMemo: (fn: () => any) => fn(),
      useEffect(fn: () => any, deps: any[]) {
        const index = effectIndex++;
        if (!effects[index] || deps.some((dep, i) => dep !== effects[index].deps[i])) {
          pending.push(() => { effects[index]?.cleanup?.(); effects[index] = { deps, cleanup: fn() }; });
        }
      },
    },
    render(component: (props: any) => any, props = {}) {
      stateIndex = refIndex = effectIndex = 0;
      const tree = component(props);
      const jobs = pending; pending = []; jobs.forEach(job => job());
      return tree;
    },
  };
}

function find(tree: any, predicate: (node: any) => boolean): any {
  if (!tree || typeof tree !== "object") return null;
  if (predicate(tree)) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) {
    const result = find(child, predicate); if (result) return result;
  }
  return null;
}
function text(tree: any): string {
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (!tree || typeof tree !== "object") return "";
  return [tree.props?.children].flat(Infinity).map(text).join("");
}
const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };

test("Pronunciation page hides practice and returns guests to login with a return destination", () => {
  const h = hooks(), redirects: string[] = [], storage = new Map<string, string>();
  const load = loader({
    react: h.react,
    "@/components/auth/AuthProvider": { useAuth: () => ({ user: null, loading: false }) },
    "next/navigation": { useRouter: () => ({ replace: (path: string) => redirects.push(path) }) },
  }, { window: { location: { pathname: "/pronunciation", search: "" } }, sessionStorage: { setItem: (key: string, value: string) => storage.set(key, value) } });
  const page = load("app/pronunciation/page.tsx").default();
  h.render(page.type, page.props);
  const protectedTree = h.render(page.type, page.props);
  assert.equal(find(protectedTree, node => node.type === page.props.children.type), null);
  assert.equal(redirects[0], "/login");
  assert.equal(storage.get("redirect_after_login"), "/pronunciation");
});

test("Guest progress requests are rejected before reading or writing the database", async () => {
  const route = loader({ "@/lib/auth": { getUserIdFromRequest: () => null }, "@/lib/prisma": { prisma: {} } })("app/api/progress/modules/route.ts");
  assert.equal((await route.GET({})).status, 401);
  assert.equal((await route.POST({ json: async () => ({ module: "pronunciation", itemId: firstId, completed: true }) })).status, 401);
});

test("Pronunciation progress persists under the signed-in account and cannot cross accounts", async () => {
  let currentUser = user.id;
  const records = new Map<string, any>();
  const route = loader({
    "@/lib/auth": { getUserIdFromRequest: () => currentUser },
    "@/lib/prisma": { prisma: { moduleProgress: {
      findUnique: async ({ where }: any) => records.get(JSON.stringify(where.userId_module_itemId)) ?? null,
      upsert: async ({ where, create }: any) => { records.set(JSON.stringify(where.userId_module_itemId), create); return create; },
      findMany: async ({ where }: any) => [...records.values()].filter(record => record.userId === where.userId),
    } } },
  })("app/api/progress/modules/route.ts");
  const saved = await route.POST({ json: async () => ({ module: "pronunciation", itemId: firstId, completed: true, countAttempt: true, userId: "someone-else" }) });
  assert.equal(saved.status, 200);
  const restored = (await (await route.GET({})).json()).progress;
  assert.equal(restored.length, 1); assert.equal(restored[0].userId, user.id);
  assert.equal(restored[0].itemId, firstId); assert.equal(restored[0].completed, true);
  currentUser = "learner-b";
  assert.equal((await (await route.GET({})).json()).progress.length, 0);
  assert.equal((await route.POST({ json: async () => ({ module: "pronunciation", itemId: "not-a-real-syllable", completed: true }) })).status, 400);
  assert.equal(records.size, 1);
});

test("A failed save is shown as an error and never marks an unpersisted syllable complete", async () => {
  const h = hooks(); let calls = 0;
  const client = loader({ react: h.react,
    "@/components/auth/AuthProvider": { useAuth: () => ({ user, refresh: async () => {} }) },
    "@/lib/moduleProgress": { loadCloudModuleProgress: async () => [], saveCloudModuleProgress: async () => { calls++; return null; } },
  })("components/pronunciation/PinyinPracticeClient.tsx").default;
  h.render(client); await flush();
  const button = find(h.render(client), node => node.type === "button" && text(node) === " Đánh dấu đã luyện");
  assert.ok(button); await button.props.onClick();
  const result = h.render(client);
  assert.equal(calls, 1);
  assert.ok(text(result).includes("Đã luyện 0/"));
  assert.ok(find(result, node => node.props?.role === "alert"));
});

test("Switching accounts ignores late progress from the previous account", async () => {
  const h = hooks(); let currentUser = user; const pending: Array<(rows: any[]) => void> = [];
  const client = loader({ react: h.react,
    "@/components/auth/AuthProvider": { useAuth: () => ({ user: currentUser, refresh: async () => {} }) },
    "@/lib/moduleProgress": { loadCloudModuleProgress: () => new Promise(resolve => pending.push(resolve)), saveCloudModuleProgress: async () => ({ ok: true }) },
  })("components/pronunciation/PinyinPracticeClient.tsx").default;
  h.render(client);
  currentUser = { ...user, id: "learner-b" };
  h.render(client);
  pending[1]([{ module: "pronunciation", itemId: firstId, completed: true }]); await flush();
  pending[0]([{ module: "pronunciation", itemId: firstId, completed: true }, { module: "pronunciation", itemId: secondId, completed: true }]); await flush();
  assert.ok(text(h.render(client)).includes("Đã luyện 1/"));
});

test("A successful save records the selected syllable and expired sessions cannot appear saved", async () => {
  const h = hooks(); let status = 200, refreshes = 0;
  const saved: Array<{ module: string; itemId: string; completed: boolean }> = [];
  const client = loader({ react: h.react,
    "@/components/auth/AuthProvider": { useAuth: () => ({ user, refresh: async () => { refreshes++; } }) },
    "@/lib/moduleProgress": {
      loadCloudModuleProgress: async () => [],
      saveCloudModuleProgress: async (module: string, itemId: string, values: any) => { saved.push({ module, itemId, ...values }); return { ok: status === 200, status }; },
    },
  })("components/pronunciation/PinyinPracticeClient.tsx").default;
  h.render(client); await flush();
  await find(h.render(client), node => node.type === "button" && text(node) === " Đánh dấu đã luyện").props.onClick();
  assert.equal(saved[0].module, "pronunciation"); assert.equal(saved[0].itemId, firstId);
  assert.equal(saved[0].completed, true); assert.ok(text(h.render(client)).includes("Đã luyện 1/"));
  const toneTwo = find(h.render(client), node => node.type === "button" && node.props.children === "má");
  assert.ok(toneTwo); toneTwo.props.onClick(); status = 401;
  await find(h.render(client), node => node.type === "button" && text(node) === " Đánh dấu đã luyện").props.onClick();
  assert.equal(refreshes, 1); assert.ok(text(h.render(client)).includes("Đã luyện 1/"));
});
