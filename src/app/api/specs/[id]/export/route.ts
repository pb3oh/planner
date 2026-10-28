import { NextRequest, NextResponse } from "next/server";
import {
  toGherkinFeature,
  toJiraCsv,
  toJiraJson,
  toOpenSpecMarkdown,
} from "@/lib/exporters";
import { requireUser } from "@/lib/session";
import { getOrCreateSpec, toExportSpec } from "@/lib/specs";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await ctx.params;
  const spec = await getOrCreateSpec(Number(id));
  if (!spec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await prisma.item.findUnique({ where: { id: spec.itemId } });
  const payload = toExportSpec(item?.title ?? "Untitled spec", spec, {
    priority: item?.priority,
    requester: item?.requester,
  });

  const format = req.nextUrl.searchParams.get("format") ?? "openspec";
  if (format === "openspec" || format === "md") {
    return new NextResponse(toOpenSpecMarkdown(payload), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug(payload.title)}.md"`,
      },
    });
  }
  if (format === "jira-csv" || format === "csv") {
    return new NextResponse(toJiraCsv(payload), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug(payload.title)}-jira.csv"`,
      },
    });
  }
  if (format === "jira-json" || format === "json") {
    return NextResponse.json(toJiraJson(payload));
  }
  if (format === "gherkin" || format === "feature") {
    return new NextResponse(toGherkinFeature(payload), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug(payload.title)}.feature"`,
      },
    });
  }
  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "spec"
  );
}
