/**
 * translateVi.mjs — Dịch meaningVi bằng Groq API (Llama 3.3 70B, free tier)
 * Chạy: node scripts/translateVi.mjs --key gsk_xxxx
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const DATA_DIR  = join(ROOT, "public", "data");
const CHECKPOINT = join(ROOT, "scripts", ".vi_checkpoint.json");

// ── key ───────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const keyIdx  = args.indexOf("--key");
const API_KEY = keyIdx >= 0 ? args[keyIdx + 1] : process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error("❌  node scripts/translateVi.mjs --key gsk_xxxx");
  process.exit(1);
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL    = "qwen/qwen3.8-27b";
const BATCH    = 40;   // từ/request — Groq nhanh nên có thể dùng 40
const DELAY    = 3000;  // ms giữa batch — tăng để tránh rate limit Groq free tier
const RETRY    = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── checkpoint ────────────────────────────────────────────────────────────────
function loadCP() {
  if (!existsSync(CHECKPOINT)) return {};
  try {
    return JSON.parse(new TextDecoder("utf-8").decode(readFileSync(CHECKPOINT)));
  } catch { return {}; }
}

function saveCP(cp) {
  writeFileSync(CHECKPOINT, Buffer.from(JSON.stringify(cp, null, 2), "utf8"));
}

// ── translate batch ───────────────────────────────────────────────────────────
async function translateBatch(words, attempt = 0) {
  const list = words
    .map((w, i) => `${i + 1}. [${w.simplified}] ${w.meaning}`)
    .join("\n");

  const prompt =
    `Bạn là từ điển Hán-Việt chuyên nghiệp. Dịch nghĩa tiếng Việt ngắn gọn (≤6 từ) cho mỗi từ.\n` +
    `Trả về JSON duy nhất: {"1":"nghĩa","2":"nghĩa",...}  Không giải thích thêm.\n\n${list}`;

  const body = {
    model:       MODEL,
    messages:    [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens:  800,
  };

  try {
    const res = await fetch(GROQ_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 150)}`);
    }

    const json    = await res.json();
    let content   = json.choices?.[0]?.message?.content ?? "{}";

    // Qwen3 đôi khi thêm <think>...</think> trước JSON — strip ra
    content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Extract JSON block
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);

    const out = {};
    words.forEach((w, i) => {
      const vi = (parsed[String(i + 1)] || "").trim();
      if (vi) out[w.id] = vi;
    });
    return out;

  } catch (err) {
    if (attempt < RETRY) {
      // Tăng wait time nhiều hơn cho 429
      const wait = err.message?.includes("429") ? 12000 * (attempt + 1) : 2000 * (attempt + 1);
      console.warn(`\n  ⚠  Retry ${attempt + 1}/${RETRY} (${wait}ms): ${err.message.slice(0, 100)}`);
      await sleep(wait);
      return translateBatch(words, attempt + 1);
    }
    console.error(`\n  ✗  Bỏ qua batch: ${err.message.slice(0, 100)}`);
    return {};
  }
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🀄  HSK Vietnamese Translation  |  Groq + Llama 3.3 70B (free)");
  const cp      = loadCP();
  const already = Object.keys(cp).length;
  console.log(`   Checkpoint: ${already} từ đã có\n`);

  let grandNew = 0;

  for (let lv = 1; lv <= 7; lv++) {
    const filePath = join(DATA_DIR, `hsk-new-${lv}.json`);
    const data     = JSON.parse(
      new TextDecoder("utf-8").decode(readFileSync(filePath))
    );
    const allWords = data.lessons.flatMap((l) => l.words);

    const todo = allWords
      .filter((w) => !cp[w.id])
      .map((w) => ({
        id:         w.id,
        simplified: w.simplified,
        meaning:    w.meaning.split(";")[0].replace(/\(.*?\)/g, "").trim(),
      }));

    if (todo.length === 0) {
      let applied = 0;
      for (const w of allWords) { if (cp[w.id]) { w.meaningVi = cp[w.id]; applied++; } }
      writeFileSync(filePath, Buffer.from(JSON.stringify(data, null, 2), "utf8"));
      console.log(`✓  HSK ${lv}: đã xong — ghi ${applied} từ vào JSON`);
      continue;
    }

    console.log(`📖  HSK ${lv}: ${todo.length} từ cần dịch`);

    const batches = [];
    for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));

    let lvNew = 0;
    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi];
      process.stdout.write(`   Batch ${bi + 1}/${batches.length} (${batch.length} từ)... `);

      const result = await translateBatch(batch);
      const got    = Object.keys(result).length;
      process.stdout.write(`✓ ${got} nghĩa\n`);

      Object.assign(cp, result);
      saveCP(cp);
      lvNew    += got;
      grandNew += got;

      if (bi < batches.length - 1) await sleep(DELAY);
    }

    // Ghi kết quả vào JSON
    let applied = 0;
    for (const w of allWords) {
      if (cp[w.id]) { w.meaningVi = cp[w.id]; applied++; }
    }
    writeFileSync(filePath, Buffer.from(JSON.stringify(data, null, 2), "utf8"));
    console.log(`   → Ghi ${applied} từ vào hsk-new-${lv}.json  (${lvNew} từ mới)\n`);
  }

  console.log(`\n✅  Xong!  Dịch mới: ${grandNew} | Tổng: ${Object.keys(cp).length}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
