import { prisma } from "@/lib/prisma";
import type { ExportSpec } from "@/lib/exporters";
import { evaluateDefinitionOfReady } from "@/lib/gates/definitionOfReady";

export const specInclude = {
  acceptanceCriteria: { orderBy: { sortOrder: "asc" as const } },
  tasks: { orderBy: { sortOrder: "asc" as const } },
  interviewTurns: { orderBy: { createdAt: "asc" as const } },
};

export async function getOrCreateSpec(itemId: number) {
  const existing = await prisma.spec.findUnique({
    where: { itemId },
    include: specInclude,
  });
  if (existing) return existing;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return null;

  return prisma.spec.create({
    data: {
      itemId,
      problem: item.description || "",
      outcome: item.businessOutcome || "",
      successMetric: item.successMetric || "",
      scope: item.scopeReason || "",
      risks: item.risks,
      openQuestions: item.openQuestions,
    },
    include: specInclude,
  });
}

export function specToDor(spec: {
  problem: string;
  outcome: string;
  successMetric: string;
  scope: string;
  nonGoals: string;
  risks: string[];
  openQuestions: string[];
  acceptanceCriteria: { given: string; when: string; then: string }[];
}) {
  return evaluateDefinitionOfReady({
    problem: spec.problem,
    outcome: spec.outcome,
    successMetric: spec.successMetric,
    scope: spec.scope,
    nonGoals: spec.nonGoals,
    risks: spec.risks,
    openQuestions: spec.openQuestions,
    acceptanceCriteria: spec.acceptanceCriteria,
  });
}

export function toExportSpec(
  title: string,
  spec: {
    id: string;
    problem: string;
    outcome: string;
    successMetric: string;
    scope: string;
    nonGoals: string;
    constraints: string;
    risks: string[];
    openQuestions: string[];
    acceptanceCriteria: { given: string; when: string; then: string }[];
    tasks: { title: string; description: string }[];
  },
  extra?: { priority?: string; requester?: string }
): ExportSpec {
  return {
    id: spec.id,
    title,
    problem: spec.problem,
    outcome: spec.outcome,
    successMetric: spec.successMetric,
    scope: spec.scope,
    nonGoals: spec.nonGoals,
    constraints: spec.constraints,
    risks: spec.risks,
    openQuestions: spec.openQuestions,
    priority: extra?.priority,
    requester: extra?.requester,
    acceptanceCriteria: spec.acceptanceCriteria,
    tasks: spec.tasks,
  };
}
