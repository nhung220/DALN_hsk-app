import generatedHsk1Data from "./generatedHsk1Data.json";
import generatedHsk2Data from "./generatedHsk2Data.json";

export interface DialogueLine { speaker: "A" | "B"; zh: string; pinyin: string; vi: string; }
export interface DialogueScenario {
  id: string; level: number; title: string; place: string; goal: string;
  lines: DialogueLine[];
  challenge: { prompt: string; options: string[]; answer: number; explanation: string };
}

const BASE_DIALOGUE_SCENARIOS: DialogueScenario[] = [
  { id: "meet", level: 1, title: "Lần đầu gặp mặt", place: "Trường học", goal: "Chào hỏi và giới thiệu tên", lines: [
    { speaker: "A", zh: "你好！我叫安娜，你叫什么名字？", pinyin: "Nǐ hǎo! Wǒ jiào Ānnà, nǐ jiào shénme míngzi?", vi: "Xin chào! Tôi tên Anna, bạn tên gì?" },
    { speaker: "B", zh: "我叫明。很高兴认识你。", pinyin: "Wǒ jiào Míng. Hěn gāoxìng rènshi nǐ.", vi: "Tôi tên Minh. Rất vui được làm quen với bạn." },
    { speaker: "A", zh: "我也很高兴认识你。", pinyin: "Wǒ yě hěn gāoxìng rènshi nǐ.", vi: "Tôi cũng rất vui được làm quen với bạn." },
  ], challenge: { prompt: "Khi người khác nói ‘很高兴认识你’, bạn đáp thế nào tự nhiên nhất?", options: ["我也很高兴认识你。", "我要一杯茶。", "现在三点。", "明天下雨。"], answer: 0, explanation: "‘我也很高兴认识你’ nghĩa là ‘Tôi cũng rất vui được gặp bạn’." } },
  { id: "restaurant", level: 1, title: "Gọi món", place: "Nhà hàng", goal: "Hỏi thực đơn và gọi đồ ăn", lines: [
    { speaker: "A", zh: "您好，请给我看一下菜单。", pinyin: "Nín hǎo, qǐng gěi wǒ kàn yíxià càidān.", vi: "Xin chào, cho tôi xem thực đơn." },
    { speaker: "B", zh: "好的。您想吃什么？", pinyin: "Hǎo de. Nín xiǎng chī shénme?", vi: "Vâng. Quý khách muốn ăn gì?" },
    { speaker: "A", zh: "我要一碗牛肉面，不要辣。", pinyin: "Wǒ yào yì wǎn niúròu miàn, bú yào là.", vi: "Tôi muốn một bát mì bò, không cay." },
  ], challenge: { prompt: "Muốn món ăn không cay, bạn nói gì?", options: ["多放辣椒。", "不要辣。", "不要菜单。", "我不买。"], answer: 1, explanation: "‘不要辣’ là yêu cầu món ăn không cay." } },
  { id: "directions", level: 2, title: "Hỏi đường", place: "Trên phố", goal: "Hỏi và hiểu chỉ dẫn đường", lines: [
    { speaker: "A", zh: "请问，地铁站怎么走？", pinyin: "Qǐngwèn, dìtiě zhàn zěnme zǒu?", vi: "Xin hỏi, đi đến ga tàu điện thế nào?" },
    { speaker: "B", zh: "一直往前走，到路口以后向左转。", pinyin: "Yìzhí wǎng qián zǒu, dào lùkǒu yǐhòu xiàng zuǒ zhuǎn.", vi: "Đi thẳng, đến giao lộ thì rẽ trái." },
    { speaker: "A", zh: "离这儿远吗？", pinyin: "Lí zhèr yuǎn ma?", vi: "Có xa đây không?" },
    { speaker: "B", zh: "不远，走路大约五分钟。", pinyin: "Bù yuǎn, zǒulù dàyuē wǔ fēnzhōng.", vi: "Không xa, đi bộ khoảng năm phút." },
  ], challenge: { prompt: "Đến giao lộ phải đi hướng nào?", options: ["向右转", "往后走", "向左转", "坐地铁"], answer: 2, explanation: "Người chỉ đường nói ‘到路口以后向左转’ — đến giao lộ thì rẽ trái." } },
  { id: "shopping", level: 2, title: "Mua quần áo", place: "Cửa hàng", goal: "Hỏi giá và thử đồ", lines: [
    { speaker: "A", zh: "这件衬衫多少钱？", pinyin: "Zhè jiàn chènshān duōshao qián?", vi: "Chiếc áo sơ mi này bao nhiêu tiền?" },
    { speaker: "B", zh: "三百二十块。今天打八折。", pinyin: "Sānbǎi èrshí kuài. Jīntiān dǎ bā zhé.", vi: "320 tệ. Hôm nay giảm còn 80%." },
    { speaker: "A", zh: "我可以试一下吗？", pinyin: "Wǒ kěyǐ shì yíxià ma?", vi: "Tôi có thể thử không?" },
    { speaker: "B", zh: "当然可以，试衣间在那边。", pinyin: "Dāngrán kěyǐ, shìyījiān zài nàbian.", vi: "Tất nhiên, phòng thử đồ ở bên kia." },
  ], challenge: { prompt: "Câu nào dùng để xin thử quần áo?", options: ["可以便宜一点儿吗？", "我可以试一下吗？", "试衣间没人。", "我要退货。"], answer: 1, explanation: "‘试一下’ trong ngữ cảnh cửa hàng có nghĩa là thử đồ." } },
  { id: "doctor", level: 3, title: "Đi khám bệnh", place: "Phòng khám", goal: "Mô tả triệu chứng", lines: [
    { speaker: "A", zh: "你哪儿不舒服？", pinyin: "Nǐ nǎr bù shūfu?", vi: "Bạn khó chịu ở đâu?" },
    { speaker: "B", zh: "我头疼，还有点儿发烧。", pinyin: "Wǒ tóuténg, hái yǒudiǎnr fāshāo.", vi: "Tôi đau đầu và còn hơi sốt." },
    { speaker: "A", zh: "这种情况有几天了？", pinyin: "Zhè zhǒng qíngkuàng yǒu jǐ tiān le?", vi: "Tình trạng này được mấy ngày rồi?" },
    { speaker: "B", zh: "从昨天晚上开始的。", pinyin: "Cóng zuótiān wǎnshang kāishǐ de.", vi: "Bắt đầu từ tối hôm qua." },
  ], challenge: { prompt: "Người bệnh có triệu chứng gì?", options: ["Đau bụng", "Ho và đau họng", "Đau đầu và hơi sốt", "Đau chân"], answer: 2, explanation: "Người bệnh nói ‘我头疼，还有点儿发烧’." } },
  { id: "work-meeting", level: 3, title: "Đổi lịch họp", place: "Công ty", goal: "Đề nghị thay đổi thời gian", lines: [
    { speaker: "A", zh: "明天下午的会议，你能参加吗？", pinyin: "Míngtiān xiàwǔ de huìyì, nǐ néng cānjiā ma?", vi: "Cuộc họp chiều mai, bạn tham gia được không?" },
    { speaker: "B", zh: "不好意思，我明天下午要见客户。", pinyin: "Bù hǎoyìsi, wǒ míngtiān xiàwǔ yào jiàn kèhù.", vi: "Xin lỗi, chiều mai tôi phải gặp khách hàng." },
    { speaker: "A", zh: "那我们改到星期五上午，怎么样？", pinyin: "Nà wǒmen gǎi dào Xīngqīwǔ shàngwǔ, zěnmeyàng?", vi: "Vậy đổi sang sáng thứ Sáu nhé, thế nào?" },
    { speaker: "B", zh: "没问题，我会准时参加。", pinyin: "Méi wèntí, wǒ huì zhǔnshí cānjiā.", vi: "Không vấn đề, tôi sẽ tham gia đúng giờ." },
  ], challenge: { prompt: "Cuối cùng cuộc họp được chuyển sang khi nào?", options: ["Chiều mai", "Sáng thứ Sáu", "Chiều thứ Sáu", "Sáng thứ Hai"], answer: 1, explanation: "Hai người thống nhất ‘改到星期五上午’ — đổi sang sáng thứ Sáu." } },
];

export const DIALOGUE_SCENARIOS: DialogueScenario[] = [
  ...BASE_DIALOGUE_SCENARIOS,
  ...(generatedHsk1Data.dialogues as DialogueScenario[]),
  ...(generatedHsk2Data.dialogues as DialogueScenario[]),
].sort((a, b) => a.level - b.level);
