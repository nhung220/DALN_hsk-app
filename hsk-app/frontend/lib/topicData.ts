import generatedHsk1Data from "./generatedHsk1Data.json";
import generatedHsk2Data from "./generatedHsk2Data.json";

export interface TopicWord {
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string;
  exampleVi: string;
}

export interface VocabularyTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  level: number;
  words: TopicWord[];
}

const BASE_VOCABULARY_TOPICS: VocabularyTopic[] = [
  {
    id: "greetings", title: "Chào hỏi", icon: "👋", level: 1,
    description: "Những câu và từ cơ bản khi gặp gỡ, làm quen.",
    words: [
      { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "xin chào", example: "你好，很高兴认识你。", exampleVi: "Xin chào, rất vui được gặp bạn." },
      { hanzi: "再见", pinyin: "zài jiàn", meaning: "tạm biệt", example: "老师，再见！", exampleVi: "Tạm biệt thầy/cô!" },
      { hanzi: "谢谢", pinyin: "xiè xie", meaning: "cảm ơn", example: "谢谢你的帮助。", exampleVi: "Cảm ơn sự giúp đỡ của bạn." },
      { hanzi: "不客气", pinyin: "bú kè qi", meaning: "không có gì", example: "不客气，这是我应该做的。", exampleVi: "Không có gì, đây là việc tôi nên làm." },
      { hanzi: "对不起", pinyin: "duì bu qǐ", meaning: "xin lỗi", example: "对不起，我来晚了。", exampleVi: "Xin lỗi, tôi đến muộn." },
      { hanzi: "没关系", pinyin: "méi guān xi", meaning: "không sao", example: "没关系，下次注意。", exampleVi: "Không sao, lần sau chú ý nhé." },
      { hanzi: "请问", pinyin: "qǐng wèn", meaning: "xin hỏi", example: "请问，地铁站在哪儿？", exampleVi: "Xin hỏi, ga tàu điện ngầm ở đâu?" },
      { hanzi: "认识", pinyin: "rèn shi", meaning: "quen, biết", example: "我认识那位老师。", exampleVi: "Tôi biết giáo viên đó." },
    ],
  },
  {
    id: "family", title: "Gia đình", icon: "👨‍👩‍👧", level: 1,
    description: "Gọi tên thành viên và trò chuyện về gia đình.",
    words: [
      { hanzi: "家", pinyin: "jiā", meaning: "nhà, gia đình", example: "我家有四口人。", exampleVi: "Gia đình tôi có bốn người." },
      { hanzi: "爸爸", pinyin: "bà ba", meaning: "bố", example: "我爸爸是医生。", exampleVi: "Bố tôi là bác sĩ." },
      { hanzi: "妈妈", pinyin: "mā ma", meaning: "mẹ", example: "妈妈在做饭。", exampleVi: "Mẹ đang nấu cơm." },
      { hanzi: "哥哥", pinyin: "gē ge", meaning: "anh trai", example: "哥哥比我大三岁。", exampleVi: "Anh trai lớn hơn tôi ba tuổi." },
      { hanzi: "姐姐", pinyin: "jiě jie", meaning: "chị gái", example: "姐姐在大学学习。", exampleVi: "Chị gái học ở đại học." },
      { hanzi: "弟弟", pinyin: "dì di", meaning: "em trai", example: "弟弟喜欢踢足球。", exampleVi: "Em trai thích đá bóng." },
      { hanzi: "妹妹", pinyin: "mèi mei", meaning: "em gái", example: "妹妹今年十岁。", exampleVi: "Em gái năm nay mười tuổi." },
      { hanzi: "父母", pinyin: "fù mǔ", meaning: "bố mẹ", example: "我的父母住在河内。", exampleVi: "Bố mẹ tôi sống ở Hà Nội." },
    ],
  },
  {
    id: "food", title: "Ẩm thực", icon: "🍜", level: 1,
    description: "Đồ ăn, thức uống và cách gọi món thường dùng.",
    words: [
      { hanzi: "米饭", pinyin: "mǐ fàn", meaning: "cơm", example: "我想吃一碗米饭。", exampleVi: "Tôi muốn ăn một bát cơm." },
      { hanzi: "面条", pinyin: "miàn tiáo", meaning: "mì", example: "这家店的面条很好吃。", exampleVi: "Mì của quán này rất ngon." },
      { hanzi: "饺子", pinyin: "jiǎo zi", meaning: "sủi cảo", example: "春节我们一起包饺子。", exampleVi: "Tết chúng tôi cùng nhau gói sủi cảo." },
      { hanzi: "蔬菜", pinyin: "shū cài", meaning: "rau củ", example: "多吃蔬菜对身体好。", exampleVi: "Ăn nhiều rau tốt cho cơ thể." },
      { hanzi: "水果", pinyin: "shuǐ guǒ", meaning: "hoa quả", example: "你喜欢什么水果？", exampleVi: "Bạn thích loại hoa quả nào?" },
      { hanzi: "茶", pinyin: "chá", meaning: "trà", example: "请给我一杯热茶。", exampleVi: "Cho tôi một cốc trà nóng." },
      { hanzi: "菜单", pinyin: "cài dān", meaning: "thực đơn", example: "请给我看一下菜单。", exampleVi: "Cho tôi xem thực đơn." },
      { hanzi: "买单", pinyin: "mǎi dān", meaning: "thanh toán", example: "服务员，买单！", exampleVi: "Nhân viên ơi, thanh toán!" },
    ],
  },
  {
    id: "travel", title: "Du lịch", icon: "✈️", level: 2,
    description: "Di chuyển, đặt phòng và hỏi đường khi du lịch.",
    words: [
      { hanzi: "旅行", pinyin: "lǚ xíng", meaning: "du lịch", example: "我喜欢一个人旅行。", exampleVi: "Tôi thích đi du lịch một mình." },
      { hanzi: "护照", pinyin: "hù zhào", meaning: "hộ chiếu", example: "请出示您的护照。", exampleVi: "Vui lòng xuất trình hộ chiếu." },
      { hanzi: "行李", pinyin: "xíng li", meaning: "hành lý", example: "我的行李很重。", exampleVi: "Hành lý của tôi rất nặng." },
      { hanzi: "机场", pinyin: "jī chǎng", meaning: "sân bay", example: "我们几点到机场？", exampleVi: "Mấy giờ chúng ta đến sân bay?" },
      { hanzi: "酒店", pinyin: "jiǔ diàn", meaning: "khách sạn", example: "我已经订好酒店了。", exampleVi: "Tôi đã đặt khách sạn rồi." },
      { hanzi: "地图", pinyin: "dì tú", meaning: "bản đồ", example: "你可以看一下地图。", exampleVi: "Bạn có thể xem bản đồ." },
      { hanzi: "迷路", pinyin: "mí lù", meaning: "lạc đường", example: "我在古城里迷路了。", exampleVi: "Tôi bị lạc trong phố cổ." },
      { hanzi: "风景", pinyin: "fēng jǐng", meaning: "phong cảnh", example: "这里的风景非常美。", exampleVi: "Phong cảnh ở đây rất đẹp." },
    ],
  },
  {
    id: "school", title: "Trường học", icon: "🎓", level: 2,
    description: "Từ vựng trong lớp học và hoạt động học tập.",
    words: [
      { hanzi: "学校", pinyin: "xué xiào", meaning: "trường học", example: "学校离我家很近。", exampleVi: "Trường học rất gần nhà tôi." },
      { hanzi: "教室", pinyin: "jiào shì", meaning: "phòng học", example: "学生们都在教室里。", exampleVi: "Các học sinh đều ở trong lớp." },
      { hanzi: "老师", pinyin: "lǎo shī", meaning: "giáo viên", example: "王老师教我们汉语。", exampleVi: "Thầy Vương dạy chúng tôi tiếng Trung." },
      { hanzi: "学生", pinyin: "xué sheng", meaning: "học sinh", example: "她是一名大学生。", exampleVi: "Cô ấy là sinh viên đại học." },
      { hanzi: "考试", pinyin: "kǎo shì", meaning: "thi, kỳ thi", example: "明天有汉语考试。", exampleVi: "Ngày mai có bài thi tiếng Trung." },
      { hanzi: "作业", pinyin: "zuò yè", meaning: "bài tập", example: "我做完作业了。", exampleVi: "Tôi làm xong bài tập rồi." },
      { hanzi: "复习", pinyin: "fù xí", meaning: "ôn tập", example: "晚上我要复习生词。", exampleVi: "Buổi tối tôi sẽ ôn từ mới." },
      { hanzi: "成绩", pinyin: "chéng jì", meaning: "thành tích, điểm", example: "他的考试成绩很好。", exampleVi: "Điểm thi của anh ấy rất tốt." },
    ],
  },
  {
    id: "work", title: "Công việc", icon: "💼", level: 3,
    description: "Giao tiếp cơ bản tại nơi làm việc.",
    words: [
      { hanzi: "工作", pinyin: "gōng zuò", meaning: "công việc, làm việc", example: "我在一家科技公司工作。", exampleVi: "Tôi làm ở một công ty công nghệ." },
      { hanzi: "公司", pinyin: "gōng sī", meaning: "công ty", example: "公司有三百名员工。", exampleVi: "Công ty có ba trăm nhân viên." },
      { hanzi: "同事", pinyin: "tóng shì", meaning: "đồng nghiệp", example: "我的同事都很友好。", exampleVi: "Đồng nghiệp của tôi đều rất thân thiện." },
      { hanzi: "会议", pinyin: "huì yì", meaning: "cuộc họp", example: "会议九点开始。", exampleVi: "Cuộc họp bắt đầu lúc chín giờ." },
      { hanzi: "经理", pinyin: "jīng lǐ", meaning: "quản lý", example: "经理正在办公室里。", exampleVi: "Quản lý đang ở trong văn phòng." },
      { hanzi: "客户", pinyin: "kè hù", meaning: "khách hàng", example: "我们下午要见客户。", exampleVi: "Chiều nay chúng tôi sẽ gặp khách hàng." },
      { hanzi: "合同", pinyin: "hé tong", meaning: "hợp đồng", example: "双方已经签了合同。", exampleVi: "Hai bên đã ký hợp đồng." },
      { hanzi: "加班", pinyin: "jiā bān", meaning: "tăng ca", example: "今天我不用加班。", exampleVi: "Hôm nay tôi không phải tăng ca." },
    ],
  },
];

export const VOCABULARY_TOPICS: VocabularyTopic[] = [
  ...BASE_VOCABULARY_TOPICS,
  ...(generatedHsk1Data.topics as VocabularyTopic[]),
  ...(generatedHsk2Data.topics as VocabularyTopic[]),
].sort((a, b) => a.level - b.level);

export function getTopic(id: string) {
  return VOCABULARY_TOPICS.find((topic) => topic.id === id);
}
