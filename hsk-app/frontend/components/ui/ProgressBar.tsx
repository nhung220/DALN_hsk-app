"use client";

interface ProgressBarProps {
  value: number;       // 0–100
  color?: "primary" | "review";
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  color = "primary",
  height = 6,
  showLabel = false,
}: ProgressBarProps) {
  const clamp = Math.min(100, Math.max(0, value));

  const fillColor = color === "review" ? "#1B9E6E" : "#6C3CE1";

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, background: "#F0E9B8" }}   /* warm cream track */
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamp}%`, background: fillColor }}
        />
      </div>
      {showLabel && (
        <span className="text-xs w-8 text-right" style={{ color: "#A8956A" }}>
          {Math.round(clamp)}%
        </span>
      )}
    </div>
  );
}
