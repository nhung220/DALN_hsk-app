import TopicVocabularyClient from "@/components/learning/TopicVocabularyClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata = { title: "Từ vựng theo chủ đề | HSK 3.0" };

export default function TopicsPage() {
  return <ProtectedRoute><TopicVocabularyClient /></ProtectedRoute>;
}
