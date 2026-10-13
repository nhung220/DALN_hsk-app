/**
 * Script xử lý dữ liệu ngữ pháp từ Chinese-Grammar-master
 * Input:  ../../Chinese-Grammar-master/Chinese-Grammar-master/CSV Files HSK1 - HSK6/hskN.csv
 * Output: public/data/grammar-hsk-N.json
 *
 * Cấu trúc CSV (không có header):
 *   Split | Chinese | Pinyin | Translation | Sound | Structure(s) | UsedFor | Title | URL
 *
 * Chạy: node scripts/processGrammar.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_DIR = join(
  ROOT, "..", "..",
  "Chinese-Grammar-master", "Chinese-Grammar-master",
  "CSV Files HSK1 - HSK6"
);
const OUT_DIR = join(ROOT, "public", "data");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const fields = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

function cleanUsedFor(raw) {
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

/**
 * Chuẩn hóa split string cho game sắp xếp câu:
 * - Loại bỏ dấu câu đứng riêng ("。" "？" "！" "，") — gắn vào từ trước hoặc bỏ hẳn
 * - Trả về mảng tokens sạch (≥2 tokens để có thể chơi)
 */
function buildSortTokens(splitStr) {
  const PUNCT = /^[。，？！、：；…]$/;
  const rawTokens = splitStr.split(/\s+/).filter(Boolean);

  // Gắn dấu câu cuối vào token trước nó, bỏ dấu câu ở giữa
  const tokens = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const t = rawTokens[i];
    if (PUNCT.test(t)) {
      // Gắn vào token trước nếu đang ở cuối câu (≥ 80% vị trí)
      if (tokens.length > 0 && i >= rawTokens.length - 2) {
        tokens[tokens.length - 1] += t;
      }
      // Bỏ dấu câu ở giữa câu
    } else {
      tokens.push(t);
    }
  }
  return tokens;
}

// ── Xử lý từng level ─────────────────────────────────────────────────────────

const LEVELS = [1, 2, 3, 4, 5, 6];

let grandTotal = 0;

for (const levelNum of LEVELS) {
  const csvPath = join(CSV_DIR, `hsk${levelNum}.csv`);
  let raw = readFileSync(csvPath, "utf8");
  // Strip BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  const lines = raw.split("\n").filter(l => l.trim());

  const pointMap = new Map();
  let skipped = 0;

  for (const line of lines) {
    const fields = parseCSVLine(line);
    if (fields.length < 8) continue;

    const [splitRaw, chinese, pinyin, translation, , structureRaw, usedForRaw, title, url] = fields;

    if (!chinese || !chinese.trim()) continue;
    if (!title || !title.trim()) continue;

    const titleKey = title.trim();

    if (!pointMap.has(titleKey)) {
      const idx = String(pointMap.size + 1).padStart(3, "0");
      pointMap.set(titleKey, {
        id: `grammar-${levelNum}-${idx}`,
        title: titleKey,
        structures: new Set(),
        usedFor: new Set(),
        url: (url || "").trim(),
        examples: [],
      });
    }

    const point = pointMap.get(titleKey);
    const pointIdx = String(pointMap.size).padStart(3, "0");

    // Structures — strip "::" wrappers
    if (structureRaw) {
      const structs = structureRaw
        .split("::")
        .map(s => s.trim())
        .filter(Boolean);
      structs.forEach(s => point.structures.add(s));
    }

    // UsedFor
    if (usedForRaw) {
      cleanUsedFor(usedForRaw).forEach(u => point.usedFor.add(u));
    }

    // Build sort tokens — dùng split field nếu có, fallback chinese
    const rawSplit = (splitRaw || chinese).trim();
    const sortTokens = buildSortTokens(rawSplit);

    // Bỏ qua câu quá ngắn (≤1 token) — không dùng được cho sort game
    if (sortTokens.length <= 1) {
      skipped++;
      continue;
    }

    const exIdx = point.examples.length;
    point.examples.push({
      id: `grammar-${levelNum}-${pointIdx}-${exIdx}`,
      // tokens: mảng từ sạch cho sort game (≥2 phần tử, không có dấu câu riêng)
      tokens: sortTokens,
      // chinese: câu gốc đầy đủ (dùng để hiển thị + TTS)
      chinese: chinese.trim(),
      pinyin: pinyin.trim(),
      translation: translation.trim(),
    });
  }

  // Lọc bỏ points không có example nào (sau khi skip)
  const points = Array.from(pointMap.values())
    .filter(p => p.examples.length > 0)
    .map(p => ({
      ...p,
      structures: Array.from(p.structures),
      usedFor: Array.from(p.usedFor),
    }));

  const totalExamples = points.reduce((s, p) => s + p.examples.length, 0);
  grandTotal += totalExamples;

  const output = {
    level: `new-${levelNum}`,
    levelNumber: levelNum,
    totalPoints: points.length,
    totalExamples,
    points,
  };

  const outPath = join(OUT_DIR, `grammar-hsk-${levelNum}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    `✓ HSK${levelNum}: ${points.length} points, ${totalExamples} examples` +
    (skipped > 0 ? ` (${skipped} skipped — too short)` : "") +
    ` → grammar-hsk-${levelNum}.json`
  );
}

console.log(`\n✅ Done! Grand total: ${grandTotal} examples`);
