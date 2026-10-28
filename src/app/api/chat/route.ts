import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EFFORT_SHORT } from "@/lib/constants";
import { complete, taskTag } from "@/lib/llm";
import { requireUser } from "@/lib/session";
import { fmt } from "@/lib/utils";

async function buildPlanContext() {
  const l0s = await prisma.l0.findMany({
    include: {
      l1s: { include: { teams: true } },
      items: {
        where: { btl: false },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          score: true,
          effort: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  const sections = l0s.map((l0) => {
    const active = l0.items.filter((i) =>
      ["In_Progress", "Planned", "Accepted"].includes(i.status)
    );
    const review = l0.items.filter((i) => i.status === "Needs_Review");
    const backlog = l0.items.filter((i) => i.status === "Backlog");
    const l1Names = l0.l1s.map((l) => l.name).join(", ");

    const fmtItem = (i: (typeof l0.items)[0]) =>
      `[${i.id}] "${i.title}" ${i.priority} score:${i.score} effort:${EFFORT_SHORT[i.effort]} ends:${fmt(i.endDate)}`;

    return `## ${l0.name} (${l0.description ?? ""})
L1s: ${l1Names}
Active (${active.length}): ${active.map(fmtItem).join(" | ") || "none"}
Needs Review (${review.length}): ${review.map(fmtItem).join(" | ") || "none"}
Backlog (${backlog.length}): ${backlog.map(fmtItem).join(" | ") || "none"}`;
  });

  return `${taskTag("chat")}
You are a planning advisor with full visibility into the current dependency plan.

CURRENT PLAN STATE:
${sections.join("\n\n")}

Your role: Help users understand where a request fits, what trade-offs exist, and what conditions would allow it to move up. Be specific — reference actual item titles, scores, and dates. Surface possibilities without making commitments on behalf of teams. When you reference an item, include its [id] so it can be highlighted.`;
}

export async function POST(req: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const { messages } = (await req.json()) as {
    messages: { role: string; content: string }[];
  };

  const systemPrompt = await buildPlanContext();
  const normalized = (messages ?? [])
    .filter((m) => m.content)
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

  if (normalized.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const reply = await complete({
    system: systemPrompt,
    messages: normalized,
  });

  return NextResponse.json({ reply });
}
