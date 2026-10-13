/**
 * Script: chuyển CSV grammar + grammar_points.json → grammar-hsk-N.json
 * Chạy: node scripts/build-grammar.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const CSV_DIR    = path.join(__dirname, "tmp_csv");
const GP_FILE    = path.join("D:/Downloads/DOANLN/data/hsk-sentences-audio-main/hsk-sentences-audio-main/data/grammar_points.json");
const OUT_DIR    = path.join(ROOT, "public/data");

// ─── Parse CSV ───────────────────────────────────────────────────────────────
// Columns: tokens_spaced | chinese | pinyin | translation | audio | structure | usedFor | title | url

function parseCSV(raw) {
  const rows = [];
  // split thô theo dòng, bỏ header nếu có
  const lines = raw.split("\n").filter(l => l.trim());
  for (const line of lines) {
    // tách đúng CSV có thể có dấu phẩy trong ngoặc kép
    const cols = splitCSVLine(line);
    if (cols.length < 8) continue;
    rows.push({
      tokensSpaced: cols[0]?.trim() ?? "",
      chinese:      cols[1]?.trim() ?? "",
      pinyin:       cols[2]?.trim() ?? "",
      translation:  cols[3]?.trim() ?? "",
      // cols[4] = audio — bỏ qua
      structure:    cols[5]?.trim().replace(/^::\s*|\s*::$/g, "").trim() ?? "",
      usedFor:      cols[6]?.trim().replace(/^"|"$/g, "").split(",").map(s => s.trim()).filter(Boolean) ?? [],
      title:        cols[7]?.trim().replace(/^"|"$/g, "") ?? "",
      url:          cols[8]?.trim() ?? "",
    });
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { result.push(cur); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const grammarPoints = JSON.parse(fs.readFileSync(GP_FILE, "utf-8"));

for (let level = 1; level <= 6; level++) {
  const csvFile = path.join(CSV_DIR, `hsk${level}.csv`);
  if (!fs.existsSync(csvFile)) {
    console.warn(`Missing: ${csvFile}`);
    continue;
  }

  const rawBuf = fs.readFileSync(csvFile);
  // Bỏ BOM nếu có (EF BB BF)
  const raw = rawBuf[0] === 0xEF && rawBuf[1] === 0xBB && rawBuf[2] === 0xBF
    ? rawBuf.slice(3).toString("utf-8")
    : rawBuf.toString("utf-8");
  const rows = parseCSV(raw);

  // Group rows by (title + structure) → grammar point
  const pointMap = new Map();
  for (const row of rows) {
    if (!row.chinese) continue;
    const key = `${row.title}|||${row.structure}`;
    if (!pointMap.has(key)) {
      // Tìm id từ grammar_points.json nếu có
      const gp = grammarPoints.find(g =>
        g.level === level &&
        (g.label === row.title || g.label_full?.includes(row.title))
      );

      // Tạo id slug từ url hoặc title
      const urlId = row.url?.match(/grammar\/([A-Z0-9]+)$/)?.[1] ?? "";
      const slugId = urlId || row.title
        .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 30);

      pointMap.set(key, {
        id:         gp?.id ?? `${level}-${slugId}`,
        title:      row.title,
        structures: row.structure ? [row.structure] : [],
        usedFor:    row.usedFor,
        url:        row.url ?? "",
        examples:   [],
      });
    }

    const point = pointMap.get(key);
    // tokens: tách từ tokensSpaced
    const tokens = row.tokensSpaced
      .split(/\s+/)
      .filter(Boolean);

    point.examples.push({
      id:          `ex-${point.examples.length + 1}`,
      tokens,
      chinese:     row.chinese,
      pinyin:      row.pinyin,
      translation: row.translation,
    });
  }

  const points = Array.from(pointMap.values());
  const totalExamples = points.reduce((s, p) => s + p.examples.length, 0);

  const output = {
    level:         `HSK ${level}`,
    levelNumber:   level,
    totalPoints:   points.length,
    totalExamples,
    points,
  };

  const outFile = path.join(OUT_DIR, `grammar-hsk-${level}.json`);
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✓ grammar-hsk-${level}.json — ${points.length} points, ${totalExamples} examples`);
}

console.log("Done.");
