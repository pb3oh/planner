import type { ExportSpec } from "@/lib/exporters/types";

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function toGherkinFeature(spec: ExportSpec): string {
  const feature = spec.title.replace(/\n/g, " ");
  const scenarios = spec.acceptanceCriteria.map((ac, i) => {
    const name = slug(ac.then).slice(0, 72) || `criterion ${i + 1}`;
    return `  Scenario: ${name}
    Given ${ac.given}
    When ${ac.when}
    Then ${ac.then}`;
  });
  return `Feature: ${feature}
  ${spec.outcome || spec.problem || ""}

${scenarios.join("\n\n") || "  # No acceptance criteria yet"}
`;
}
