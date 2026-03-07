interface GrowthBadgeProps {
  percent: number | null;
}

export function GrowthBadge({ percent }: GrowthBadgeProps) {
  if (percent === null) return null;

  const isPositive = percent >= 0;
  const color = isPositive ? "var(--emerald)" : "var(--red)";
  const arrow = isPositive ? "↑" : "↓";

  return (
    <span
      className="mono text-xs font-medium px-1.5 py-0.5 rounded"
      style={{
        color,
        backgroundColor: isPositive
          ? "rgba(16,185,129,0.1)"
          : "rgba(239,68,68,0.1)",
      }}
    >
      {arrow} {Math.abs(percent)}%
    </span>
  );
}
