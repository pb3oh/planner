import { describe, expect, it } from "vitest";
import { toGherkinFeature } from "@/lib/exporters/gherkin";
import { toJiraCsv, toJiraJson } from "@/lib/exporters/jira";
import { toOpenSpecMarkdown } from "@/lib/exporters/openspec";
import type { ExportSpec } from "@/lib/exporters/types";

const spec: ExportSpec = {
  id: "spec_1",
  title: "Workspace SSO",
  problem: "Contractors share passwords.",
  outcome: "SSO is enforced for members.",
  successMetric: "80% of enterprise orgs on SSO",
  scope: "OIDC enforce",
  nonGoals: "No SCIM",
  risks: ["IdP variance"],
  openQuestions: [],
  priority: "P0",
  acceptanceCriteria: [
    {
      given: "an admin with OIDC configured",
      when: "they require SSO",
      then: "password login is rejected",
    },
  ],
  tasks: [
    {
      title: "Implement SSO enforce",
      description: "Given an admin with OIDC configured",
    },
  ],
};

describe("exporters", () => {
  it("writes OpenSpec markdown with required headings", () => {
    const md = toOpenSpecMarkdown(spec);
    expect(md).toContain("# Workspace SSO");
    expect(md).toContain("## Problem");
    expect(md).toContain("## Acceptance criteria");
    expect(md).toContain("**Given** an admin with OIDC configured");
  });

  it("writes Jira CSV with story + sub-task rows", () => {
    const csv = toJiraCsv(spec);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Summary");
    expect(lines[1]).toContain("Workspace SSO");
    expect(lines[1]).toContain("Story");
    expect(lines[2]).toContain("Sub-task");
  });

  it("writes Jira JSON issues array", () => {
    const json = toJiraJson(spec) as { issues: { issuetype: string }[] };
    expect(json.issues).toHaveLength(2);
    expect(json.issues[0].issuetype).toBe("Story");
  });

  it("writes Gherkin Feature/Scenario stubs", () => {
    const gherkin = toGherkinFeature(spec);
    expect(gherkin).toMatch(/^Feature: Workspace SSO/m);
    expect(gherkin).toContain("  Scenario:");
    expect(gherkin).toContain("    Given an admin with OIDC configured");
    expect(gherkin).toContain("    When they require SSO");
    expect(gherkin).toContain("    Then password login is rejected");
  });
});
