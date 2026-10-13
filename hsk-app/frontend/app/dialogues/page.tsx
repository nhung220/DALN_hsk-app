import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DialogueClient from "@/components/learning/DialogueClient";

export const metadata = { title: "Luyện hội thoại | HSK 3.0" };
export default function DialoguesPage() { return <ProtectedRoute><DialogueClient /></ProtectedRoute>; }
