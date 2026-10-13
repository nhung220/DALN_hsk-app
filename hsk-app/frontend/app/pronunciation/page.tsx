import type { Metadata } from "next";
import PinyinPracticeClient from "@/components/pronunciation/PinyinPracticeClient";

export const metadata: Metadata = { title: "Luyện phát âm Pinyin | HSK 3.0", description: "Nghe và luyện phát âm Pinyin theo bốn thanh điệu." };
export default function PronunciationPage() { return <PinyinPracticeClient/>; }
