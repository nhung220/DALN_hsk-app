import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "review" | "gray" | "yellow" | "red";
  size?: "sm" | "md";
}

const variants = {
  primary: "bg-primary-500/20 text-primary-500 border border-primary-500/30",
  review:  "bg-review-500/20  text-review-500  border border-review-500/30",
  // Light theme — warm muted on cream background
  gray:    "border",
  yellow:  "bg-yellow-100 text-yellow-700 border border-yellow-300",
  red:     "bg-red-100    text-red-700    border border-red-300",
};

export default function Badge({
  children,
  variant = "gray",
  size = "sm",
}: BadgeProps) {
  // "gray" gets inline style so it stays visible on any background
  const grayStyle = variant === "gray"
    ? { background: "#FFF3B0", color: "#78614A", borderColor: "#E8D98A" }
    : undefined;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variants[variant]
      )}
      style={grayStyle}
    >
      {children}
    </span>
  );
}
