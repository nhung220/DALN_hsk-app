import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputFile = join(root, "lib/generatedHsk2Data.json");
const env = readFileSync(join(root, ".env.local"), "utf8");
const apiKey = env.match(/^GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/m)?.[1];
if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env.local");

const source = JSON.parse(readFileSync(join(root, "public/data/hsk-new-2.json"), "utf8"));
const allowedWords = source.lessons.flatMap((lesson) => lesson.words).map((word) => word.simplified);
const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const data = existsSync(outputFile)
  ? JSON.parse(readFileSync(outputFile, "utf8"))
  : { topics: [], readings: [], dialogues: [], exams: [] };
const save = () => writeFileSync(outputFile, JSON.stringify(data, null, 2) + "\n", "utf8");

async function generate(prompt) {
  let lastError;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
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

const common = `Bạn là chuyên gia biên soạn giáo trình tiếng Trung cho người Việt. Chỉ trả JSON hợp lệ, không markdown, không tiếng Anh. Cấp HSK 2 theo HSK 3.0: câu rõ, tự nhiên, dùng chủ yếu từ HSK 1-2. Không sao chép đề thi chính thức.`;
const topicSpecs = [
  ["city-services", "Dịch vụ trong thành phố", "🏙️"], ["office", "Văn phòng", "💼"],
  ["shopping-money", "Mua sắm và tiền bạc", "🛍️"], ["health-habits", "Sức khỏe và thói quen", "🏃"],
  ["sports", "Thể thao", "⚽"], ["feelings", "Cảm xúc và tính cách", "😊"],
  ["nature", "Thiên nhiên", "🌳"], ["technology", "Công nghệ và liên lạc", "📱"],
  ["social-events", "Gặp gỡ và hoạt động xã hội", "🎉"],
];
for (const [id, title, icon] of topicSpecs) {
  if (data.topics.some((topic) => topic.id === id)) continue;
  data.topics.push(await generate(`${common}\nTạo 1 chủ đề: id=${id}, title=${title}, icon=${icon}. Chính xác 10 từ/cụm từ KHÁC NHAU và CHỈ chọn từ trong danh sách HSK 2 cho phép: ${allowedWords.join("、")}. JSON: {"id":"...","title":"...","icon":"...","description":"...","level":2,"words":[{"hanzi":"...","pinyin":"pinyin có dấu","meaning":"nghĩa Việt ngắn","example":"câu Trung HSK1-2","exampleVi":"dịch Việt"}]}`));
  save();
}

if (!data.readings.length) {
  const titles = ["Chuyển nhà", "Một ngày bận rộn", "Món quà sinh nhật", "Học nấu ăn", "Chuyến tàu cuối tuần", "Tìm điện thoại", "Buổi phỏng vấn", "Thói quen tập thể dục", "Người hàng xóm mới", "Mua hàng trên mạng", "Kế hoạch nghỉ hè", "Một lần đến bệnh viện", "Câu lạc bộ tiếng Trung", "Bữa tối cùng đồng nghiệp"];
  data.readings = await generate(`${common}\nTạo mảng 14 bài đọc theo tiêu đề: ${titles.join("; ")}. Mỗi bài id bắt đầu hsk2-reading-, level=2, passage 5-7 câu, pinyin đầy đủ có dấu, translation tiếng Việt, đúng 4 vocabulary, đúng 3 câu hỏi với 4 lựa chọn. answer là 0-3, một đáp án đúng; explanation tiếng Việt trích dẫn thông tin. JSON: [{"id":"...","level":2,"title":"...","passage":"...","pinyin":"...","translation":"...","vocabulary":[{"hanzi":"...","pinyin":"...","meaning":"..."}],"questions":[{"question":"...","options":["..."],"answer":0,"explanation":"..."}]}]`);
  save();
}

if (!data.dialogues.length) {
  const titles = ["Đặt phòng khách sạn", "Đổi vé tàu", "Xin nghỉ phép", "Hẹn đi xem phim", "Gửi bưu phẩm", "Mua thuốc", "Sửa điện thoại", "Gọi món giao tận nơi", "Tham gia câu lạc bộ", "Hỏi thông tin tuyển dụng", "Đổi sản phẩm", "Mời dự sinh nhật", "Nhờ hàng xóm giúp đỡ"];
  data.dialogues = await generate(`${common}\nTạo mảng 13 hội thoại theo tiêu đề: ${titles.join("; ")}. Mỗi mục id bắt đầu hsk2-dialogue-, level=2, place và goal tiếng Việt, 5-7 lượt A/B; line có speaker, zh, pinyin có dấu, vi. challenge gồm prompt tiếng Việt, 4 options, answer 0-3, một đáp án đúng, explanation. JSON: [{"id":"...","level":2,"title":"...","place":"...","goal":"...","lines":[{"speaker":"A","zh":"...","pinyin":"...","vi":"..."}],"challenge":{"prompt":"...","options":["..."],"answer":0,"explanation":"..."}}]`);
  save();
}

for (let number = 1; number <= 3; number++) {
  const id = `hsk2-full-${number}`;
  if (data.exams.some((exam) => exam.id === id)) continue;
  data.exams.push(await generate(`${common}\nTạo đề luyện mô phỏng HSK 2 số ${number}: id=${id}, title=Đề HSK 2 số ${number}, durationMinutes=30, chính xác 30 câu; 10 Từ vựng, 10 Ngữ pháp, 10 Đọc hiểu. Mỗi câu có section đúng một trong Từ vựng/Ngữ pháp/Đọc hiểu, prompt; câu đọc có context 2-4 câu; 4 options không trùng; answer 0-3; explanation tiếng Việt. JSON: {"id":"${id}","level":2,"title":"Đề HSK 2 số ${number}","durationMinutes":30,"questions":[{"section":"Từ vựng","prompt":"...","context":"... tùy chọn","options":["..."],"answer":0,"explanation":"..."}]}`));
  save();
}

console.log(JSON.stringify({ topics: data.topics.length, words: data.topics.flatMap((topic) => topic.words).length, readings: data.readings.length, dialogues: data.dialogues.length, exams: data.exams.length, questions: data.exams.flatMap((exam) => exam.questions).length }));
