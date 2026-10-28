import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { complete, extractJson, taskTag } from "@/lib/llm";
import { todayIso } from "@/lib/utils";

const draftInclude = {
  submittedBy: { select: { name: true, email: true, image: true } },
} as const;

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;
  const drafts = await prisma.fRDraft.findMany({
    include: draftInclude,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(drafts);
}

type Shaped = {
  title?: string;
  summary?: string;
  problemStatement?: string;
  proposedSolution?: string;
  whoItHelps?: string;
  successMetric?: string;
  estimatedEffort?: string;
  priority?: string;
};

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response || !user) return response;

  const body = (await req.json()) as { rawRequest?: string };
  const rawRequest = (body.rawRequest ?? "").trim();
  if (!rawRequest) {
    return NextResponse.json({ error: "rawRequest is required" }, { status: 400 });
  }

  const raw = await complete({
    system: `${taskTag("shape")}
Return JSON with title, summary, problemStatement, proposedSolution, whoItHelps, successMetric, estimatedEffort (XS|S|M|L|XL), priority (P0-P3).
RAW:
${rawRequest}`,
    messages: [{ role: "user", content: rawRequest }],
  });

  let shaped: Shaped = {};
  try {
    shaped = extractJson(raw) as Shaped;
  } catch {
    shaped = { title: rawRequest.slice(0, 80), summary: rawRequest.slice(0, 200) };
  }

  const draft = await prisma.fRDraft.create({
    data: {
      title: shaped.title || rawRequest.slice(0, 80),
      summary: shaped.summary || "",
      problemStatement: shaped.problemStatement || "",
      proposedSolution: shaped.proposedSolution || "",
      whoItHelps: shaped.whoItHelps || "",
      successMetric: shaped.successMetric || "",
      estimatedEffort: shaped.estimatedEffort || "M",
      priority: shaped.priority || "P2",
      requester: user.name || user.email || "",
      rawRequest,
      submittedByUserId: user.id,
      submittedByName: user.name || user.email || "",
      submittedAt: todayIso(),
    },
    include: draftInclude,
  });

  return NextResponse.json(draft, { status: 201 });
}
