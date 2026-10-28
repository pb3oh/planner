import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logItemEvent } from "@/lib/events";
import { isAdmin, requireUser } from "@/lib/session";
import { effortFromLabel, todayIso } from "@/lib/utils";
import type { DraftStatus, Priority } from "@prisma/client";

const draftInclude = {
  submittedBy: { select: { name: true, email: true, image: true } },
} as const;

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const draftId = Number(id);
  const body = (await req.json()) as {
    status?: DraftStatus;
    rejectionNote?: string;
  };

  const existing = await prisma.fRDraft.findUnique({ where: { id: draftId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const status = body.status ?? existing.status;
  const actor = user.email ?? user.name ?? "admin";

  const updated = await prisma.fRDraft.update({
    where: { id: draftId },
    data: {
      status,
      rejectionNote:
        status === "rejected" ? (body.rejectionNote ?? existing.rejectionNote) : existing.rejectionNote,
      approvedAt: status === "approved" ? todayIso() : existing.approvedAt,
      approvedBy: status === "approved" ? actor : existing.approvedBy,
      rejectedBy: status === "rejected" ? actor : existing.rejectedBy,
    },
    include: draftInclude,
  });

  if (status === "approved" && existing.status !== "approved") {
    const defaultL0 = await prisma.l0.findFirst({ orderBy: { sortOrder: "asc" } });
    if (defaultL0) {
      const priority = (["P0", "P1", "P2", "P3"].includes(existing.priority)
        ? existing.priority
        : "P2") as Priority;
      const created = await prisma.item.create({
        data: {
          title: existing.title || "Untitled request",
          description:
            existing.problemStatement || existing.summary || existing.rawRequest,
          businessOutcome: existing.proposedSolution || existing.whoItHelps,
          successMetric: existing.successMetric,
          status: "Needs_Review",
          priority,
          effort: effortFromLabel(existing.estimatedEffort),
          requester: existing.requester || existing.submittedByName || "",
          submittedAt: todayIso(),
          l0Id: defaultL0.id,
        },
      });
      await prisma.spec.create({
        data: {
          itemId: created.id,
          problem: existing.problemStatement || existing.rawRequest,
          outcome: existing.proposedSolution || existing.whoItHelps,
          successMetric: existing.successMetric,
        },
      });
      await logItemEvent({
        itemId: created.id,
        type: "status_change",
        fromStatus: null,
        toStatus: "Needs_Review",
        actorEmail: actor,
      });
    }
  }

  return NextResponse.json(updated);
}
