import { describe, expect, it } from "vitest";
import { computeCycleTime, formatDuration } from "@/lib/cycleTime";

describe("computeCycleTime", () => {
  it("builds segments between status transitions", () => {
    const now = new Date("2026-04-10T00:00:00.000Z");
    const result = computeCycleTime(
      [
        {
          fromStatus: null,
          toStatus: "Needs_Review",
          createdAt: "2026-04-01T00:00:00.000Z",
        },
        {
          fromStatus: "Needs_Review",
          toStatus: "Accepted",
          createdAt: "2026-04-03T00:00:00.000Z",
        },
        {
          fromStatus: "Accepted",
          toStatus: "In_Progress",
          createdAt: "2026-04-07T00:00:00.000Z",
        },
      ],
      now
    );
    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].durationMs).toBe(2 * 86400000);
    expect(result.segments[1].status).toBe("Accepted");
    expect(result.totalMs).toBe(9 * 86400000);
  });

  it("formats durations", () => {
    expect(formatDuration(12 * 36e5)).toBe("12h");
    expect(formatDuration(2.4 * 86400000)).toBe("2.4d");
  });
});
