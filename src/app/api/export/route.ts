import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { EFFORT_SHORT, STATUS_LABEL } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const body = (await req.json().catch(() => ({}))) as {
    l0Id?: string;
    l1Id?: string;
    teamId?: string;
  };

  const where: Prisma.ItemWhereInput = { btl: false };
  if (body.l0Id) where.l0Id = body.l0Id;
  if (body.l1Id) where.l1Id = body.l1Id;
  if (body.teamId) where.teamId = body.teamId;

  const items = await prisma.item.findMany({
    where,
    include: { l0: true, l1: true, team: true },
    orderBy: { score: "desc" },
  });

  const rows = items
    .map(
      (i) => `
      <section class="card">
        <div class="meta">${i.priority} · ${STATUS_LABEL[i.status] ?? i.status} · ${EFFORT_SHORT[i.effort] ?? "?"} · score ${i.score}</div>
        <h2>${escapeHtml(i.title)}</h2>
        <p>${escapeHtml(i.description || i.businessOutcome)}</p>
        <p class="sub">${escapeHtml(i.l0.name)}${i.l1 ? " · " + escapeHtml(i.l1.name) : ""} · due ${fmt(i.needByDate) || "—"}</p>
      </section>`
    )
    .join("\n");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Plan export</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background: #f8fafc; color: #0f172a; margin: 32px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .lede { color: #64748b; margin: 0 0 24px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin-bottom: 12px; break-inside: avoid; }
    .card h2 { font-size: 16px; margin: 4px 0 8px; }
    .card p { margin: 0 0 6px; color: #475569; font-size: 14px; }
    .meta { font-size: 11px; font-weight: 700; color: #1d4ed8; letter-spacing: .4px; text-transform: uppercase; }
    .sub { font-size: 12px; color: #94a3b8 !important; }
  </style>
</head>
<body>
  <h1>Plan</h1>
  <p class="lede">${items.length} above-the-line items</p>
  ${rows}
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
