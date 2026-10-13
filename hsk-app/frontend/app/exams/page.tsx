import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ExamClient from "@/components/learning/ExamClient";

export const metadata = { title: "Luyện thi HSK | HSK 3.0" };
export default function ExamsPage() { return <ProtectedRoute><ExamClient /></ProtectedRoute>; }
