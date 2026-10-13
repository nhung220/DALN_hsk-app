import { fetchLevels } from "@/lib/hskDataServer";
import VocabularyClient from "@/components/vocabulary/VocabularyClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Không force-dynamic — levels.json là static, Next.js sẽ cache kết quả
export const revalidate = 3600; // revalidate mỗi 1 giờ

export default async function VocabularyPage() {
  const levels = await fetchLevels();
  return (
    <ProtectedRoute>
      <VocabularyClient levels={levels} />
    </ProtectedRoute>
  );
}
