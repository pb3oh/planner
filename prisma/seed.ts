import { PrismaClient, ItemStatus, Priority } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function makePrisma() {
  let url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("prisma+postgres://")) {
    try {
      const u = new URL(url);
      const key = u.searchParams.get("api_key") ?? "";
      const decoded = JSON.parse(Buffer.from(key, "base64").toString());
      url = decoded.databaseUrl ?? url;
    } catch {}
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = makePrisma();

// ── Hierarchy seed data ───────────────────────────────────────────────────────
const L0S = [
  {
    id: "l0_iep",
    name: "Expert Portal (IEP)",
    color: "#4f46e5",
    description: "Expert-facing UI, session tools, AI-native workspace",
    l1s: [
      {
        id: "l1_iep_eaf",
        name: "Expert App Foundation",
        teams: [
          { id: "t_eaf_aifn", name: "AI Foundations" },
          { id: "t_eaf_af", name: "App Foundations" },
        ],
      },
      {
        id: "l1_iep_ews",
        name: "Expert Workspace",
        teams: [
          { id: "t_ews_aifn", name: "AI Foundations" },
          { id: "t_ews_af", name: "App Foundations" },
        ],
      },
    ],
  },
  {
    id: "l0_em",
    name: "Expert Management",
    color: "#059669",
    description: "Onboarding, skills, workforce, partner mgmt",
    l1s: [
      { id: "l1_em_collab", name: "Collaboration", teams: [] },
      { id: "l1_em_pm", name: "Practice Management", teams: [] },
      { id: "l1_em_network", name: "Expert Network", teams: [] },
    ],
  },
  {
    id: "l0_hi",
    name: "Human Intelligence",
    color: "#7c3aed",
    description: "Annotation, eval, skills taxonomy, customer context",
    l1s: [
      { id: "l1_hi_eitl", name: "Expert In the Loop", teams: [] },
      { id: "l1_hi_eval", name: "Expert Evaluation", teams: [] },
      { id: "l1_hi_skills", name: "Skill Management", teams: [] },
      { id: "l1_hi_ucc", name: "Universal Customer Context", teams: [] },
    ],
  },
  {
    id: "l0_crm",
    name: "Enterprise CRM",
    color: "#0891b2",
    description: "CRM, routing, sales, incentives",
    l1s: [
      { id: "l1_crm_incentive", name: "Incentive Management", teams: [] },
      { id: "l1_crm_partner", name: "Partner Management", teams: [] },
      { id: "l1_crm_analytics", name: "Sales Analytics", teams: [] },
      { id: "l1_crm_enable", name: "Sales Enablement", teams: [] },
      { id: "l1_crm_ops", name: "Sales Operations", teams: [] },
    ],
  },
];

// ── ATL seed items ────────────────────────────────────────────────────────────
const SEED_ITEMS = [
  {
    id: 1001,
    title: "Expert Annotation Quality Dashboard",
    requester: "Navjot Singh",
    requesterBU: "VEP / Internal",
    l0Id: "l0_hi",
    l1Id: "l1_hi_eitl",
    teamId: null,
    status: "In_Progress" as ItemStatus,
    effort: 2,
    effortConfirmed: true,
    startDate: "2026-04-14",
    endDate: "2026-04-28",
    priority: "P1" as Priority,
    score: 76,
    description:
      "Internal ops dashboard tracking inter-annotator agreement and reviewer override rate for HAS/LaaS.",
    businessOutcome:
      "Reduce annotation error rate and provide quality SLA visibility.",
    successMetric: "IAA > 85%, reviewer override < 10%",
    inScope: true,
    scopeReason: "Core HAS/LaaS quality infrastructure.",
    aiRationale: "Strong fit for HI platform. Low effort, clear metric.",
    risks: ["Quality targets not yet baselined"],
    openQuestions: ["What's the current IAA baseline?"],
    submittedAt: "2026-04-01",
    sourceDoc: null,
  },
  {
    id: 1002,
    title: "IEP AI-Native Session Summary MVP",
    requester: "Nate Bergman",
    requesterBU: "TurboTax Live (TTL)",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    status: "Planned" as ItemStatus,
    effort: 3,
    effortConfirmed: false,
    effortRationale:
      "Mid-size feature requiring LLM integration and new IEP UI surface. Risk from Core AI dependency.",
    startDate: "2026-05-05",
    endDate: "2026-06-02",
    priority: "P1" as Priority,
    score: 81,
    description:
      "AI-generated post-engagement summaries surfaced in expert IEP workflow after each session.",
    businessOutcome: "Reduce expert wrap-up time 30%.",
    successMetric: "30% wrap time reduction; >70% adoption in 60d",
    needByDate: "2026-06-01",
    inScope: true,
    scopeReason: "Expert Portal / IEP — VEP owns expert-side UI.",
    aiRationale: "High customer impact, aligns to IEP AI-native roadmap.",
    risks: ["Depends on Core AI LLM API"],
    openQuestions: ["Is Core AI API ready?"],
    submittedAt: "2026-04-08",
    sourceDoc: null,
  },
  {
    id: 1003,
    title: "Expert Availability API for QBL Routing",
    requester: "Priya Shah",
    requesterBU: "QuickBooks Live (QBL)",
    l0Id: "l0_crm",
    l1Id: "l1_crm_ops",
    teamId: null,
    status: "Needs_Review" as ItemStatus,
    effort: 4,
    effortConfirmed: false,
    effortRationale: "New API surface with real-time latency requirements.",
    priority: "P2" as Priority,
    score: 64,
    description:
      "Expose real-time expert availability via API for QBL routing to select best-fit experts.",
    businessOutcome:
      "Reduce customer wait time by improving routing accuracy.",
    successMetric: "Routing accuracy +15%, wait time −20%",
    needByDate: "2026-07-01",
    inScope: true,
    scopeReason:
      "Enterprise CRM — VEP owns expert availability and CRM APIs.",
    aiRationale:
      "Solid business case but CRM team at capacity through June.",
    risks: [
      "CRM capacity constrained",
      "Latency SLA needs arch review",
    ],
    openQuestions: ["Required API response time SLA?"],
    submittedAt: "2026-04-22",
    sourceDoc: null,
  },
  {
    id: 1004,
    title: "LaaS SOW Intake Form Automation",
    requester: "Jennifer Crosby",
    requesterBU: "Expert Network (EN)",
    l0Id: "l0_hi",
    l1Id: "l1_hi_eitl",
    teamId: null,
    status: "Backlog" as ItemStatus,
    effort: 2,
    effortConfirmed: true,
    priority: "P2" as Priority,
    score: 58,
    description:
      "Standardized intake form to auto-generate SOW for labeling requests, targeting <5 day quoting time.",
    businessOutcome:
      "Cut LaaS quoting time from ~15 days to <5 days.",
    successMetric: "Quoting time < 5 days, SOW turnaround < 3 days",
    inScope: true,
    scopeReason: "LaaS demand-side tooling — fits HI/LaaS scope.",
    aiRationale:
      "Good strategic fit, but lower urgency vs active annotation work.",
    risks: ["Requires service design alignment first"],
    openQuestions: ["Is service design finalized?"],
    submittedAt: "2026-04-18",
    sourceDoc: null,
  },
  {
    id: 1005,
    title: "Skills Registry v2 — Structured Taxonomy",
    requester: "Julia Zhuang",
    requesterBU: "VEP / Internal",
    l0Id: "l0_em",
    l1Id: "l1_em_collab",
    teamId: null,
    status: "In_Progress" as ItemStatus,
    effort: 3,
    effortConfirmed: true,
    startDate: "2026-04-01",
    endDate: "2026-04-28",
    priority: "P0" as Priority,
    score: 88,
    description:
      "Add structured skills taxonomy to expert profiles enabling routing and matching by skill.",
    businessOutcome:
      "Enable skills-based routing, reduce mismatched engagements.",
    successMetric:
      "Skills coverage > 80% of active experts; routing accuracy +20%",
    needByDate: "2026-04-30",
    inScope: true,
    scopeReason:
      "Expert Management — skills registry is core EM infrastructure.",
    aiRationale:
      "Foundational work blocking multiple downstream capabilities.",
    risks: ["Data quality of existing profiles"],
    openQuestions: [],
    submittedAt: "2026-03-15",
    sourceDoc: null,
  },
  // AIFN items
  {
    id: 2001,
    title: "AI Native IEP Scaling for AiO — New Engagement Types",
    requester: "Alex Caron",
    requesterBU: "TurboTax Live (TTL)",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    status: "In_Progress" as ItemStatus,
    effort: 4,
    effortConfirmed: true,
    effortRationale:
      "Scaling AI Native IEP to 4 new QBL engagement types — configurability work on OCG, customer question, and main stage.",
    startDate: "2026-04-01",
    endDate: "2026-06-02",
    priority: "P0" as Priority,
    score: 90,
    description:
      "Scale AI Native IEP to new AiO engagement types for QBL: adding configurability to On-Contact, Customer Details, Customer Question, and enabling new icon/tool in command center for appointments.",
    businessOutcome:
      "Enable QBL experts on AI Native IEP for new engagement types, unblocking AiO launch.",
    successMetric:
      "4 new QBL engagement types live on AI Native IEP by Q4 close",
    needByDate: "2026-06-02",
    inScope: true,
    scopeReason:
      "Core AI Native IEP platform work — AIFN team owns AI foundations of Expert Portal.",
    aiRationale:
      "Highest priority AIFN item, directly tied to AiO business launch. Blocking QBL go-live.",
    risks: [
      "Dependency on OCG configurability work",
      "AQnA migration complexity",
    ],
    openQuestions: ["Is Core AI AQnA migration gating this?"],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AIFN - 2026 Q4 Cutline",
  },
  {
    id: 2002,
    title:
      "AI Native IEP Platform Supervisor Phase 2 — CoPilot/Main Stage Control",
    requester: "Alex Caron",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    status: "In_Progress" as ItemStatus,
    effort: 5,
    effortConfirmed: true,
    effortRationale:
      "Taking ownership of IEP main stage through Supervisor and invoking OCG as agent. ~60 pts, high complexity.",
    startDate: "2026-04-01",
    endDate: "2026-06-16",
    priority: "P0" as Priority,
    score: 87,
    description:
      "Take ownership of the IEP main stage through the IEP Supervisor and invoke OCG as an agent. Unlocks SER pills and enables main stage convergence.",
    businessOutcome:
      "Enable fully agentic main stage, unblocking QBL scaling and 2nd peak AI Native delivery.",
    successMetric: "IEP Supervisor owns main stage by 2nd peak UAT",
    needByDate: "2026-05-09",
    inScope: true,
    scopeReason:
      "AIFN owns the AI supervisor layer and main stage architecture.",
    aiRationale:
      "Critical infrastructure for 2nd peak. Dependency for QBL AI Native scaling and reactive/proactive use cases.",
    risks: [
      "Architecture complexity of multi-agent orchestration",
      "Dependency on agentic teams contributing",
    ],
    openQuestions: ["What teams need to contribute to agentic work?"],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AIFN - 2026 Q4 Cutline",
  },
  {
    id: 2003,
    title: "AI Native IEP — 2nd Peak VOE Improvements (Command Center + TOC)",
    requester: "Alex Caron",
    requesterBU: "TurboTax Live (TTL)",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    status: "Planned" as ItemStatus,
    effort: 2,
    effortConfirmed: true,
    effortRationale:
      "Timebox bucket for 1st peak VOE work and command center UI investments. ~15 pts.",
    startDate: "2026-04-29",
    endDate: "2026-05-27",
    priority: "P1" as Priority,
    score: 79,
    description:
      "Platform work for 2nd peak VOE: command center logic for tabs (configurable), TOC investments, and P0/P1 items from 1st peak not delivered.",
    businessOutcome:
      "Close 1st peak quality gaps, deliver configurable command center for 2nd peak scale.",
    successMetric: "P0 VOE items resolved ahead of 2nd peak bug bash",
    needByDate: "2026-05-09",
    inScope: true,
    scopeReason:
      "AIFN owns command center and AI-native platform investments.",
    aiRationale:
      "Required for 2nd peak readiness. Lower effort, high impact on expert experience quality.",
    risks: ["Scope creep from 1st peak backlog"],
    openQuestions: [],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AIFN - 2026 Q4 Cutline",
  },
  {
    id: 2004,
    title: "Skill Management / Multi-Model IA Pilot",
    requester: "Erik Roodsari",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    status: "Planned" as ItemStatus,
    effort: 4,
    effortConfirmed: true,
    effortRationale:
      "Build pilot of new model behind IA supporting slash commands. ~60 pts, experimental work.",
    startDate: "2026-05-05",
    endDate: "2026-06-16",
    priority: "P1" as Priority,
    score: 74,
    description:
      "Build a pilot of a new model behind Intuit Assist (IA) supporting slash commands. Multi-model routing pilot in the deterministic framework.",
    businessOutcome:
      "Validate multi-model approach for Intuit Assist, enabling skill-based routing improvements.",
    successMetric:
      "Pilot live with measurable quality delta vs current model",
    inScope: true,
    scopeReason:
      "AIFN owns IA/OCG model integrations and routing framework.",
    aiRationale:
      "Strategic bet on multi-model IA. Medium urgency, high strategic alignment.",
    risks: [
      "Model availability from Core AI",
      "Integration complexity with deterministic framework",
    ],
    openQuestions: ["Which model(s) are candidates for the pilot?"],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AIFN - 2026 Q4 Cutline",
  },
  {
    id: 2005,
    title: "PS Reporting — Add Sigma Integration",
    requester: "Erik Roodsari",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    status: "Backlog" as ItemStatus,
    effort: 1,
    effortConfirmed: true,
    priority: "P2" as Priority,
    score: 62,
    description:
      "Provide access to the conversation pipeline to ingest data into Sigma for running LLMAJ.",
    businessOutcome:
      "Enable automated quality evaluation (LLMAJ) via Sigma, reducing manual eval overhead.",
    successMetric: "LLMAJ running in Sigma within sprint of data availability",
    inScope: true,
    scopeReason: "AIFN owns the eval pipeline and quality tooling.",
    aiRationale:
      "Enabler for quality automation. Low effort, gated on auto eval completion.",
    risks: ["Depends on auto eval and human eval completion first"],
    openQuestions: ["Is auto eval finished?"],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AIFN - 2026 Q4 Cutline",
  },
  // AF items
  {
    id: 2101,
    title: "AiO Manager Items — FOE/BOE Manager Search + Engagement View",
    requester: "Brian Lederman",
    requesterBU: "QuickBooks Live (QBL)",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_af",
    status: "In_Progress" as ItemStatus,
    effort: 3,
    effortConfirmed: true,
    startDate: "2026-04-01",
    endDate: "2026-05-13",
    priority: "P0" as Priority,
    score: 85,
    description:
      "Enable FOE/BOE Manager search and ability to view engagements for new QBL offerings.",
    businessOutcome:
      "Enable QBL manager visibility into new AiO engagement types by May 2026.",
    successMetric: "Manager search live for QBL FOE/BOE by May deadline",
    needByDate: "2026-05-01",
    inScope: true,
    scopeReason:
      "App Foundations owns engagement list and manager-facing IEP surfaces.",
    aiRationale:
      "Hard deadline from QBL AiO launch. Highest priority AF item this cycle.",
    risks: ["Tight May deadline", "Dependency on QBL engagement list schema"],
    openQuestions: [],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AF - 2026 Q4 Cutline",
  },
  {
    id: 2102,
    title: "Post Call Email Summary for AiO Engagements",
    requester: "Brian Lederman",
    requesterBU: "QuickBooks Live (QBL)",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_af",
    status: "In_Progress" as ItemStatus,
    effort: 2,
    effortConfirmed: true,
    startDate: "2026-04-01",
    endDate: "2026-05-06",
    priority: "P0" as Priority,
    score: 83,
    description:
      "Enable post-call email summary for new AiO engagement types.",
    businessOutcome:
      "Complete post-call workflow for AiO experts on QBL, improving engagement wrap-up.",
    successMetric:
      "Post-call email summary live for AiO engagement types by May",
    needByDate: "2026-05-01",
    inScope: true,
    scopeReason:
      "App Foundations owns post-call workflow surfaces in IEP.",
    aiRationale:
      "Paired with AiO Manager Items — both gated on May QBL launch.",
    risks: [
      "Dependency on AiO engagement type schema being finalized",
    ],
    openQuestions: ["Is AiO engagement type schema stable?"],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AF - 2026 Q4 Cutline",
  },
  {
    id: 2103,
    title:
      "AI Native IEP — Build Skills for Proactive/Reactive Use Cases (Co-Pilot)",
    requester: "Erik Roodsari",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_af",
    status: "Planned" as ItemStatus,
    effort: 3,
    effortConfirmed: true,
    startDate: "2026-04-29",
    endDate: "2026-06-09",
    priority: "P1" as Priority,
    score: 78,
    description:
      "Build out skills to introduce into proactive and reactive use cases starting with Refund Status and Apply Discount.",
    businessOutcome:
      "Enable expert co-pilot with actionable skills, reducing AHT on high-frequency use cases.",
    successMetric: "2+ skills live in co-pilot by Q4 close",
    needByDate: "2026-05-01",
    inScope: true,
    scopeReason:
      "App Foundations owns skill scaffolding and co-pilot platform hosting.",
    aiRationale:
      "Strong AHT reduction potential. Paired with AIFN's supervisor phase 2 as dependency.",
    risks: [
      "Dependency on AIFN main stage supervisor work",
      "Skill scope may expand",
    ],
    openQuestions: ["Which skills are confirmed for v1?"],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AF - 2026 Q4 Cutline",
  },
  {
    id: 2113,
    title: "AiO AI Native Client Info for New QBL Engagement Types",
    requester: "Brian Lederman",
    requesterBU: "QuickBooks Live (QBL)",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_af",
    status: "Planned" as ItemStatus,
    effort: 2,
    effortConfirmed: true,
    startDate: "2026-04-29",
    endDate: "2026-05-27",
    priority: "P0" as Priority,
    score: 82,
    description:
      "AI Native Client Info Panel for new QBL AiO engagement types — covers 4 new engagement types launching with AiO.",
    businessOutcome:
      "Ensure QBL experts have full client context in AI Native IEP for new engagement types.",
    successMetric:
      "Client info live for all 4 QBL AiO engagement types at launch",
    needByDate: "2026-05-01",
    inScope: true,
    scopeReason:
      "App Foundations owns Client Info Panel and AI Native IEP surfaces.",
    aiRationale: "Hard May deadline tied to QBL AiO launch. P0.",
    risks: ["Dependency on AiO engagement schema finalization"],
    openQuestions: [],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AF - 2026 Q4 Cutline",
  },
  {
    id: 2011,
    title: "Finish Auto Eval and Human Eval",
    requester: "Erik Roodsari",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    status: "In_Progress" as ItemStatus,
    effort: 1,
    effortConfirmed: true,
    startDate: "2026-04-14",
    endDate: "2026-04-28",
    priority: "P1" as Priority,
    score: 70,
    description:
      "Finish auto eval work to speed the evaluation process. Human eval to judge LLMAJ is underway — output will be a golden dataset that feeds into Sigma integration.",
    businessOutcome:
      "Enable automated quality evaluation pipeline, reducing manual eval cycle time.",
    successMetric: "Golden dataset produced; Sigma integration unblocked",
    inScope: true,
    scopeReason: "AIFN owns the eval framework and quality tooling.",
    aiRationale: "Blocking Sigma/reporting work downstream. In progress.",
    risks: ["Human eval coordination with annotators"],
    openQuestions: [],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AIFN - 2026 Q4 Cutline",
  },
];

// ── BTL seed items ────────────────────────────────────────────────────────────
const BTL_ITEMS = [
  {
    id: 3001,
    title: "Deep-Dive: Remove Ability to Edit Incoming QnA Question",
    requester: "Alex Caron",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    btl: true,
    status: "Backlog" as ItemStatus,
    effort: 1,
    effortConfirmed: false,
    priority: "P2" as Priority,
    score: 52,
    description:
      "Evaluate removing the ability to edit the question for initial QnA given automation test failing and poor expert adoption.",
    businessOutcome: "Simplify QnA flow, reduce automation failures.",
    successMetric: "Automation test pass rate improvement",
    needByDate: "ASAP",
    inScope: false,
    scopeReason: "BTL — not committed this quarter.",
    aiRationale: "Deferred due to capacity.",
    risks: [],
    openQuestions: [],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AIFN - 2026 Q4 Cutline",
  },
  {
    id: 3002,
    title: "Complete AI Workflow Handler — Saves & Dynamic Service Guidance",
    requester: "Erik Roodsari",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_aifn",
    btl: true,
    status: "Backlog" as ItemStatus,
    effort: 2,
    effortConfirmed: false,
    priority: "P2" as Priority,
    score: 58,
    description:
      "Complete AI Workflow Handler use cases for Saves and Dynamic Service Guidance.",
    businessOutcome:
      "Enable Saves and DSG use cases via AI Workflow Handler.",
    successMetric:
      "Workflow handler supporting 2+ use cases in production",
    inScope: false,
    scopeReason: "BTL — not committed this quarter.",
    aiRationale: "Deferred due to capacity.",
    risks: [],
    openQuestions: [],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AIFN - 2026 Q4 Cutline",
  },
  {
    id: 3101,
    title: "Always On Mobility — Long-Term Solution Spike",
    requester: "Alex Caron",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_af",
    btl: true,
    status: "Backlog" as ItemStatus,
    effort: 2,
    effortConfirmed: false,
    priority: "P2" as Priority,
    score: 56,
    description:
      "Spike for investment in the long-term solution for Always On Mobility (multiple workspaces).",
    businessOutcome:
      "Define the architecture for multi-workspace mobility ahead of future quarters.",
    successMetric:
      "Spike doc complete with recommended architecture",
    needByDate: "2026-06-01",
    inScope: false,
    scopeReason: "BTL — not committed this quarter.",
    aiRationale: "Deferred due to capacity.",
    risks: [],
    openQuestions: [],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AF - 2026 Q4 Cutline",
  },
  {
    id: 3105,
    title: "New Launchpad Shell with AI Components",
    requester: "Brian Lederman",
    requesterBU: "VEP / Internal",
    l0Id: "l0_iep",
    l1Id: "l1_iep_eaf",
    teamId: "t_eaf_af",
    btl: true,
    status: "Backlog" as ItemStatus,
    effort: 3,
    effortConfirmed: false,
    priority: "P2" as Priority,
    score: 58,
    description:
      "New Launchpad shell with existing AI components including Coach AI, investigations, IA, and training.",
    businessOutcome:
      "Modernize Launchpad as the AI-native expert home base.",
    successMetric:
      "New Launchpad shell live with AI components present",
    inScope: false,
    scopeReason: "BTL — not committed this quarter.",
    aiRationale: "Deferred due to capacity.",
    risks: [],
    openQuestions: [],
    submittedAt: "2026-04-01",
    sourceDoc: "Expert Portal L1 Program Binder · AF - 2026 Q4 Cutline",
  },
];

const NON_IEP_TEAM_IDS = [
  "t_em_collab_default", "t_em_pm_default", "t_em_network_ops", "t_em_network_recruit",
  "t_hi_eitl_annot", "t_hi_eitl_laas", "t_hi_eval_quality", "t_hi_eval_metrics",
  "t_hi_skills_taxonomy", "t_hi_skills_routing", "t_hi_ucc_default",
  "t_crm_incentive_default", "t_crm_partner_default", "t_crm_analytics_default",
  "t_crm_enable_default", "t_crm_ops_routing", "t_crm_ops_platform",
];

async function main() {
  console.log("Cleaning up non-IEP teams…");
  await prisma.team.deleteMany({ where: { id: { in: NON_IEP_TEAM_IDS } } });

  console.log("Seeding hierarchy…");
  for (const l0data of L0S) {
    const { l1s, ...l0 } = l0data;
    await prisma.l0.upsert({
      where: { id: l0.id },
      update: l0,
      create: l0,
    });
    for (let li = 0; li < l1s.length; li++) {
      const { teams, ...l1 } = l1s[li];
      await prisma.l1.upsert({
        where: { id: l1.id },
        update: { ...l1, l0Id: l0.id, sortOrder: li },
        create: { ...l1, l0Id: l0.id, sortOrder: li },
      });
      for (let ti = 0; ti < teams.length; ti++) {
        await prisma.team.upsert({
          where: { id: teams[ti].id },
          update: { ...teams[ti], l1Id: l1.id, sortOrder: ti },
          create: { ...teams[ti], l1Id: l1.id, sortOrder: ti },
        });
      }
    }
  }

  console.log("Seeding items…");
  for (const item of [...SEED_ITEMS, ...BTL_ITEMS]) {
    const { id, ...rest } = item;
    await prisma.item.upsert({
      where: { id },
      update: rest,
      create: { id, ...rest },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
