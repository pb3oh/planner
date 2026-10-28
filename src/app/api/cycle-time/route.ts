import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCycleTime, formatDuration } from "@/lib/cycleTime";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const items = await prisma.item.findMany({
    include: { events: { orderBy: { createdAt: "asc" } } },
    orderBy: { id: "asc" },
  });

  const rows = items.map((item) => {
    const cycle = computeCycleTime(
      item.events.filter((e) => e.type === "status_change" && e.toStatus)
    );
    return {
      id: item.id,
      title: item.title,
      status: item.status,
      startedAt: cycle.startedAt,
      total: formatDuration(cycle.totalMs),
      totalMs: cycle.totalMs,
      segments: cycle.segments.map((s) => ({
        ...s,
        duration: formatDuration(s.durationMs),
      })),
    };
  });

  return NextResponse.json(rows);
}
