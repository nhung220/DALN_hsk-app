import { notFound } from "next/navigation";
import { fetchGrammarLevel } from "@/lib/grammarDataServer";
import GrammarDetailClient from "@/components/grammar/GrammarDetailClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Props {
  params: Promise<{ level: string; pointId: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { level, pointId } = await params;
  const levelNum = parseInt(level);
  const data = await fetchGrammarLevel(levelNum).catch(() => null);
  const point = data?.points.find((p) => p.id === pointId);
  return { title: `${point?.titleVi ?? point?.title ?? "Ngữ pháp"} | HSK 3.0` };
}

export default async function GrammarPointPage({ params, searchParams }: Props) {
  const { level, pointId } = await params;
  const { mode } = await searchParams;
  const levelNum = parseInt(level);
  if (isNaN(levelNum) || levelNum < 1 || levelNum > 6) notFound();

  const data = await fetchGrammarLevel(levelNum);
  const pointIndex = data.points.findIndex((p) => p.id === pointId);
  if (pointIndex === -1) notFound();

  const point = data.points[pointIndex];
  const prevPoint = pointIndex > 0 ? data.points[pointIndex - 1] : null;
  const nextPoint = pointIndex < data.points.length - 1 ? data.points[pointIndex + 1] : null;

  return (
    <GrammarDetailClient
      point={point}
      levelNumber={levelNum}
      initialMode={(mode as "study" | "fill" | "sort") ?? "study"}
      prevPointId={prevPoint?.id ?? null}
      nextPointId={nextPoint?.id ?? null}
    />
  );
}
