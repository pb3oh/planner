import { describe, expect, it } from "vitest";
import {
  evaluateDefinitionOfReady,
  type DorSpec,
} from "@/lib/gates/definitionOfReady";

const ready: DorSpec = {
  problem: "Org admins cannot require SSO, so contractors share passwords.",
  outcome: "Admins can enforce SSO for all members of a workspace.",
  successMetric: "80% of enterprise orgs on SSO within 60 days of GA",
  scope: "OIDC SSO enforce + session timeout for members.",
  nonGoals: "No SCIM, no IdP-initiated logout in this slice.",
  risks: ["IdP variance across customers"],
  openQuestions: [],
  acceptanceCriteria: [
    {
      given: "an org admin with OIDC configured",
      when: "they require SSO for members",
      then: "password login is rejected for members of that org",
    },
  ],
};

describe("evaluateDefinitionOfReady", () => {
  it("passes a complete spec", () => {
    const result = evaluateDefinitionOfReady(ready);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("lists every missing field", () => {
    const result = evaluateDefinitionOfReady({
      problem: "",
      outcome: "",
      successMetric: "",
      scope: "",
      nonGoals: "",
      risks: [],
      openQuestions: ["who owns this?"],
      acceptanceCriteria: [{ given: "", when: "", then: "" }],
    });
    expect(result.ready).toBe(false);
    expect(result.missing.map((m) => m.id)).toEqual([
      "problem",
      "outcome",
      "successMetric",
      "scope",
      "nonGoals",
      "acs",
      "risks",
      "openQuestions",
    ]);
  });

  it("rejects incomplete ACs and unresolved questions", () => {
    const result = evaluateDefinitionOfReady({
      ...ready,
      openQuestions: ["What is the SLA?"],
      acceptanceCriteria: [{ given: "a user", when: "", then: "it works" }],
    });
    expect(result.ready).toBe(false);
    expect(result.missing.map((m) => m.id)).toEqual(["acs", "openQuestions"]);
  });

  it("treats explicit none-risk as identified", () => {
    const result = evaluateDefinitionOfReady({
      ...ready,
      risks: ["None identified after review"],
    });
    expect(result.ready).toBe(true);
  });
});
