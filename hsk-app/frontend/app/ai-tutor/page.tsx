import AiTutorClient from "@/components/ai/AiTutorClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata = {
  title: "Gia sư AI | HSK 3.0",
  description: "Chấm ngữ pháp, chấm bài dịch và giải thích từ vựng bằng AI",
};

export default function AiTutorPage() {
  return (
    <ProtectedRoute>
      <AiTutorClient />
    </ProtectedRoute>
  );
}
