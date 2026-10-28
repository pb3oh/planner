"use client";

import { useHierarchy } from "@/hooks/useHierarchy";

export function L0Tag({
  l0Id,
  l1Id,
  teamId,
}: {
  l0Id: string;
  l1Id?: string;
  teamId?: string;
}) {
  const { l0s } = useHierarchy();
  const l0 = l0s.find((x) => x.id === l0Id);
  const l1 = l0?.l1s.find((x) => x.id === l1Id);
  const team = l1?.teams.find((x) => x.id === teamId);
  const parts = [l0?.name, l1?.name, team?.name].filter(Boolean);
  const color = l0?.color ?? "#64748b";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        color: "#64748b",
        fontFamily: "var(--font-sans)",
        maxWidth: 280,
      }}
      title={parts.join(" / ")}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {parts.join(" · ") || l0Id}
      </span>
    </span>
  );
}
