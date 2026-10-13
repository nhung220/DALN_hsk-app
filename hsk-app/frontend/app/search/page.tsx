import SearchClient from "@/components/vocabulary/SearchClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata = {
  title: "Tra từ – HSK Vocabulary",
  description: "Tra cứu từ vựng HSK 1–7 theo chữ Hán, pinyin hoặc nghĩa",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialQuery = params.q ?? "";
  return (
    <ProtectedRoute>
      <SearchClient initialQuery={initialQuery} />
    </ProtectedRoute>
  );
}
