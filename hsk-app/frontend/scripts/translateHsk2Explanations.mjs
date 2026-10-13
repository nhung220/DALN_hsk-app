import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const file = join(root, "lib/generatedHsk2Data.json");
const data = JSON.parse(readFileSync(file, "utf8"));
const env = readFileSync(join(root, ".env.local"), "utf8");
const apiKey = env.match(/^GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/m)?.[1];
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

const groups = [
  data.readings.flatMap((lesson) => lesson.questions.map((question, index) => ({ key: `reading:${lesson.id}:${index}`, question }))),
  data.dialogues.map((dialogue) => ({ key: `dialogue:${dialogue.id}`, question: dialogue.challenge })),
  data.exams.flatMap((exam) => exam.questions.map((question, index) => ({ key: `exam:${exam.id}:${index}`, question }))),
];
const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

for (const group of groups) {
  const pending = group.filter(({ question }) => !/[À-ỹ]/.test(question.explanation));
  if (!pending.length) continue;
  const prompt = `Chỉ trả JSON array. Dịch explanation sang tiếng Việt tự nhiên, ngắn gọn và chính xác. Giữ nguyên các câu/chữ tiếng Trung trong dấu nháy làm dẫn chứng. Không sửa key, không thêm mục. Dữ liệu: ${JSON.stringify(pending.map(({ key, question }) => ({ key, explanation: question.explanation })))}`;
  let translated;
  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 16000, responseMimeType: "application/json" } }) });
      if (!response.ok) continue;
      const payload = await response.json();
      const parsed = JSON.parse(payload.candidates[0].content.parts.map((part) => part.text ?? "").join(""));
      const candidate = Array.isArray(parsed) ? parsed : parsed.translations;
      if (candidate?.length === pending.length && candidate.every((item) => item.key && item.explanation)) { translated = candidate; break; }
    } catch { /* thử model tiếp theo */ }
  }
  if (!translated) throw new Error(`Could not translate ${pending.length} explanations`);
  const map = new Map(translated.map((item) => [item.key, item.explanation]));
  for (const item of pending) item.question.explanation = map.get(item.key);
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Translated ${pending.length} explanations`);
}
