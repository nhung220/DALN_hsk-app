export type ModuleName = "topic" | "reading" | "dialogue" | "exam" | "pronunciation";
export interface ModuleProgressRow { module: ModuleName; itemId: string; completed: boolean; bestScore: number | null; attempts: number }

export async function loadCloudModuleProgress(): Promise<ModuleProgressRow[] | null> {
  try {
    const response = await fetch("/api/progress/modules", { credentials: "include" });
    if (!response.ok) return null;
    const data = await response.json() as { progress?: ModuleProgressRow[] };
    return data.progress ?? [];
  } catch { return null; }
}

export function saveCloudModuleProgress(module: ModuleName, itemId: string, values: { completed?: boolean; score?: number; countAttempt?: boolean }) {
  return fetch("/api/progress/modules", {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify({ module, itemId, ...values }),
  }).catch(() => null);
}
