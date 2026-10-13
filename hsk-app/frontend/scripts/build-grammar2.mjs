import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_DIR = path.join(__dirname, "tmp_csv");
const OUT_DIR = path.join(__dirname, "../public/data");

function parseCSVLine(line) {
  const cols = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { cols.push(cur); cur = ""; continue; }
    cur += ch;
  }
  cols.push(cur);
  return cols;
}

for (let level = 1; level <= 6; level++) {
  const file = path.join(CSV_DIR, `hsk${level}.csv`);
  if (!fs.existsSync(file)) { console.warn(`Missing hsk${level}.csv`); continue; }

  // Đọc bằng Buffer rồi decode thủ công
  const buf = fs.readFileSync(file);
  // Bỏ BOM nếu có
  const start = (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) ? 3 : 0;
  const text = buf.slice(start).toString("utf8");
  const lines = text.split(/\r?\n/).filter(l => l.trim());

  const pointMap = new Map();
  const order = [];

  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (cols.length < 8) continue;

    const chinese     = cols[1]?.trim();
    if (!chinese) continue;

    const tokensSpaced = cols[0]?.trim() ?? "";
    const pinyin       = cols[2]?.trim() ?? "";
    const translation  = cols[3]?.trim() ?? "";
    const structure    = (cols[5]?.trim() ?? "").replace(/^::\s*|\s*::$/g, "").trim();
    const usedFor      = (cols[6]?.trim() ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const title        = cols[7]?.trim() ?? "";
    const url          = cols[8]?.trim() ?? "";

    const key = `${title}|||${structure}`;
    if (!pointMap.has(key)) {
      const urlId = url.match(/\/grammar\/([A-Z0-9]+)/)?.[1] ?? "";
      const slug  = urlId || title.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 20);
      pointMap.set(key, {
        id: `${level}-${slug}`,
        title,
        structures: structure ? [structure] : [],
        usedFor,
        url,
        examples: [],
      });
      order.push(key);
    }

    const pt = pointMap.get(key);
    const tokens = tokensSpaced.split(/\s+/).filter(Boolean);
    pt.examples.push({
      id: `ex-${pt.examples.length + 1}`,
      tokens,
      chinese,
      pinyin,
      translation,
    });
  }

  const points = order.map(k => pointMap.get(k));
  const totalExamples = points.reduce((s, p) => s + p.examples.length, 0);

  const out = { level: `HSK ${level}`, levelNumber: level, totalPoints: points.length, totalExamples, points };
  const json = JSON.stringify(out, null, 2);
  fs.writeFileSync(path.join(OUT_DIR, `grammar-hsk-${level}.json`), json, "utf8");
  console.log(`grammar-hsk-${level}.json: ${points.length} points, ${totalExamples} examples`);
}
console.log("Done");
