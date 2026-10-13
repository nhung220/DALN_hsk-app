import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const file = join(process.cwd(), "lib/generatedHsk1Data.json");
const data = JSON.parse(readFileSync(file, "utf8"));

// 衣服 không nằm trong tệp HSK 1 của dự án; thay bằng 包 từ chính danh sách HSK 1.
for (const topic of data.topics) {
  const word = topic.words.find((item) => item.hanzi === "衣服");
  if (word) Object.assign(word, {
    hanzi: "包", pinyin: "bāo", meaning: "túi, cặp",
    example: "这个包是我的。", exampleVi: "Chiếc túi này là của tôi.",
  });
}

const replaceWord = (topicId, hanzi, replacement) => {
  const topic = data.topics.find((item) => item.id === topicId);
  const word = topic?.words.find((item) => item.hanzi === hanzi);
  if (word) Object.assign(word, replacement);
};

// Tránh lặp từ giữa chủ đề thời gian/thời tiết nhưng vẫn giữ mẫu câu HSK 1 hữu ích.
replaceWord("weather", "今天", { hanzi: "下", pinyin: "xià", meaning: "rơi; xuống", example: "今天下雨。", exampleVi: "Hôm nay trời mưa." });
replaceWord("weather", "昨天", { hanzi: "有", pinyin: "yǒu", meaning: "có", example: "今天有风。", exampleVi: "Hôm nay có gió." });
replaceWord("weather", "明天", { hanzi: "不", pinyin: "bù", meaning: "không", example: "今天不冷。", exampleVi: "Hôm nay không lạnh." });
replaceWord("weather", "大", { hanzi: "好", pinyin: "hǎo", meaning: "tốt, đẹp", example: "今天天气很好。", exampleVi: "Hôm nay thời tiết rất đẹp." });
replaceWord("clothes-colors", "穿", { hanzi: "多", pinyin: "duō", meaning: "nhiều", example: "这里的东西很多。", exampleVi: "Đồ ở đây rất nhiều." });

// Sửa một câu sinh ra các lựa chọn trùng nhau.
const badQuestion = data.exams.flatMap((exam) => exam.questions)
  .find((question) => question.prompt === "Chọn câu phủ định đúng:");
if (badQuestion) Object.assign(badQuestion, {
  options: ["我不是学生。", "我不学生。", "我是没学生。", "我学生不是。"],
  answer: 0,
  explanation: "Phủ định câu vị ngữ 是 đặt 不 ngay trước 是: 我不是学生。",
});

// Giữ nguyên đáp án đúng nhưng xoay vị trí để A/B/C/D cân bằng chính xác.
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
console.log("Normalized HSK 1 expansion data");
