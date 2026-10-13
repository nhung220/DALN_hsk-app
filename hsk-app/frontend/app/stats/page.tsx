import StatsClient from "@/components/stats/StatsClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata = { title: "Thống kê ôn tập | HSK 3.0" };
export const dynamic  = "force-dynamic";

export default function StatsPage() {
  return (
    <ProtectedRoute>
      <StatsClient />
    </ProtectedRoute>
  );
}
