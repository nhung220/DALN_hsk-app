import { fetchLevelData } from "@/lib/hskDataServer";
import { notFound } from "next/navigation";
import TestClient from "@/components/vocabulary/TestClient";

export const revalidate = 3600;

interface Props {
  params: Promise<{ setId: string }>;
}

export default async function TestPage({ params }: Props) {
  const { setId } = await params;
  const match = setId.match(/^new-(\d+)-set-(\d+)$/);
  if (!match) notFound();

  const levelNum = parseInt(match[1]);
  const setNum = parseInt(match[2]);

  const data = await fetchLevelData(levelNum);

  const startLesson = (setNum - 1) * 3 + 1;
  const endLesson = startLesson + 2;
  const lessons = data.lessons.filter(
    (l) => l.lessonNumber >= startLesson && l.lessonNumber <= endLesson
  );

  if (lessons.length === 0) notFound();

  return (
    <TestClient
      setId={setId}
      setNumber={setNum}
      levelNumber={levelNum}
      lessons={lessons}
    />
  );
}
