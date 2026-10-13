import generatedHsk1Data from "./generatedHsk1Data.json";
import generatedHsk2Data from "./generatedHsk2Data.json";

export interface ExamQuestion { section: "Từ vựng" | "Ngữ pháp" | "Đọc hiểu"; prompt: string; context?: string; options: string[]; answer: number; explanation: string; }
export interface MockExam { id: string; level: number; title: string; durationMinutes: number; questions: ExamQuestion[]; }

const BASE_MOCK_EXAMS: MockExam[] = [
  { id: "hsk1-a", level: 1, title: "Đề cơ bản số 1", durationMinutes: 10, questions: [
    { section: "Từ vựng", prompt: "‘老师’ có nghĩa là gì?", options: ["Học sinh", "Giáo viên", "Bác sĩ", "Bạn bè"], answer: 1, explanation: "老师 (lǎoshī) nghĩa là giáo viên." },
    { section: "Từ vựng", prompt: "Chọn từ phù hợp: 我想___水。", options: ["吃", "看", "喝", "听"], answer: 2, explanation: "喝水 là uống nước." },
    { section: "Ngữ pháp", prompt: "Câu nào đúng?", options: ["我是学生。", "我学生是。", "是我学生。", "学生我是。"], answer: 0, explanation: "Trật tự cơ bản: Chủ ngữ + 是 + danh từ." },
    { section: "Ngữ pháp", prompt: "Điền lượng từ: 三___书", options: ["个", "本", "杯", "件"], answer: 1, explanation: "Lượng từ của sách là 本." },
    { section: "Đọc hiểu", context: "我叫林月，今年二十岁。我在北京学习汉语。", prompt: "林月在哪里学习？", options: ["上海", "河内", "北京", "广州"], answer: 2, explanation: "Đoạn văn nói 我在北京学习汉语。" },
    { section: "Đọc hiểu", context: "今天星期六，我不去学校。我和妈妈去商店买水果。", prompt: "今天林月去哪里？", options: ["学校", "商店", "医院", "公司"], answer: 1, explanation: "Nhân vật đi cửa hàng mua hoa quả." },
    { section: "Từ vựng", prompt: "Từ trái nghĩa với ‘大’ là gì?", options: ["多", "少", "小", "高"], answer: 2, explanation: "大 (to) trái nghĩa với 小 (nhỏ)." },
    { section: "Ngữ pháp", prompt: "Chọn từ hỏi đúng: 你___岁？", options: ["什么", "怎么", "几", "哪"], answer: 2, explanation: "几岁 dùng để hỏi tuổi." },
  ] },
  { id: "hsk2-a", level: 2, title: "Đề tổng hợp số 1", durationMinutes: 12, questions: [
    { section: "Từ vựng", prompt: "‘已经’ biểu thị điều gì?", options: ["Việc sắp xảy ra", "Việc đã xảy ra", "Điều kiện", "So sánh"], answer: 1, explanation: "已经 nghĩa là đã, thường đi cùng 了." },
    { section: "Ngữ pháp", prompt: "Chọn câu đúng.", options: ["我比他高一点儿。", "我高比他一点儿。", "比他我高一点儿。", "我一点儿比他高。"], answer: 0, explanation: "Cấu trúc so sánh: A + 比 + B + tính từ." },
    { section: "Từ vựng", prompt: "Điền từ: 外面下雨了，别忘了带___。", options: ["眼镜", "雨伞", "帽子", "地图"], answer: 1, explanation: "Trời mưa thì cần mang ô (雨伞)." },
    { section: "Ngữ pháp", prompt: "我___吃饭，___去上班。", options: ["一边 / 一边", "先 / 再", "因为 / 所以", "虽然 / 但是"], answer: 1, explanation: "先……再…… diễn tả hai hành động theo thứ tự." },
    { section: "Đọc hiểu", context: "张老师每天骑自行车上班，只有下雨的时候才坐公共汽车。", prompt: "什么时候张老师坐公共汽车？", options: ["每天", "下雨的时候", "星期天", "天气好的时候"], answer: 1, explanation: "只有下雨的时候才坐公共汽车。" },
    { section: "Đọc hiểu", context: "这家饭店的菜很好吃，也不贵，所以周末人很多。", prompt: "周末饭店为什么人多？", options: ["菜好吃又不贵", "饭店很大", "服务员很多", "离学校近"], answer: 0, explanation: "Lý do được nêu trước 所以: món ngon và không đắt." },
    { section: "Từ vựng", prompt: "‘离’ trong ‘学校离我家很近’ có nghĩa gì?", options: ["Rời khỏi", "Khoảng cách tới", "Bên trong", "Đi qua"], answer: 1, explanation: "A 离 B + xa/gần diễn tả khoảng cách." },
    { section: "Ngữ pháp", prompt: "Điền từ: 我没听懂，请你___说一次。", options: ["又", "再", "才", "就"], answer: 1, explanation: "再 dùng cho hành động sẽ lặp lại trong tương lai." },
  ] },
  { id: "hsk3-a", level: 3, title: "Đề tổng hợp số 1", durationMinutes: 15, questions: [
    { section: "Từ vựng", prompt: "Chọn từ gần nghĩa nhất với ‘办法’.", options: ["方法", "问题", "机会", "原因"], answer: 0, explanation: "办法 và 方法 đều mang nghĩa cách/phương pháp." },
    { section: "Ngữ pháp", prompt: "___天气很冷，___他还是去跑步了。", options: ["因为 / 所以", "不但 / 而且", "虽然 / 但是", "如果 / 就"], answer: 2, explanation: "虽然……但是…… diễn tả quan hệ nhượng bộ." },
    { section: "Từ vựng", prompt: "Điền từ: 请大家___安静，会议马上开始。", options: ["保护", "保持", "保存", "保留"], answer: 1, explanation: "保持安静 là giữ im lặng." },
    { section: "Ngữ pháp", prompt: "Sắp xếp ý đúng: 他 / 汉语 / 说得 / 很流利", options: ["他说得汉语很流利。", "他汉语说得很流利。", "汉语很流利他说得。", "他说汉语得很流利。"], answer: 1, explanation: "Tân ngữ có thể đưa trước động từ trong cấu trúc bổ ngữ trình độ: 他汉语说得很流利。" },
    { section: "Đọc hiểu", context: "王芳本来打算坐飞机去成都，但是因为天气原因航班取消了。她只好改坐火车，虽然慢一些，但第二天早上也顺利到了。", prompt: "王芳为什么改坐火车？", options: ["火车更便宜", "她怕坐飞机", "航班被取消", "她想看风景"], answer: 2, explanation: "Chuyến bay bị hủy vì thời tiết nên cô phải đổi sang tàu." },
    { section: "Đọc hiểu", context: "越来越多的年轻人选择在小城市生活。那里虽然工作机会少一些，但生活压力也比较小，而且房租便宜。", prompt: "年轻人选择小城市的原因不包括什么？", options: ["生活压力较小", "房租便宜", "工作机会更多", "生活节奏比较慢"], answer: 2, explanation: "Bài nói cơ hội việc làm ít hơn, không phải nhiều hơn." },
    { section: "Từ vựng", prompt: "‘及时’ có nghĩa là gì?", options: ["Đúng lúc, kịp thời", "Đúng giờ tuyệt đối", "Lập tức", "Thường xuyên"], answer: 0, explanation: "及时 nhấn mạnh hành động xảy ra kịp lúc cần thiết." },
    { section: "Ngữ pháp", prompt: "Chọn câu dùng 把 đúng.", options: ["我把作业做完了。", "我做把作业完了。", "把我作业做完了。", "我把做完了作业。"], answer: 0, explanation: "Cấu trúc: chủ ngữ + 把 + tân ngữ + động từ + thành phần kết quả." },
  ] },
];

export const MOCK_EXAMS: MockExam[] = [
  ...(generatedHsk1Data.exams as MockExam[]),
  ...(generatedHsk2Data.exams as MockExam[]),
  ...BASE_MOCK_EXAMS.filter((exam) => exam.level > 2),
];
