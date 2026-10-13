import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const file = join(root, "lib/generatedHsk2Data.json");
const data = JSON.parse(readFileSync(file, "utf8"));
const env = readFileSync(join(root, ".env.local"), "utf8");
const apiKey = env.match(/^GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/m)?.[1];
const level1 = JSON.parse(readFileSync(join(root, "public/data/hsk-new-1.json"), "utf8"));
const level2 = JSON.parse(readFileSync(join(root, "public/data/hsk-new-2.json"), "utf8"));
const words1 = level1.lessons.flatMap((lesson) => lesson.words);
const words2 = level2.lessons.flatMap((lesson) => lesson.words);
const cumulative = new Set([...words1, ...words2].map((word) => word.simplified));
const source2 = new Set(words2.map((word) => word.simplified));

const seen = new Set();
const repairSlots = [];
for (const topic of data.topics) {
  topic.words.forEach((word, index) => {
    if (seen.has(word.hanzi) || !cumulative.has(word.hanzi)) repairSlots.push({ topicId: topic.id, topicTitle: topic.title, index, old: word.hanzi });
    else seen.add(word.hanzi);
  });
}

if (repairSlots.length) {
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY for repair");
  const unused = words2.filter((word) => !seen.has(word.simplified));
  const prompt = `Chỉ trả JSON hợp lệ. Hãy thay chính xác ${repairSlots.length} vị trí từ vựng bị trùng/sai cấp dưới đây bằng từ KHÁC NHAU trong danh sách cho phép. Chọn từ phù hợp nhất với chủ đề; không dùng lại từ cũ. Mỗi kết quả phải có slot (đúng số thứ tự), hanzi, pinyin có dấu, meaning tiếng Việt, example là câu tiếng Trung HSK 1-2 tự nhiên, exampleVi là bản dịch chính xác.\nVị trí: ${JSON.stringify(repairSlots.map((slot, index) => ({ slot: index, topic: slot.topicTitle, old: slot.old })))}\nDanh sách cho phép: ${unused.map((word) => `${word.simplified}(${word.pinyin})`).join("、")}\nJSON: [{"slot":0,"hanzi":"...","pinyin":"...","meaning":"...","example":"...","exampleVi":"..."}]`;
  const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
  const bySlot = new Map();
  const selectedWords = new Set(seen);
  for (const model of models) {
    for (let attempt = 0; attempt < 3 && bySlot.size < repairSlots.length; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.35, maxOutputTokens: 12000, responseMimeType: "application/json" } }) });
        if (!response.ok) continue;
        const payload = await response.json();
        const parsed = JSON.parse(payload.candidates[0].content.parts.map((part) => part.text ?? "").join(""));
        const candidates = Array.isArray(parsed) ? parsed : parsed.replacements;
        for (const item of candidates ?? []) {
          if (!Number.isInteger(item.slot) || item.slot < 0 || item.slot >= repairSlots.length || bySlot.has(item.slot)) continue;
          if (!source2.has(item.hanzi) || selectedWords.has(item.hanzi)) continue;
          bySlot.set(item.slot, item);
          selectedWords.add(item.hanzi);
        }
        console.log(`${model} attempt ${attempt + 1}: collected ${bySlot.size}/${repairSlots.length}`);
      } catch { /* thử model/lần tiếp theo */ }
    }
  }
  if (bySlot.size !== repairSlots.length) throw new Error(`Could not create all HSK 2 replacements (${bySlot.size}/${repairSlots.length})`);
  [...bySlot.entries()].forEach(([position, replacement]) => {
    const slot = repairSlots[position];
    Object.assign(data.topics.find((topic) => topic.id === slot.topicId).words[slot.index], replacement);
  });
}

// Cân bằng vị trí đáp án mà không thay đổi nội dung đáp án đúng.
for (const exam of data.exams) {
  exam.questions.forEach((question, index) => {
    const correct = question.options[question.answer];
    const rest = question.options.filter((_, optionIndex) => optionIndex !== question.answer);
    const target = index % 4;
    const options = rest.slice();
    options.splice(target, 0, correct);
    question.options = options;
    question.answer = target;
  });
}

writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Normalized HSK 2 data; repaired ${repairSlots.length} topic entries.`);
