import type { ExportSpec } from "@/lib/exporters/types";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function acBlock(spec: ExportSpec): string {
  return spec.acceptanceCriteria
    .map(
      (ac, i) =>
        `AC${i + 1}: Given ${ac.given}; When ${ac.when}; Then ${ac.then}`
    )
    .join(" | ");
}

export function toJiraCsv(spec: ExportSpec): string {
  const header = [
    "Summary",
    "Issue Type",
    "Priority",
    "Description",
    "Acceptance Criteria",
  ];
  const parent = [
    spec.title,
    "Story",
    spec.priority ?? "P2",
    [spec.problem, spec.outcome, spec.successMetric].filter(Boolean).join(" | "),
    acBlock(spec),
  ].map(csvEscape);

  const taskRows = spec.tasks.map((t) =>
    [
      t.title,
      "Sub-task",
      spec.priority ?? "P2",
      t.description,
      "",
    ].map(csvEscape)
  );

  return [header.join(","), parent.join(","), ...taskRows.map((r) => r.join(","))].join(
    "\n"
  );
}

export function toJiraJson(spec: ExportSpec): unknown {
  return {
    issues: [
      {
        summary: spec.title,
        issuetype: "Story",
        priority: spec.priority ?? "P2",
        description: {
          problem: spec.problem,
          outcome: spec.outcome,
          successMetric: spec.successMetric,
          scope: spec.scope,
          nonGoals: spec.nonGoals,
        },
        acceptanceCriteria: spec.acceptanceCriteria,
      },
      ...spec.tasks.map((t) => ({
        summary: t.title,
        issuetype: "Sub-task",
        parent: spec.title,
        description: t.description,
      })),
    ],
  };
}
