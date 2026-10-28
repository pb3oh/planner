import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getOrCreateSpec, specToDor } from "@/lib/specs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await ctx.params;
  const spec = await getOrCreateSpec(Number(id));
  if (!spec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...spec, dor: specToDor(spec) });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await ctx.params;
  const spec = await getOrCreateSpec(Number(id));
  if (!spec) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as {
    problem?: string;
    outcome?: string;
    successMetric?: string;
    scope?: string;
    nonGoals?: string;
    constraints?: string;
    risks?: string[];
    openQuestions?: string[];
    acceptanceCriteria?: { given: string; when: string; then: string }[];
  };

  const data: Record<string, unknown> = {};
  for (const key of [
    "problem",
    "outcome",
    "successMetric",
    "scope",
    "nonGoals",
    "constraints",
    "risks",
    "openQuestions",
  ] as const) {
    if (key in body) data[key] = body[key];
  }

  await prisma.spec.update({ where: { id: spec.id }, data });

  if (body.acceptanceCriteria) {
    await prisma.acceptanceCriterion.deleteMany({ where: { specId: spec.id } });
    if (body.acceptanceCriteria.length) {
      await prisma.acceptanceCriterion.createMany({
        data: body.acceptanceCriteria.map((ac, i) => ({
          specId: spec.id,
          given: ac.given,
          when: ac.when,
          then: ac.then,
          sortOrder: i,
        })),
      });
    }
  }

  const updated = await getOrCreateSpec(Number(id));
  return NextResponse.json({ ...updated, dor: specToDor(updated!) });
}
