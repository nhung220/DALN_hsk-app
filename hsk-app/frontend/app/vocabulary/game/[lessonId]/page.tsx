import { fetchLesson } from "@/lib/hskDataServer";
import { notFound } from "next/navigation";
import GameClient from "@/components/vocabulary/GameClient";

export const revalidate = 3600;

interface Props {
  params: Promise<{ lessonId: string }>;
}

export default async function GamePage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await fetchLesson(lessonId);
  if (!lesson) notFound();
  return <GameClient lesson={lesson} />;
}
