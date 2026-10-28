import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { complete, extractJson, taskTag } from "@/lib/llm";
import { logItemEvent } from "@/lib/events";
import { requireUser } from "@/lib/session";
import { getOrCreateSpec, specToDor } from "@/lib/specs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  const { id } = await ctx.params;
  const spec = await getOrCreateSpec(Number(id));
  if (!spec) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dor = specToDor(spec);
  if (!dor.ready) {
    return NextResponse.json(
      { error: "Spec is not Definition-of-Ready", dor },
      { status: 409 }
    );
  }

  const raw = await complete({
    system: `${taskTag("decompose")}
Break this spec into small agent-sized tasks. Return JSON {"tasks":[{"title","description","acIndex"}]}.
Each AC should map to at least one task (acIndex is 0-based).
SPEC_JSON: ${JSON.stringify({
      problem: spec.problem,
      outcome: spec.outcome,
      acceptanceCriteria: spec.acceptanceCriteria,
    })}`,
    messages: [{ role: "user", content: "Decompose into tasks." }],
  });

  let tasks: { title: string; description?: string; acIndex?: number }[] = [];
  try {
    const parsed = extractJson(raw) as { tasks?: typeof tasks };
    tasks = parsed.tasks ?? [];
  } catch {
    tasks = spec.acceptanceCriteria.map((ac, i) => ({
      title: `Implement AC ${i + 1}`,
      description: `Given ${ac.given}\nWhen ${ac.when}\nThen ${ac.then}`,
      acIndex: i,
    }));
  }

  await prisma.task.deleteMany({ where: { specId: spec.id } });
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const ac = spec.acceptanceCriteria[t.acIndex ?? -1];
    await prisma.task.create({
      data: {
        specId: spec.id,
        acId: ac?.id,
        title: t.title,
        description: t.description ?? "",
        sortOrder: i,
      },
    });
  }

  await prisma.spec.update({
    where: { id: spec.id },
    data: { status: "ready", readyAt: spec.readyAt ?? new Date() },
  });

  await logItemEvent({
    itemId: spec.itemId,
    type: "decomposed",
    actorEmail: user.email,
  });

  const updated = await getOrCreateSpec(Number(id));
  return NextResponse.json({ ...updated, dor: specToDor(updated!) });
}
