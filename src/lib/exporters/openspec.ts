import type { ExportSpec } from "@/lib/exporters/types";

export function toOpenSpecMarkdown(spec: ExportSpec): string {
  const acs = spec.acceptanceCriteria
    .map(
      (ac, i) =>
        `### AC${i + 1}\n\n- **Given** ${ac.given}\n- **When** ${ac.when}\n- **Then** ${ac.then}`
    )
    .join("\n\n");
  const tasks = spec.tasks
    .map((t, i) => `${i + 1}. ${t.title}${t.description ? ` — ${t.description}` : ""}`)
    .join("\n");
  const risks = spec.risks.map((r) => `- ${r}`).join("\n") || "- None";
  const questions = spec.openQuestions.map((q) => `- ${q}`).join("\n") || "- None";

  return `# ${spec.title}

## Problem

${spec.problem || "_TBD_"}

## Outcome

${spec.outcome || "_TBD_"}

## Success metric

${spec.successMetric || "_TBD_"}

## Scope

${spec.scope || "_TBD_"}

## Non-goals

${spec.nonGoals || "_TBD_"}

## Constraints

${spec.constraints || "_None_"}

## Acceptance criteria

${acs || "_None yet_"}

## Risks

${risks}

## Open questions

${questions}

## Tasks

${tasks || "_None yet_"}
`;
}
