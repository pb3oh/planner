import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const { searchParams } = req.nextUrl;
  const l0Id = searchParams.get("l0Id");
  const l1Id = searchParams.get("l1Id");
  const teamId = searchParams.get("teamId");

  const where: Prisma.ItemWhereInput = {};
  if (l0Id) where.l0Id = l0Id;
  if (l1Id) where.l1Id = l1Id;
  if (teamId) where.teamId = teamId;

  const items = await prisma.item.findMany({
    where,
    include: {
      l0: { select: { name: true, color: true } },
      l1: { select: { name: true } },
      team: { select: { name: true } },
    },
    orderBy: [{ btl: "asc" }, { score: "desc" }, { id: "asc" }],
  });

  return NextResponse.json(items);
}
