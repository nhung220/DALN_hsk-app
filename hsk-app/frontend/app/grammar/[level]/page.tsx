import { notFound } from "next/navigation";
import { fetchGrammarLevel } from "@/lib/grammarDataServer";
import GrammarListClient from "@/components/grammar/GrammarListClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Props {
  params: Promise<{ level: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { level } = await params;
  return { title: `Ngữ pháp HSK ${level} | HSK 3.0` };
}

export default async function GrammarLevelPage({ params }: Props) {
  const { level } = await params;
  const levelNum = parseInt(level);
  if (isNaN(levelNum) || levelNum < 1 || levelNum > 6) notFound();

  const data = await fetchGrammarLevel(levelNum);
  return <GrammarListClient data={data} />;
}
