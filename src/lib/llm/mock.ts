import type { ChatMessage, CompleteOptions, LLMProvider } from "@/lib/llm/types";
import { parseTaskKind } from "@/lib/llm/types";

function lastUser(messages: ChatMessage[]): string {
  return [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
}

function section(system: string | undefined, label: string): string {
  if (!system) return "";
  const re = new RegExp(`${label}:\\s*([\\s\\S]*?)(?:\\n[A-Z0-9_]+:|$)`);
  return (system.match(re)?.[1] ?? "").trim();
}

function stableScore(text: string, min = 58, max = 92): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return min + (h % (max - min + 1));
}

function shapeFromRaw(raw: string) {
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const first = lines[0]?.replace(/^#+\s*/, "") ?? raw;
  const stripped = first
    .replace(/^(please |can we |we need to |we need |need to |need )/i, "")
    .replace(/\.$/, "")
    .trim();
  const title =
    (stripped.charAt(0).toUpperCase() + stripped.slice(1)).slice(0, 90) ||
    "Untitled request";
  return {
    title,
    summary: lines[1] ?? `Shaped from intake: ${title}`,
    problemStatement:
      lines.find((l) => /problem/i.test(l)) ??
      `Users currently lack a reliable way to: ${title.toLowerCase()}.`,
    proposedSolution:
      lines.find((l) => /solution|proposal|we should/i.test(l)) ??
      `Ship a thin vertical slice that delivers ${title.toLowerCase()} with tests and a review gate.`,
    whoItHelps: "Requesting team and downstream consumers of this surface",
    successMetric: "Time-to-complete drops 30% within 60 days of launch",
    estimatedEffort: "M",
    priority: "P2",
  };
}

function interviewReply(system: string | undefined, user: string): string {
  const specRaw = section(system, "SPEC_JSON") || "{}";
  let spec: Record<string, unknown> = {};
  try {
    spec = JSON.parse(specRaw) as Record<string, unknown>;
  } catch {
    spec = {};
  }
  const missing = (section(system, "MISSING") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const fieldMap: Record<string, string> = {
    problem: "problem",
    outcome: "outcome",
    successMetric: "successMetric",
    scope: "scope",
    nonGoals: "nonGoals",
    risks: "risks",
    openQuestions: "openQuestions",
    acs: "acceptanceCriteria",
  };

  const next = missing[0];
  const questions: Record<string, string> = {
    problem: "What problem are we solving, and for whom?",
    outcome: "What does success look like — the outcome you want?",
    successMetric: "How will we measure that outcome (a concrete metric + target)?",
    scope: "What is explicitly in scope for this slice?",
    nonGoals: "What is out of scope / a non-goal for this slice?",
    risks: "What are the main risks? If none, say \"None identified after review\".",
    openQuestions: "Any remaining open questions? If they are resolved, reply \"none\".",
    acs: "Give 2–3 acceptance criteria as Given / When / Then.",
  };

  if (!next) {
    return JSON.stringify({
      type: "complete",
      spec: {
        problem: spec.problem || user || "Problem captured during interview.",
        outcome: spec.outcome || "Users complete the core workflow without workarounds.",
        successMetric: spec.successMetric || "p95 task time −30% within 60 days",
        scope: spec.scope || "Happy path plus one documented edge case.",
        nonGoals: spec.nonGoals || "No platform rewrite; no unrelated reporting.",
        risks: Array.isArray(spec.risks) && (spec.risks as string[]).length
          ? spec.risks
          : ["Dependency on existing auth session"],
        openQuestions: [],
        constraints: spec.constraints || "Must ship behind a feature flag.",
      },
      acceptanceCriteria: [
        {
          given: "an authenticated user on the relevant surface",
          when: "they complete the primary workflow",
          then: "the new behavior is persisted and visible on refresh",
        },
        {
          given: "a user who is not authorized",
          when: "they attempt the same workflow",
          then: "the action is rejected with a clear error",
        },
        {
          given: "the feature flag is off",
          when: "a user visits the surface",
          then: "the previous behavior is unchanged",
        },
      ],
    });
  }

  if (user && next) {
    const filled = { ...spec };
    const key = fieldMap[next] ?? next;
    if (next === "risks") {
      filled.risks = user.toLowerCase() === "none" ? ["None identified after review"] : [user];
    } else if (next === "openQuestions") {
      filled.openQuestions =
        /^(none|n\/a|resolved)/i.test(user.trim()) ? [] : [user];
    } else if (next === "acs") {
      filled.acceptanceCriteria = [
        {
          given: "the preconditions described by the PM",
          when: "the user performs the requested action",
          then: user.slice(0, 180),
        },
      ];
    } else {
      filled[key] = user;
    }
    const remaining = missing.slice(1);
    if (remaining.length === 0) {
      return JSON.stringify({
        type: "complete",
        spec: {
          problem: filled.problem || "Problem captured during interview.",
          outcome: filled.outcome || "Desired outcome captured during interview.",
          successMetric: filled.successMetric || "Success metric captured during interview.",
          scope: filled.scope || "In-scope slice captured during interview.",
          nonGoals: filled.nonGoals || "Non-goals captured during interview.",
          risks: filled.risks ?? ["None identified after review"],
          openQuestions: filled.openQuestions ?? [],
          constraints: filled.constraints || "",
        },
        acceptanceCriteria: (filled.acceptanceCriteria as unknown[]) ?? [
          {
            given: "an authenticated user",
            when: "they complete the primary workflow",
            then: "the result is saved",
          },
        ],
      });
    }
    return JSON.stringify({
      type: "question",
      question: questions[remaining[0]] ?? `Please provide: ${remaining[0]}`,
      specPatch: filled,
    });
  }

  return JSON.stringify({
    type: "question",
    question: questions[next] ?? `Please provide: ${next}`,
  });
}

function evaluateReply(system: string | undefined): string {
  const itemRaw = section(system, "ITEM_JSON") || lastUser([]);
  let title = "this item";
  try {
    const item = JSON.parse(itemRaw) as { title?: string; description?: string };
    title = item.title ?? title;
  } catch {
    /* ignore */
  }
  const score = stableScore(title);
  const effort = score > 85 ? 4 : score > 70 ? 3 : 2;
  return JSON.stringify({
    inScope: true,
    scopeReason: `Fits the owning team's charter for "${title}".`,
    aiRationale: `Clear problem/outcome pair. Score reflects impact vs. current capacity. Recommend confirming effort with the team lead.`,
    score,
    effort,
    effortRationale: `Mock estimate from request complexity (${effort === 4 ? "cross-surface" : "single-surface"}).`,
    priority: score >= 85 ? "P0" : score >= 75 ? "P1" : "P2",
    risks: ["Scope may expand during interview", "Downstream dependency not yet confirmed"],
    openQuestions: ["Who is the DRI for acceptance?"],
  });
}

function decomposeReply(system: string | undefined): string {
  let acs: { given: string; when: string; then: string }[] = [];
  try {
    const spec = JSON.parse(section(system, "SPEC_JSON") || "{}") as {
      acceptanceCriteria?: { given: string; when: string; then: string }[];
    };
    acs = spec.acceptanceCriteria ?? [];
  } catch {
    acs = [];
  }
  if (acs.length === 0) {
    acs = [
      { given: "a user", when: "they use the feature", then: "it works" },
    ];
  }
  const tasks = acs.map((ac, i) => ({
    title: `Implement AC ${i + 1}: ${ac.then.slice(0, 80)}`,
    description: `Given ${ac.given}\nWhen ${ac.when}\nThen ${ac.then}`,
    acIndex: i,
  }));
  tasks.push({
    title: "Add tests and a review gate for this spec",
    description: "Cover the acceptance criteria with automated tests and a PR checklist.",
    acIndex: 0,
  });
  return JSON.stringify({ tasks });
}

export const mockProvider: LLMProvider = {
  id: "mock",
  async complete(options: CompleteOptions): Promise<string> {
    const kind = parseTaskKind(options.system);
    const user = lastUser(options.messages);

    switch (kind) {
      case "shape":
        return JSON.stringify(shapeFromRaw(user || section(options.system, "RAW")));
      case "evaluate":
        return evaluateReply(options.system);
      case "interview":
        return interviewReply(options.system, user);
      case "decompose":
        return decomposeReply(options.system);
      case "chat":
      default:
        return [
          "Based on the current plan (mock advisor):",
          user
            ? `You asked: "${user.slice(0, 200)}"`
            : "Ask about an item id, a team, or what would need to be true to pull something above the line.",
          "",
          "I can point at trade-offs (effort, dates, score) without committing a team. Reference items by [id].",
          "Switch LLM_PROVIDER=anthropic and set ANTHROPIC_API_KEY for a live model.",
        ].join("\n");
    }
  },
};
