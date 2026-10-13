import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const data = JSON.parse(readFileSync(join(root, "lib/generatedHsk2Data.json"), "utf8"));
const hsk1 = JSON.parse(readFileSync(join(root, "public/data/hsk-new-1.json"), "utf8"));
const hsk2 = JSON.parse(readFileSync(join(root, "public/data/hsk-new-2.json"), "utf8"));
const allowed = new Set([...hsk1.lessons, ...hsk2.lessons].flatMap((lesson) => lesson.words).map((word) => word.simplified));
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const unique = (items) => new Set(items).size === items.length;
const validQuestion = (question) => question.options.length === 4 && unique(question.options)
  && Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4;
const hasVietnameseExplanation = (question) => /[À-ỹ]/.test(question.explanation);

assert(data.topics.length === 9, "Phải có 9 chủ đề HSK 2 mở rộng");
const words = data.topics.flatMap((topic) => topic.words);
assert(words.length === 90 && unique(words.map((word) => word.hanzi)), "90 mục từ HSK 2 phải khác nhau");
for (const word of words) {
  assert(allowed.has(word.hanzi), `Từ ngoài nguồn HSK 1-2: ${word.hanzi}`);
  assert(word.pinyin && word.meaning && word.example && word.exampleVi, `Từ thiếu dữ liệu: ${word.hanzi}`);
}

assert(data.readings.length === 14 && unique(data.readings.map((item) => item.id)), "Bài đọc HSK 2 thiếu hoặc trùng ID");
for (const lesson of data.readings) {
  assert(lesson.level === 2 && lesson.questions.length === 3 && lesson.vocabulary.length === 4, `Sai cấu trúc bài đọc: ${lesson.id}`);
  assert(!/[A-Za-zÀ-ỹ]/.test(lesson.passage), `Bài đọc lẫn ký tự Latin: ${lesson.id}`);
  assert(lesson.questions.every(validQuestion), `Câu hỏi bài đọc không hợp lệ: ${lesson.id}`);
  assert(lesson.questions.every(hasVietnameseExplanation), `Lời giải bài đọc chưa có tiếng Việt: ${lesson.id}`);
}

assert(data.dialogues.length === 13 && unique(data.dialogues.map((item) => item.id)), "Hội thoại HSK 2 thiếu hoặc trùng ID");
for (const dialogue of data.dialogues) {
  assert(dialogue.level === 2 && dialogue.lines.length >= 5 && dialogue.lines.length <= 7, `Sai cấu trúc hội thoại: ${dialogue.id}`);
  assert(dialogue.lines.every((line) => !/[A-Za-zÀ-ỹ]/.test(line.zh)), `Hội thoại lẫn ký tự Latin: ${dialogue.id}`);
  assert(validQuestion(dialogue.challenge), `Thử thách hội thoại không hợp lệ: ${dialogue.id}`);
  assert(hasVietnameseExplanation(dialogue.challenge), `Lời giải hội thoại chưa có tiếng Việt: ${dialogue.id}`);
}

const sections = new Set(["\u0054\u1eeb\u0020\u0076\u1ef1\u006e\u0067", "\u004e\u0067\u1eef\u0020\u0070\u0068\u00e1\u0070", "\u0110\u1ecd\u0063\u0020\u0068\u0069\u1ec3\u0075"]);
assert(data.exams.length === 3 && unique(data.exams.map((item) => item.id)), "Đề HSK 2 thiếu hoặc trùng ID");
for (const exam of data.exams) {
  assert(exam.level === 2 && exam.questions.length === 30, `Sai cấu trúc đề: ${exam.id}`);
  const distribution = [0, 0, 0, 0];
  const sectionCount = new Map();
  for (const question of exam.questions) {
    assert(sections.has(question.section) && validQuestion(question), `Câu đề thi không hợp lệ: ${exam.id}`);
    assert(hasVietnameseExplanation(question), `Lời giải đề thi chưa có tiếng Việt: ${exam.id}`);
    distribution[question.answer]++;
    sectionCount.set(question.section, (sectionCount.get(question.section) ?? 0) + 1);
  }
  assert(Math.max(...distribution) - Math.min(...distribution) <= 1, `Đáp án mất cân bằng: ${exam.id}`);
  assert([...sectionCount.values()].every((count) => count === 10), `Các phần thi không đủ 10 câu: ${exam.id}`);
}

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`HSK 2 hợp lệ: ${words.length} từ, ${data.readings.length} bài đọc, ${data.dialogues.length} hội thoại, ${data.exams.length} đề/${data.exams.flatMap((exam) => exam.questions).length} câu.`);
