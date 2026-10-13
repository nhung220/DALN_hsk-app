import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const env = readFileSync(join(root, ".env.local"), "utf8");
const apiKey = env.match(/^GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/m)?.[1];
if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env.local");

const hsk = JSON.parse(readFileSync(join(root, "public/data/hsk-new-1.json"), "utf8"));
const allowedWords = hsk.lessons.flatMap((lesson) => lesson.words).map((word) => word.simplified);
const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate(prompt) {
  let lastError;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 32000, responseMimeType: "application/json" } }),
        });
        if (!response.ok) throw new Error(`${model} HTTP ${response.status}: ${await response.text()}`);
        const payload = await response.json();
        const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
        if (!text) throw new Error(`${model} returned empty content`);
        return JSON.parse(text.replace(/^```json\s*|```$/g, "").trim());
      } catch (error) { lastError = error; await wait(1500 * (attempt + 1)); }
    }
  }
  throw lastError;
}

const common = `Bạn là chuyên gia biên soạn giáo trình tiếng Trung cho người Việt. Chỉ trả JSON hợp lệ, không markdown. Nội dung phải tự nhiên, chính xác, không có tiếng Anh. Cấp HSK 1 theo HSK 3.0; câu ngắn, ngữ pháp cơ bản. Không sao chép đề thi chính thức.`;

const topicSpecs = [
  ["numbers-time", "Số đếm và thời gian", "🔢"], ["daily-life", "Sinh hoạt hàng ngày", "☀️"],
  ["places", "Địa điểm", "🏙️"], ["transport", "Phương tiện", "🚌"],
  ["weather", "Thời tiết", "🌤️"], ["body-health", "Cơ thể và sức khỏe", "❤️"],
  ["clothes-colors", "Quần áo và màu sắc", "👕"], ["hobbies", "Sở thích", "🎨"],
];

const topics = [];
for (const [id, title, icon] of topicSpecs) {
  topics.push(await generate(`${common}\nTạo 1 chủ đề từ vựng: id=${id}, title=${title}, icon=${icon}. Chính xác 10 từ/cụm từ KHÁC NHAU, chỉ chọn từ có trong danh sách cho phép sau: ${allowedWords.join("、")}. Không dùng các từ: 你好、再见、谢谢、不客气、对不起、没关系、请问、认识、家、爸爸、妈妈、哥哥、姐姐、弟弟、妹妹、父母、米饭、面条、饺子、蔬菜、水果、茶、菜单、买单. JSON: {"id":"...","title":"...","icon":"...","description":"...","level":1,"words":[{"hanzi":"...","pinyin":"pinyin có dấu","meaning":"nghĩa Việt ngắn","example":"câu Trung HSK1","exampleVi":"dịch Việt"}]}`));
}

const readingTitles = ["Một ngày đi học", "Bữa sáng", "Bạn mới", "Sinh nhật", "Cuối tuần", "Đi siêu thị", "Ở thư viện", "Nuôi mèo", "Mùa yêu thích", "Gọi điện cho mẹ", "Lớp tiếng Trung", "Đi xe buýt", "Buổi tối ở nhà"];
const readings = await generate(`${common}\nTạo mảng JSON gồm 13 bài đọc, lần lượt theo tiêu đề: ${readingTitles.join("; ")}. Mỗi bài id duy nhất, level=1, passage 3-5 câu tiếng Trung, pinyin đầy đủ có dấu, translation tiếng Việt, đúng 3 vocabulary và đúng 2 câu hỏi 4 lựa chọn. answer là chỉ số 0-3, chỉ một đáp án đúng, explanation tiếng Việt dẫn chứng rõ. JSON: [{"id":"...","level":1,"title":"...","passage":"...","pinyin":"...","translation":"...","vocabulary":[{"hanzi":"...","pinyin":"...","meaning":"..."}],"questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}]`);

const dialogueTitles = ["Chào buổi sáng", "Trong lớp học", "Hỏi giờ", "Mời đi ăn", "Mua hoa quả", "Gọi điện", "Hỏi tuổi", "Nói về gia đình", "Hẹn cuối tuần", "Đi taxi", "Tại khách sạn", "Hỏi thời tiết", "Tạm biệt bạn"];
const dialogues = await generate(`${common}\nTạo mảng JSON gồm 13 hội thoại, lần lượt theo tiêu đề: ${dialogueTitles.join("; ")}. Mỗi mục id duy nhất, level=1, place và goal tiếng Việt, 3-5 lượt thoại A/B. Mỗi line có speaker A hoặc B, zh, pinyin có dấu, vi. challenge có prompt tiếng Việt, đúng 4 options, answer 0-3, một đáp án đúng và explanation. JSON: [{"id":"...","level":1,"title":"...","place":"...","goal":"...","lines":[{"speaker":"A","zh":"...","pinyin":"...","vi":"..."}],"challenge":{"prompt":"...","options":["..."],"answer":0,"explanation":"..."}}]`);

const exams = [];
for (let number = 1; number <= 3; number++) {
  exams.push(await generate(`${common}\nTạo đề luyện mô phỏng HSK 1 số ${number}, id=hsk1-full-${number}, title=Đề HSK 1 số ${number}, durationMinutes=25, chính xác 30 câu. Chia đều Từ vựng, Ngữ pháp, Đọc hiểu. Mỗi câu có section, prompt tiếng Việt hoặc Trung; câu Đọc hiểu có context 1-3 câu; đúng 4 options không trùng; answer 0-3 và explanation tiếng Việt. Phân bố vị trí đáp án đa dạng, không để một vị trí quá 10 lần. JSON: {"id":"hsk1-full-${number}","level":1,"title":"Đề HSK 1 số ${number}","durationMinutes":25,"questions":[{"section":"Từ vựng","prompt":"...","context":"... tùy chọn","options":["..."],"answer":0,"explanation":"..."}]}`));
}

writeFileSync(join(root, "lib/generatedHsk1Data.json"), JSON.stringify({ topics, readings, dialogues, exams }, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ topics: topics.length, topicWords: topics.flatMap((topic) => topic.words).length, readings: readings.length, dialogues: dialogues.length, exams: exams.length, examQuestions: exams.flatMap((exam) => exam.questions).length }));
