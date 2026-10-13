/**
 * Script xử lý dữ liệu HSK từ complete-hsk-vocabulary
 * Chuyển đổi từ format gốc sang format tối ưu cho ứng dụng
 * Output: public/data/hsk-new-{level}.json (mỗi file chứa mảng Lesson[])
 *
 * Chạy: node scripts/processData.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const HSK_DATA_ROOT = join(
  ROOT,
  "..",
  "complete-hsk-vocabulary-main",
  "complete-hsk-vocabulary-main",
  "wordlists",
  "exclusive",
  "new"
);
const OUT_DIR = join(ROOT, "public", "data");

mkdirSync(OUT_DIR, { recursive: true });

const WORDS_PER_LESSON = 20;
const LESSONS_PER_LEVEL = 15;

// Bản đồ nghĩa tiếng Việt placeholder cho các từ phổ biến (HSK 1)
// Trong thực tế nên dùng DB dịch tiếng Việt đầy đủ; đây là fallback tự động
const POS_VI = {
  v: "động từ",
  vn: "danh động từ",
  vd: "động từ trạng từ",
  vg: "hình vị động từ",
  n: "danh từ",
  ng: "hình vị danh từ",
  nr: "tên người",
  ns: "tên địa danh",
  nt: "tên tổ chức",
  nz: "danh từ riêng",
  a: "tính từ",
  ad: "tính từ trạng từ",
  an: "tính từ danh từ",
  ag: "hình vị tính từ",
  b: "tính từ bổ ngữ",
  d: "trạng từ",
  dg: "hình vị trạng từ",
  p: "giới từ",
  c: "liên từ",
  u: "trợ từ",
  m: "số từ",
  mg: "hình vị số từ",
  q: "lượng từ",
  r: "đại từ",
  rg: "hình vị đại từ",
  t: "từ thời gian",
  tg: "hình vị thời gian",
  f: "từ phương hướng",
  s: "từ không gian",
  i: "thành ngữ",
  j: "từ viết tắt",
  l: "cụm từ cố định",
  o: "từ tượng thanh",
  e: "thán từ",
  y: "trợ từ ngữ khí",
  k: "hậu tố",
  h: "tiền tố",
  g: "hình vị",
  w: "ký hiệu",
  x: "chưa phân loại",
  z: "từ miêu tả",
  mq: "số lượng từ",
};

/**
 * Lấy nghĩa đầu tiên phù hợp nhất (loại bỏ surname / variant entries)
 */
function getBestMeaning(forms) {
  for (const form of forms) {
    for (const meaning of form.meanings) {
      const low = meaning.toLowerCase();
      if (
        low.startsWith("surname") ||
        low.startsWith("old variant") ||
        low.startsWith("variant of")
      )
        continue;
      return meaning;
    }
  }
  // fallback: lấy cái đầu tiên
  return forms[0]?.meanings[0] ?? "";
}

/**
 * Lấy pinyin đầu tiên không phải surname
 */
function getBestPinyin(forms) {
  for (const form of forms) {
    const meanings = form.meanings.join(" ").toLowerCase();
    if (meanings.includes("surname")) continue;
    return form.transcriptions?.pinyin ?? "";
  }
  return forms[0]?.transcriptions?.pinyin ?? "";
}

/**
 * Lấy tất cả nghĩa của một từ (dùng cho flashcard)
 */
function getAllMeanings(forms) {
  const all = [];
  for (const form of forms) {
    for (const m of form.meanings) {
      const low = m.toLowerCase();
      if (
        !low.startsWith("surname") &&
        !low.startsWith("old variant") &&
        !low.startsWith("variant of")
      ) {
        all.push(m);
      }
    }
  }
  return all.slice(0, 5); // giới hạn 5 nghĩa
}

/**
 * Chuyển đổi 1 entry từ format gốc sang Word
 */
