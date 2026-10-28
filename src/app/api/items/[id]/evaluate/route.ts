import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { complete, extractJson, taskTag } from "@/lib/llm";
import type { Priority } from "@prisma/client";

const ITEM_INCLUDE = {
  l0: { select: { name: true, color: true } },
  l1: { select: { name: true } },
  team: { select: { name: true } },
} as const;

type EvalResult = {
  inScope?: boolean;
  scopeReason?: string;
  aiRationale?: string;
  score?: number;
  effort?: number;
  effortRationale?: string;
  priority?: string;
  risks?: string[];
  openQuestions?: string[];
};

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await ctx.params;
  const itemId = Number(id);
  const existing = await prisma.item.findUnique({ where: { id: itemId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const raw = await complete({
    system: `${taskTag("evaluate")}
ITEM_JSON: ${JSON.stringify({
      id: existing.id,
      title: existing.title,
      description: existing.description,
      businessOutcome: existing.businessOutcome,
      successMetric: existing.successMetric,
      needByDate: existing.needByDate,
      requesterBU: existing.requesterBU,
    })}
Return JSON with inScope, scopeReason, aiRationale, score (0-100), effort (1-5), effortRationale, priority (P0-P3), risks[], openQuestions[].`,
    messages: [{ role: "user", content: "Evaluate this planning item." }],
  });

  let parsed: EvalResult = {};
  try {
    parsed = extractJson(raw) as EvalResult;
  } catch {
    parsed = { aiRationale: raw.slice(0, 500), score: existing.score };
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      inScope: parsed.inScope ?? existing.inScope,
      scopeReason: parsed.scopeReason ?? existing.scopeReason,
      aiRationale: parsed.aiRationale ?? existing.aiRationale,
      score: parsed.score ?? existing.score,
      effort: parsed.effort ?? existing.effort,
      effortRationale: parsed.effortRationale ?? existing.effortRationale,
      priority: (parsed.priority as Priority | undefined) ?? existing.priority,
      risks: parsed.risks ?? existing.risks,
      openQuestions: parsed.openQuestions ?? existing.openQuestions,
    },
    include: ITEM_INCLUDE,
  });

  return NextResponse.json(item);
}
