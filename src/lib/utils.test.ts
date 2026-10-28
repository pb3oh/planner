import { describe, expect, it } from "vitest";
import { addWeeks, effortFromLabel, statusLabel } from "@/lib/utils";

describe("utils", () => {
  it("maps effort labels", () => {
    expect(effortFromLabel("S")).toBe(2);
    expect(effortFromLabel("unknown")).toBe(3);
  });

  it("labels statuses", () => {
    expect(statusLabel("Needs_Review")).toBe("Needs Review");
  });

  it("adds weeks to an ISO date", () => {
    expect(addWeeks("2026-01-01", 2)).toBe("2026-01-15");
  });
});
