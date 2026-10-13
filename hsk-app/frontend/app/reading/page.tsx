import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ReadingClient from "@/components/learning/ReadingClient";

export const metadata = { title: "Luyện đọc hiểu | HSK 3.0" };
export default function ReadingPage() { return <ProtectedRoute><ReadingClient /></ProtectedRoute>; }