function convertWord(raw, index, level) {
  const form = raw.forms[0];
  const pinyin = getBestPinyin(raw.forms);
  const meaning = getBestMeaning(raw.forms);
  const allMeanings = getAllMeanings(raw.forms);
  const traditional = form?.traditional ?? raw.simplified;
  const classifiers = raw.forms.flatMap((f) => f.classifiers ?? []);

  return {
    id: `new-${level}-${index}`,
    simplified: raw.simplified,
    traditional: traditional !== raw.simplified ? traditional : undefined,
    pinyin,
    pinyinNumeric: form?.transcriptions?.numeric ?? "",
    meanings: allMeanings,
    meaning, // nghĩa ngắn gọn nhất
    meaningVi: "", // placeholder - điền sau bằng DB tiếng Việt
    pos: (raw.pos ?? []).map((p) => ({ code: p, label: POS_VI[p] ?? p })),
    radical: raw.radical ?? "",
    frequency: raw.frequency ?? 99999,
    classifiers: [...new Set(classifiers)],
    level: `new-${level}`,
    audioUrl: `/audio/new-${level}/${encodeURIComponent(raw.simplified)}.mp3`,
  };
}

/**
 * Chia mảng từ thành các bài học 20 từ/bài
 */
function buildLessons(words, level) {
  const lessons = [];
  const total = Math.min(words.length, WORDS_PER_LESSON * LESSONS_PER_LEVEL);

  for (let i = 0; i < LESSONS_PER_LEVEL; i++) {
    const start = i * WORDS_PER_LESSON;
    const end = start + WORDS_PER_LESSON;
    const slice = words.slice(start, end);
    if (slice.length === 0) break;

    lessons.push({
      id: `new-${level}-lesson-${i + 1}`,
      level: `new-${level}`,
      lessonNumber: i + 1,
      title: `Bài ${i + 1}`,
      description: `${slice.length} từ HSK ${level} mới (bài ${i + 1})`,
      words: slice,
      wordCount: slice.length,
    });
  }

  return lessons;
}

// ── Main processing ──────────────────────────────────────────────────────────

let totalWords = 0;
let totalLessons = 0;

for (let level = 1; level <= 7; level++) {
  const srcPath = join(HSK_DATA_ROOT, `${level}.json`);
  let raw;
  try {
    raw = JSON.parse(readFileSync(srcPath, "utf-8"));
  } catch (e) {
    console.error(`  ✗ Không đọc được: ${srcPath}`);
    continue;
  }

  // Sắp xếp theo frequency (phổ biến trước)
  const sorted = [...raw].sort((a, b) => (a.frequency ?? 99999) - (b.frequency ?? 99999));

  // Chỉ lấy đủ 300 từ cho 15 bài
  const capped = sorted.slice(0, WORDS_PER_LESSON * LESSONS_PER_LEVEL);

  const words = capped.map((w, i) => convertWord(w, i, level));
  const lessons = buildLessons(words, level);

  const out = {
    level: `new-${level}`,
    levelNumber: level,
    totalWords: words.length,
    totalLessons: lessons.length,
    lessons,
  };

  const outPath = join(OUT_DIR, `hsk-new-${level}.json`);
  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");

  totalWords += words.length;
  totalLessons += lessons.length;
  console.log(
    `  ✓ HSK new-${level}: ${lessons.length} bài, ${words.length} từ → ${outPath}`
  );
}

// Tạo file index tổng hợp
const levelIndex = Array.from({ length: 7 }, (_, i) => {
  const level = i + 1;
  return {
    level: `new-${level}`,
    levelNumber: level,
    label: `HSK ${level}`,
    dataFile: `/data/hsk-new-${level}.json`,
    totalLessons: LESSONS_PER_LEVEL,
    wordsPerLesson: WORDS_PER_LESSON,
  };
});

writeFileSync(
  join(OUT_DIR, "levels.json"),
  JSON.stringify(levelIndex, null, 2),
  "utf-8"
);

console.log(`\n✅ Xong! Tổng: ${totalLessons} bài, ${totalWords} từ`);
console.log(`   → public/data/levels.json`);
