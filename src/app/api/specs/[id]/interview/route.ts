import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { complete, extractJson, taskTag } from "@/lib/llm";
import { requireUser } from "@/lib/session";
import { getOrCreateSpec, specToDor } from "@/lib/specs";

type InterviewPayload = {
  type?: string;
  question?: string;
  spec?: {
    problem?: string;
    outcome?: string;
    successMetric?: string;
    scope?: string;
    nonGoals?: string;
    constraints?: string;
    risks?: string[];
    openQuestions?: string[];
  };
  specPatch?: Record<string, unknown>;
  acceptanceCriteria?: { given: string; when: string; then: string }[];
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await ctx.params;
  const spec = await getOrCreateSpec(Number(id));
  if (!spec) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { message?: string };
  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  await prisma.interviewTurn.create({
    data: { specId: spec.id, role: "user", content: message },
  });

  const dor = specToDor(spec);
  const missing = dor.missing.map((m) => m.id).join(", ");
  const history = [
    ...spec.interviewTurns.map((t) => ({
      role: t.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: t.content,
    })),
    { role: "user" as const, content: message },
  ];

  const raw = await complete({
    system: `${taskTag("interview")}
You are interviewing a PM until the spec is build-ready.
Ask one question at a time. When ready, return JSON:
{"type":"complete","spec":{problem,outcome,successMetric,scope,nonGoals,constraints,risks,openQuestions},"acceptanceCriteria":[{given,when,then}]}
Otherwise return {"type":"question","question":"..."}.
SPEC_JSON: ${JSON.stringify({
      problem: spec.problem,
      outcome: spec.outcome,
      successMetric: spec.successMetric,
      scope: spec.scope,
      nonGoals: spec.nonGoals,
      constraints: spec.constraints,
      risks: spec.risks,
      openQuestions: spec.openQuestions,
      acceptanceCriteria: spec.acceptanceCriteria,
    })}
MISSING: ${missing || "none"}`,
    messages: history,
  });

  let parsed: InterviewPayload = {};
  try {
    parsed = extractJson(raw) as InterviewPayload;
  } catch {
    parsed = { type: "question", question: raw };
  }

  const reply =
    parsed.question ||
    (parsed.type === "complete"
      ? "I have enough to draft a build-ready spec. Review the fields below."
      : raw);

  await prisma.interviewTurn.create({
    data: { specId: spec.id, role: "assistant", content: reply },
  });

  const patch = (parsed.spec ?? parsed.specPatch ?? {}) as Record<string, unknown>;
  const nextData: Record<string, unknown> = { status: "interviewing" };
  for (const key of [
    "problem",
    "outcome",
    "successMetric",
    "scope",
    "nonGoals",
    "constraints",
    "risks",
    "openQuestions",
  ]) {
    if (key in patch) nextData[key] = patch[key];
  }

  if (parsed.type === "complete" && parsed.spec) {
    Object.assign(nextData, parsed.spec, { status: "drafting" });
  }

  await prisma.spec.update({ where: { id: spec.id }, data: nextData });

  if (parsed.acceptanceCriteria?.length) {
    await prisma.acceptanceCriterion.deleteMany({ where: { specId: spec.id } });
    await prisma.acceptanceCriterion.createMany({
      data: parsed.acceptanceCriteria.map((ac, i) => ({
        specId: spec.id,
        given: ac.given,
        when: ac.when,
        then: ac.then,
        sortOrder: i,
      })),
    });
  }

  const updated = await getOrCreateSpec(Number(id));
  const nextDor = specToDor(updated!);
  if (nextDor.ready && updated) {
    await prisma.spec.update({
      where: { id: updated.id },
      data: { status: "ready", readyAt: updated.readyAt ?? new Date() },
    });
  }

  const finalSpec = await getOrCreateSpec(Number(id));
  return NextResponse.json({
    reply,
    spec: { ...finalSpec, dor: specToDor(finalSpec!) },
  });
}
