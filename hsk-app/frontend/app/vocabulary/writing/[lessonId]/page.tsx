import { fetchLesson } from "@/lib/hskDataServer";
import { notFound } from "next/navigation";
import WritingClient from "@/components/vocabulary/WritingClient";

export const revalidate = 3600;

interface Props {
  params: Promise<{ lessonId: string }>;
}

export default async function WritingPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await fetchLesson(lessonId);
  if (!lesson) notFound();
  return <WritingClient lesson={lesson} />;
}
