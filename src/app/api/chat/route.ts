import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { CLAUDE_MODEL, EFFORT_SHORT } from "@/lib/constants";
import { fmt, statusLabel } from "@/lib/utils";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  return `You are a VEP planning advisor with full visibility into the VEP dependency plan. VEP serves 62K+ experts (TurboTax Live, QuickBooks Live, Bookkeeping, Payroll, Business Tax).

CURRENT PLAN STATE:
${sections.join("\n\n")}

Your role: Help users understand where a request fits, what trade-offs exist, and what conditions would allow it to move up. Be specific — reference actual item titles, scores, and dates. Surface possibilities without making commitments on behalf of teams. When you reference an item, include its [id] so it can be highlighted.`;
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as {
    messages: { role: string; content: string }[];
  };

  const systemPrompt = await buildPlanContext();

  // Build conversation: system context prepended to user turn
  const lastMessage = messages[messages.length - 1];
  const prior = messages
    .slice(0, -1)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const userContent =
    prior.length > 0
      ? `${systemPrompt}\n\nConversation so far:\n${prior.map((m) => `${m.role}: ${m.content}`).join("\n")}\n\n---\nLatest question: ${lastMessage.content}`
      : `${systemPrompt}\n\n---\nUser question: ${lastMessage.content}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: userContent }],
  });

  const reply = response.content.find((b) => b.type === "text")?.text ?? "";
  return NextResponse.json({ reply });
}
