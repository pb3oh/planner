export type StatusEvent = {
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: Date | string;
};

export type CycleSegment = {
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
};

export type CycleTime = {
  startedAt: string | null;
  lastAt: string | null;
  totalMs: number;
  segments: CycleSegment[];
};

export function computeCycleTime(events: StatusEvent[], now = new Date()): CycleTime {
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  if (sorted.length === 0) {
    return { startedAt: null, lastAt: null, totalMs: 0, segments: [] };
  }

  const segments: CycleSegment[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const status = current.toStatus ?? "unknown";
    const startedAt = new Date(current.createdAt);
    const endedAt = sorted[i + 1] ? new Date(sorted[i + 1].createdAt) : now;
    segments.push({
      status,
      startedAt: startedAt.toISOString(),
      endedAt: sorted[i + 1] ? endedAt.toISOString() : null,
      durationMs: Math.max(0, endedAt.getTime() - startedAt.getTime()),
    });
  }

  const startedAt = new Date(sorted[0].createdAt);
  const lastAt = new Date(sorted[sorted.length - 1].createdAt);
  return {
    startedAt: startedAt.toISOString(),
    lastAt: lastAt.toISOString(),
    totalMs: Math.max(0, now.getTime() - startedAt.getTime()),
    segments,
  };
}

export function formatDuration(ms: number): string {
  const hours = ms / 36e5;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  const days = hours / 24;
  return `${Math.round(days * 10) / 10}d`;
}
