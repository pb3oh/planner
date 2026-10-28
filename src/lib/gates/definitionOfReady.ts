export type DorCriterion = {
  given: string;
  when: string;
  then: string;
};

export type DorSpec = {
  problem: string;
  outcome: string;
  successMetric: string;
  scope: string;
  nonGoals: string;
  risks: string[];
  openQuestions: string[];
  acceptanceCriteria: DorCriterion[];
};

export type DorCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type DorResult = {
  ready: boolean;
  checks: DorCheck[];
  missing: DorCheck[];
};

function filled(value: string | null | undefined): boolean {
  return (value ?? "").replace(/\s+/g, " ").trim().length >= 8;
}

function completeAc(ac: DorCriterion): boolean {
  return filled(ac.given) && filled(ac.when) && filled(ac.then);
}

export function evaluateDefinitionOfReady(spec: DorSpec): DorResult {
  const completeAcs = spec.acceptanceCriteria.filter(completeAc);
  const checks: DorCheck[] = [
    {
      id: "problem",
      label: "Problem statement",
      passed: filled(spec.problem),
      detail: "Who is stuck, and what is broken today?",
    },
    {
      id: "outcome",
      label: "Outcome",
      passed: filled(spec.outcome),
      detail: "What should be true after this ships?",
    },
    {
      id: "successMetric",
      label: "Success metric",
      passed: filled(spec.successMetric),
      detail: "A measurable target (metric + threshold + window).",
    },
    {
      id: "scope",
      label: "In-scope",
      passed: filled(spec.scope),
      detail: "What this slice will change.",
    },
    {
      id: "nonGoals",
      label: "Non-goals",
      passed: filled(spec.nonGoals),
      detail: "What we will not do in this slice.",
    },
    {
      id: "acs",
      label: "Acceptance criteria (Given/When/Then)",
      passed: completeAcs.length >= 1,
      detail:
        completeAcs.length === 0
          ? "Need at least one complete Given / When / Then."
          : `${completeAcs.length} complete AC${completeAcs.length === 1 ? "" : "s"}.`,
    },
    {
      id: "risks",
      label: "Risks identified",
      passed: spec.risks.some((r) => r.trim().length > 0),
      detail: 'List risks, or explicitly record "None identified after review".',
    },
    {
      id: "openQuestions",
      label: "Open questions resolved",
      passed: spec.openQuestions.filter((q) => q.trim().length > 0).length === 0,
      detail: "Clear remaining questions or mark them resolved.",
    },
  ];
  const missing = checks.filter((c) => !c.passed);
  return { ready: missing.length === 0, checks, missing };
}
