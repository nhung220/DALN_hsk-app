import ReviewClient from "@/components/review/ReviewClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ôn tập hôm nay | HSK 3.0" };

export default function ReviewPage() {
  return (
    <ProtectedRoute>
      <ReviewClient />
    </ProtectedRoute>
  );
}
