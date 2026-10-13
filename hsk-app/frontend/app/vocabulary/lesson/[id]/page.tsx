import { fetchLesson } from "@/lib/hskDataServer";
import { notFound } from "next/navigation";
import LessonDetailClient from "@/components/vocabulary/LessonDetailClient";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Bai hoc ${id} | HSK Vocabulary` };
}

export default async function LessonDetailPage({ params }: Props) {
  const { id } = await params;
  const lesson = await fetchLesson(id);
  if (!lesson) notFound();
  return <LessonDetailClient lesson={lesson} />;
}
