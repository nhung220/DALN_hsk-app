import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const data = JSON.parse(readFileSync(join(root, "lib/generatedHsk1Data.json"), "utf8"));
const hsk = JSON.parse(readFileSync(join(root, "public/data/hsk-new-1.json"), "utf8"));
const allowed = new Set(hsk.lessons.flatMap((lesson) => lesson.words).map((word) => word.simplified));
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const unique = (items) => new Set(items).size === items.length;
const validQuestion = (question) => question.options.length === 4
  && unique(question.options)
  && Number.isInteger(question.answer)
  && question.answer >= 0
  && question.answer < 4;

assert(data.topics.length === 8, "Phải có 8 chủ đề mở rộng");
const words = data.topics.flatMap((topic) => topic.words);
assert(words.length === 80, "Phải có 80 mục từ mở rộng");
assert(new Set(words.map((word) => word.hanzi)).size >= 77, "Quá nhiều từ trùng giữa các chủ đề");
for (const word of words) {
  assert(allowed.has(word.hanzi), `Từ không thuộc nguồn HSK 1: ${word.hanzi}`);
  assert(word.pinyin && word.meaning && word.example && word.exampleVi, `Từ thiếu dữ liệu: ${word.hanzi}`);
}

assert(data.readings.length === 13 && unique(data.readings.map((item) => item.id)), "Bài đọc thiếu hoặc trùng ID");
for (const lesson of data.readings) {
  assert(lesson.level === 1 && lesson.questions.length === 2 && lesson.vocabulary.length === 3, `Sai cấu trúc bài đọc: ${lesson.id}`);
  assert(!/[A-Za-zÀ-ỹ]/.test(lesson.passage), `Bài đọc lẫn ký tự Latin: ${lesson.id}`);
  assert(lesson.questions.every(validQuestion), `Câu hỏi bài đọc không hợp lệ: ${lesson.id}`);
}

assert(data.dialogues.length === 13 && unique(data.dialogues.map((item) => item.id)), "Hội thoại thiếu hoặc trùng ID");
for (const dialogue of data.dialogues) {
  assert(dialogue.level === 1 && dialogue.lines.length >= 3 && dialogue.lines.length <= 5, `Sai cấu trúc hội thoại: ${dialogue.id}`);
  assert(dialogue.lines.every((line) => !/[A-Za-zÀ-ỹ]/.test(line.zh)), `Hội thoại lẫn ký tự Latin: ${dialogue.id}`);
  assert(validQuestion(dialogue.challenge), `Thử thách hội thoại không hợp lệ: ${dialogue.id}`);
}

const sections = new Set(["\u0054\u1eeb\u0020\u0076\u1ef1\u006e\u0067", "\u004e\u0067\u1eef\u0020\u0070\u0068\u00e1\u0070", "\u0110\u1ecd\u0063\u0020\u0068\u0069\u1ec3\u0075"]);
assert(data.exams.length === 3 && unique(data.exams.map((item) => item.id)), "Đề thi thiếu hoặc trùng ID");
for (const exam of data.exams) {
  assert(exam.questions.length === 30, `Đề không đủ 30 câu: ${exam.id}`);
  const distribution = [0, 0, 0, 0];
  for (const question of exam.questions) {
    assert(sections.has(question.section), `Nhóm câu hỏi không hợp lệ: ${exam.id}`);
    assert(validQuestion(question), `Câu hỏi không hợp lệ: ${exam.id}`);
    distribution[question.answer]++;
  }
  assert(Math.max(...distribution) - Math.min(...distribution) <= 1, `Đáp án A/B/C/D mất cân bằng: ${exam.id}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Dữ liệu hợp lệ: ${words.length} mục từ, ${data.readings.length} bài đọc, ${data.dialogues.length} hội thoại, ${data.exams.length} đề/${data.exams.flatMap((exam) => exam.questions).length} câu.`);
