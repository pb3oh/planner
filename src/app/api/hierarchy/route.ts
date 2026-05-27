import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const l0s = await prisma.l0.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      l1s: {
        orderBy: { sortOrder: "asc" },
        include: {
          teams: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  return NextResponse.json(l0s);
}
