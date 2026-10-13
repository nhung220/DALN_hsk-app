/**
 * Merge grammar_points.json (regex patterns) vào grammar-hsk-N.json hiện có
 *
 * Input:
 *   - public/data/grammar-hsk-N.json        (từ Chinese-Grammar-master)
 *   - hsk-sentences-audio/grammar_points.json (regex patterns)
 *
 * Output:
 *   - public/data/grammar-hsk-N.json        (updated: thêm field "detect" vào mỗi point nếu match)
 *   - public/data/grammar-patterns.json     (file riêng cho AI tutor, tất cả levels)
 *
 * Match logic: so sánh label của pattern với title của grammar point
 * Fallback: match theo keyword trong label
 *
 * Chạy: node scripts/mergeGrammarPatterns.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "public", "data");
const PATTERNS_SRC = join(
  ROOT, "..", "..",
  "hsk-sentences-audio-main", "hsk-sentences-audio-main",
  "data", "grammar_points.json"
);

// ── Load source patterns ──────────────────────────────────────────────────────

const rawPatterns = JSON.parse(readFileSync(PATTERNS_SRC, "utf8"));

// Chỉ lấy những points có pattern (70 points)
const validPatterns = rawPatterns.filter(p => p.pattern && p.pattern.trim());

console.log(`Loaded ${rawPatterns.length} grammar points, ${validPatterns.length} with regex patterns`);

// ── Build master patterns file cho AI tutor ──────────────────────────────────
// Format tối ưu cho detect: flat array, mỗi entry đủ để detect + explain

const masterPatterns = validPatterns.map(p => ({
  id: p.id,
  level: p.level,
  label: p.label,           // tiếng Trung (ngắn)
  label_full: p.label_full, // tiếng Trung (đầy đủ)
  pattern: p.pattern,       // regex string
  exclude: p.exclude || null,
  examples: p.examples || [],
}));

const masterOut = {
  total: masterPatterns.length,
  note: "Regex patterns để detect điểm ngữ pháp trong câu tiếng Trung. Chỉ HSK1-2 có pattern. Dùng cho AI tutor chấm ngữ pháp.",
  patterns: masterPatterns,
};

writeFileSync(
  join(DATA_DIR, "grammar-patterns.json"),
  JSON.stringify(masterOut, null, 2),
  "utf-8"
);
console.log(`\n✓ Saved grammar-patterns.json (${masterPatterns.length} patterns)`);

// ── Verify patterns compile as valid RegExp ──────────────────────────────────

console.log("\n=== REGEX VALIDATION ===");
let validCount = 0;
let invalidCount = 0;

for (const p of masterPatterns) {
  try {
    new RegExp(p.pattern, "u");
    validCount++;
  } catch (e) {
    console.error(`  ✗ INVALID: ${p.id} | ${p.label} | pattern: ${p.pattern}`);
    console.error(`    Error: ${e.message}`);
    invalidCount++;
  }
}
console.log(`  ✓ Valid: ${validCount}, ✗ Invalid: ${invalidCount}`);

// ── Update grammar-hsk-N.json: thêm field "patternId" vào points nếu match ───
// Hiện tại không merge vào grammar points vì label language khác nhau (EN vs ZH)
// Thay vào đó tạo file riêng là đủ cho AI tutor

console.log("\n=== SUMMARY ===");
console.log("grammar-patterns.json → dùng cho AI tutor detect ngữ pháp");
console.log("grammar-hsk-N.json    → giữ nguyên (Chinese-Grammar-master data)");

// ── Log sample để verify ──────────────────────────────────────────────────────

console.log("\n=== SAMPLE PATTERNS (first 5) ===");
masterPatterns.slice(0, 5).forEach(p => {
  const testCases = p.examples.map(ex => {
    try {
      const re = new RegExp(p.pattern, "u");
      const excRe = p.exclude ? new RegExp(p.exclude, "u") : null;
      const matched = re.test(ex) && (!excRe || !excRe.test(ex));
      return `${ex} → ${matched ? "✓" : "✗"}`;
    } catch {
      return `${ex} → ERR`;
    }
  });
  console.log(`\n[${p.id}] ${p.label}`);
  console.log(`  pattern: ${p.pattern}`);
  if (p.exclude) console.log(`  exclude: ${p.exclude}`);
  testCases.forEach(t => console.log(`  test: ${t}`));
});

console.log("\n✅ Done!");
