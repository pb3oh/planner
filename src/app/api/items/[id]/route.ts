import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ItemStatus, Priority } from "@prisma/client";

const ITEM_INCLUDE = {
  l0: { select: { name: true, color: true } },
  l1: { select: { name: true } },
  team: { select: { name: true } },
} as const;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await ctx.params;
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: ITEM_INCLUDE,
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await ctx.params;
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const assign = (key: string) => {
    if (key in body) data[key] = body[key];
  };

  [
    "title",
    "description",
    "businessOutcome",
    "successMetric",
    "needByDate",
    "effort",
    "effortConfirmed",
    "effortRationale",
    "score",
    "inScope",
    "scopeReason",
    "aiRationale",
    "risks",
    "openQuestions",
    "clarifyingAsk",
    "schedulingNote",
    "startDate",
    "endDate",
    "requester",
    "requesterBU",
    "btl",
    "l0Id",
    "l1Id",
    "teamId",
    "priority",
    "status",
  ].forEach(assign);

  if (typeof data.status === "string") data.status = data.status as ItemStatus;
  if (typeof data.priority === "string") data.priority = data.priority as Priority;

  const item = await prisma.item.update({
    where: { id: itemId },
    data,
    include: ITEM_INCLUDE,
  });
  return NextResponse.json(item);
}
