import NotebookClient from "@/components/vocabulary/NotebookClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata = {
  title: "Sổ tay – HSK Vocabulary",
  description: "Danh sách từ yêu thích và ghi chú cá nhân của bạn",
};

export default function NotebookPage() {
  return (
    <ProtectedRoute>
      <NotebookClient />
    </ProtectedRoute>
  );
}
