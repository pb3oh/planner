import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { isAdmin, requireUser } from "@/lib/session";
import type { Role } from "@prisma/client";

function serialize<T extends { passwordHash?: string | null }>(u: T) {
  const { passwordHash: _pw, ...rest } = u;
  void _pw;
  return rest;
}

export async function GET() {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(users.map(serialize));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    email?: string;
    name?: string;
    role?: Role;
    l0Ids?: string[];
    teamIds?: string[];
    password?: string;
  };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  let role: Role = body.role ?? "user";
  if (user.role !== "super_admin") role = "user";

  const created = await prisma.user.create({
    data: {
      email,
      name: body.name ?? email.split("@")[0],
      role,
      l0Ids: body.l0Ids ?? [],
      teamIds: body.teamIds ?? [],
      passwordHash: hashPassword(body.password || "password123"),
    },
  });
  return NextResponse.json(serialize(created), { status: 201 });
}
