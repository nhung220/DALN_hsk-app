import { fetchLesson } from "@/lib/hskDataServer";
import { notFound } from "next/navigation";
import FlashcardClient from "@/components/vocabulary/FlashcardClient";

// Data JSON tĩnh → có thể cache 1 giờ
export const revalidate = 3600;

interface Props {
  params: Promise<{ lessonId: string }>;
}

export default async function FlashcardPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await fetchLesson(lessonId);
  if (!lesson) notFound();
  return <FlashcardClient lesson={lesson} />;
}
