import generatedHsk1Data from "./generatedHsk1Data.json";
import generatedHsk2Data from "./generatedHsk2Data.json";

export interface ReadingQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface ReadingLesson {
  id: string;
  level: number;
  title: string;
  passage: string;
  pinyin: string;
  translation: string;
  vocabulary: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  questions: ReadingQuestion[];
}

const BASE_READING_LESSONS: ReadingLesson[] = [
  {
    id: "morning", level: 1, title: "Buổi sáng của Tiểu Minh",
    passage: "小明每天六点半起床。他先喝一杯水，然后吃早饭。七点半，他坐公共汽车去学校。学校八点开始上课。",
    pinyin: "Xiǎomíng měitiān liù diǎn bàn qǐchuáng. Tā xiān hē yì bēi shuǐ, ránhòu chī zǎofàn. Qī diǎn bàn, tā zuò gōnggòng qìchē qù xuéxiào. Xuéxiào bā diǎn kāishǐ shàngkè.",
    translation: "Tiểu Minh thức dậy lúc 6 giờ 30 mỗi ngày. Cậu uống một cốc nước trước rồi ăn sáng. Lúc 7 giờ 30, cậu đi xe buýt đến trường. Trường bắt đầu học lúc 8 giờ.",
    vocabulary: [{ hanzi: "起床", pinyin: "qǐchuáng", meaning: "thức dậy" }, { hanzi: "然后", pinyin: "ránhòu", meaning: "sau đó" }, { hanzi: "公共汽车", pinyin: "gōnggòng qìchē", meaning: "xe buýt" }],
    questions: [
      { question: "小明几点起床？", options: ["六点", "六点半", "七点半", "八点"], answer: 1, explanation: "Câu đầu nói: 小明每天六点半起床。" },
      { question: "小明怎么去学校？", options: ["走路", "骑自行车", "坐公共汽车", "坐地铁"], answer: 2, explanation: "Đoạn văn nói: 他坐公共汽车去学校。" },
    ],
  },
  {
    id: "weather", level: 1, title: "Thời tiết hôm nay",
    passage: "今天天气很好，不冷也不热。上午有一点儿风，下午会出太阳。妈妈说我们可以去公园散步，但是要带一瓶水。",
    pinyin: "Jīntiān tiānqì hěn hǎo, bù lěng yě bú rè. Shàngwǔ yǒu yìdiǎnr fēng, xiàwǔ huì chū tàiyáng. Māma shuō wǒmen kěyǐ qù gōngyuán sànbù, dànshì yào dài yì píng shuǐ.",
    translation: "Hôm nay thời tiết rất đẹp, không lạnh cũng không nóng. Buổi sáng có chút gió, buổi chiều trời sẽ nắng. Mẹ nói chúng tôi có thể đi dạo ở công viên nhưng phải mang một chai nước.",
    vocabulary: [{ hanzi: "天气", pinyin: "tiānqì", meaning: "thời tiết" }, { hanzi: "太阳", pinyin: "tàiyáng", meaning: "mặt trời" }, { hanzi: "散步", pinyin: "sànbù", meaning: "đi dạo" }],
    questions: [
      { question: "上午天气怎么样？", options: ["下雨", "有一点儿风", "很热", "很冷"], answer: 1, explanation: "Buổi sáng có một chút gió: 上午有一点儿风。" },
      { question: "去公园要带什么？", options: ["雨伞", "书", "一瓶水", "水果"], answer: 2, explanation: "Mẹ dặn phải mang một chai nước: 要带一瓶水。" },
    ],
  },
  {
    id: "new-job", level: 2, title: "Công việc mới",
    passage: "李华上个月开始了一份新工作。公司离他家不远，坐地铁只要二十分钟。同事们很热情，常常帮助他。虽然工作有点儿忙，但是他每天都能学到新东西。",
    pinyin: "Lǐ Huá shàng ge yuè kāishǐ le yí fèn xīn gōngzuò. Gōngsī lí tā jiā bù yuǎn, zuò dìtiě zhǐ yào èrshí fēnzhōng. Tóngshìmen hěn rèqíng, chángcháng bāngzhù tā. Suīrán gōngzuò yǒudiǎnr máng, dànshì tā měitiān dōu néng xuédào xīn dōngxi.",
    translation: "Tháng trước Lý Hoa bắt đầu một công việc mới. Công ty không xa nhà, đi tàu điện chỉ mất 20 phút. Đồng nghiệp rất nhiệt tình và thường giúp anh. Tuy công việc hơi bận nhưng mỗi ngày anh đều học được điều mới.",
    vocabulary: [{ hanzi: "份", pinyin: "fèn", meaning: "lượng từ cho công việc" }, { hanzi: "热情", pinyin: "rèqíng", meaning: "nhiệt tình" }, { hanzi: "虽然", pinyin: "suīrán", meaning: "tuy rằng" }],
    questions: [
      { question: "李华什么时候开始新工作？", options: ["昨天", "上个星期", "上个月", "去年"], answer: 2, explanation: "Thông tin nằm ngay câu đầu: 上个月开始。" },
      { question: "李华觉得新工作怎么样？", options: ["很轻松，也没意思", "有点儿忙，但能学到东西", "离家很远", "同事不帮助他"], answer: 1, explanation: "Câu cuối dùng cấu trúc 虽然……但是…… để nêu đánh giá." },
    ],
  },
  {
    id: "online-shopping", level: 3, title: "Mua sắm trực tuyến",
    passage: "现在越来越多的人喜欢在网上买东西。网上商品种类多，比较价格也很方便。不过，消费者看不到真正的商品，有时收到的东西和照片不一样。因此，购物前应该仔细看其他顾客的评价。",
    pinyin: "Xiànzài yuèláiyuè duō de rén xǐhuan zài wǎngshàng mǎi dōngxi. Wǎngshàng shāngpǐn zhǒnglèi duō, bǐjiào jiàgé yě hěn fāngbiàn. Búguò, xiāofèizhě kàn bú dào zhēnzhèng de shāngpǐn, yǒushí shōudào de dōngxi hé zhàopiàn bù yíyàng. Yīncǐ, gòuwù qián yīnggāi zǐxì kàn qítā gùkè de píngjià.",
    translation: "Ngày càng nhiều người thích mua hàng trên mạng. Hàng hóa đa dạng và dễ so sánh giá. Tuy nhiên người mua không nhìn thấy hàng thật, đôi khi hàng nhận được khác ảnh. Vì vậy nên đọc kỹ đánh giá của khách khác trước khi mua.",
    vocabulary: [{ hanzi: "种类", pinyin: "zhǒnglèi", meaning: "chủng loại" }, { hanzi: "消费者", pinyin: "xiāofèizhě", meaning: "người tiêu dùng" }, { hanzi: "评价", pinyin: "píngjià", meaning: "đánh giá" }],
    questions: [
      { question: "网上购物有什么优点？", options: ["可以看到真品", "商品多且容易比较价格", "一定比商店便宜", "不用付钱"], answer: 1, explanation: "Đoạn văn nêu hai ưu điểm: nhiều chủng loại và tiện so sánh giá." },
      { question: "作者建议购物前做什么？", options: ["先去商店", "问朋友借钱", "仔细看顾客评价", "只看商品照片"], answer: 2, explanation: "Câu cuối đưa ra lời khuyên đọc kỹ đánh giá của khách hàng." },
    ],
  },
  {
    id: "exercise", level: 3, title: "Thói quen vận động",
    passage: "很多人知道运动对健康有好处，却总说自己没有时间。其实，不一定要去健身房才算运动。每天少坐一站公交车，走路回家；工作一小时后站起来活动几分钟，这些小习惯也能让身体更健康。",
    pinyin: "Hěn duō rén zhīdào yùndòng duì jiànkāng yǒu hǎochu, què zǒng shuō zìjǐ méiyǒu shíjiān. Qíshí, bù yídìng yào qù jiànshēnfáng cái suàn yùndòng. Měitiān shǎo zuò yí zhàn gōngjiāochē, zǒulù huí jiā; gōngzuò yì xiǎoshí hòu zhàn qǐlái huódòng jǐ fēnzhōng, zhèxiē xiǎo xíguàn yě néng ràng shēntǐ gèng jiànkāng.",
    translation: "Nhiều người biết vận động tốt cho sức khỏe nhưng luôn nói không có thời gian. Thực ra không nhất thiết phải đến phòng gym. Xuống xe buýt sớm một trạm để đi bộ hoặc đứng lên vận động vài phút sau mỗi giờ làm việc cũng giúp khỏe hơn.",
    vocabulary: [{ hanzi: "健康", pinyin: "jiànkāng", meaning: "sức khỏe, khỏe mạnh" }, { hanzi: "健身房", pinyin: "jiànshēnfáng", meaning: "phòng gym" }, { hanzi: "习惯", pinyin: "xíguàn", meaning: "thói quen" }],
    questions: [
      { question: "作者认为运动一定要去健身房吗？", options: ["一定要", "不一定", "周末才要", "文章没说"], answer: 1, explanation: "Tác giả viết rõ: 不一定要去健身房才算运动。" },
      { question: "下面哪个是文章建议的小习惯？", options: ["每天开车", "工作时一直坐着", "少坐一站车然后走路", "每天睡十二小时"], answer: 2, explanation: "Bài viết khuyên xuống sớm một trạm rồi đi bộ về nhà." },
    ],
  },
  {
    id: "culture", level: 4, title: "Ý nghĩa của việc học văn hóa",
    passage: "学习一门语言，不只是记住词汇和语法。语言背后还有一个民族的历史、生活方式和思维习惯。如果不了解文化，即使每个词都听懂了，也可能误会说话人的真正意思。因此，接触电影、文学和日常生活，对提高语言能力非常重要。",
    pinyin: "Xuéxí yì mén yǔyán, bù zhǐshì jìzhù cíhuì hé yǔfǎ. Yǔyán bèihòu hái yǒu yí ge mínzú de lìshǐ, shēnghuó fāngshì hé sīwéi xíguàn. Rúguǒ bù liǎojiě wénhuà, jíshǐ měi ge cí dōu tīngdǒng le, yě kěnéng wùhuì shuōhuàrén de zhēnzhèng yìsi. Yīncǐ, jiēchù diànyǐng, wénxué hé rìcháng shēnghuó, duì tígāo yǔyán nénglì fēicháng zhòngyào.",
    translation: "Học một ngôn ngữ không chỉ là nhớ từ vựng và ngữ pháp. Đằng sau ngôn ngữ còn có lịch sử, lối sống và thói quen tư duy. Nếu không hiểu văn hóa, dù nghe hiểu từng từ vẫn có thể hiểu nhầm ý thật của người nói. Vì vậy tiếp xúc với phim, văn học và đời sống rất quan trọng.",
    vocabulary: [{ hanzi: "民族", pinyin: "mínzú", meaning: "dân tộc" }, { hanzi: "思维", pinyin: "sīwéi", meaning: "tư duy" }, { hanzi: "误会", pinyin: "wùhuì", meaning: "hiểu lầm" }],
    questions: [
      { question: "作者认为语言背后有什么？", options: ["只有语法", "历史、生活方式和思维习惯", "只有文学", "考试方法"], answer: 1, explanation: "Câu hai liệt kê lịch sử, lối sống và thói quen tư duy." },
      { question: "这篇文章的主要观点是什么？", options: ["看电影比学习语法重要", "只要记住词汇就能学好语言", "学习语言也需要了解文化", "文学很难理解"], answer: 2, explanation: "Toàn bài nhấn mạnh vai trò của hiểu biết văn hóa khi học ngôn ngữ." },
    ],
  },
];

export const READING_LESSONS: ReadingLesson[] = [
  ...BASE_READING_LESSONS,
  ...(generatedHsk1Data.readings as ReadingLesson[]),
  ...(generatedHsk2Data.readings as ReadingLesson[]),
].sort((a, b) => a.level - b.level);
