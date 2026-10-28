import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireUser } from "@/lib/session";
import type { Role } from "@prisma/client";

function serialize<T extends { passwordHash?: string | null }>(u: T) {
  const { passwordHash: _pw, ...rest } = u;
  void _pw;
  return rest;
}

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
  const body = (await req.json()) as {
    role?: Role;
    l0Ids?: string[];
    teamIds?: string[];
    name?: string;
  };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role !== "super_admin" && (target.role === "admin" || target.role === "super_admin")) {
    return NextResponse.json({ error: "Cannot edit this user" }, { status: 403 });
  }

  const data: { role?: Role; l0Ids?: string[]; teamIds?: string[]; name?: string } = {};
  if (body.l0Ids) data.l0Ids = body.l0Ids;
  if (body.teamIds) data.teamIds = body.teamIds;
  if (body.name) data.name = body.name;
  if (body.role) {
    if (user.role !== "super_admin") data.role = "user";
    else data.role = body.role;
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json(serialize(updated));
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  if (user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (id === user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
