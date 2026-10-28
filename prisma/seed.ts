import "dotenv/config";
import { PrismaClient, ItemStatus, Priority, DraftStatus, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/password";

function makePrisma() {
  let url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("prisma+postgres://")) {
    try {
      const u = new URL(url);
      const key = u.searchParams.get("api_key") ?? "";
      const decoded = JSON.parse(Buffer.from(key, "base64").toString());
      url = decoded.databaseUrl ?? url;
    } catch {
      /* keep url */
    }
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = makePrisma();

const L0S = [
  {
    id: "l0_platform",
    name: "Platform",
    color: "#4f46e5",
    description: "Core services, identity, developer experience",
    l1s: [
      {
        id: "l1_plat_core",
        name: "Core Services",
        teams: [
          { id: "t_plat_api", name: "API Platform" },
          { id: "t_plat_id", name: "Identity" },
        ],
      },
      {
        id: "l1_plat_dx",
        name: "Developer Experience",
        teams: [{ id: "t_plat_dx", name: "DX" }],
      },
    ],
  },
  {
    id: "l0_growth",
    name: "Growth",
    color: "#059669",
    description: "Acquisition, activation, lifecycle",
    l1s: [
      {
        id: "l1_growth_acq",
        name: "Acquisition",
        teams: [{ id: "t_growth_acq", name: "Growth Eng" }],
      },
      {
        id: "l1_growth_life",
        name: "Lifecycle",
        teams: [{ id: "t_growth_life", name: "Lifecycle" }],
      },
    ],
  },
  {
    id: "l0_data",
    name: "Data",
    color: "#7c3aed",
    description: "Analytics, metrics, ML platform",
    l1s: [
      {
        id: "l1_data_metrics",
        name: "Analytics",
        teams: [{ id: "t_data_metrics", name: "Metrics" }],
      },
      {
        id: "l1_data_ml",
        name: "ML Platform",
        teams: [{ id: "t_data_ml", name: "Feature Store" }],
      },
    ],
  },
  {
    id: "l0_trust",
    name: "Trust",
    color: "#0891b2",
    description: "Security, privacy, reliability",
    l1s: [
      {
        id: "l1_trust_sec",
        name: "Security",
        teams: [{ id: "t_trust_appsec", name: "AppSec" }],
      },
      {
        id: "l1_trust_sre",
        name: "Reliability",
        teams: [{ id: "t_trust_sre", name: "SRE" }],
      },
    ],
  },
];

type SeedItem = {
  id: number;
  title: string;
  requester: string;
  requesterBU: string;
  l0Id: string;
  l1Id: string | null;
  teamId: string | null;
  status: ItemStatus;
  effort: number;
  effortConfirmed: boolean;
  effortRationale?: string;
  startDate?: string;
  endDate?: string;
  priority: Priority;
  score: number;
  description: string;
  businessOutcome: string;
  successMetric: string;
  needByDate?: string;
  inScope: boolean;
  scopeReason: string;
  aiRationale: string;
  risks: string[];
  openQuestions: string[];
  submittedAt: string;
  sourceDoc?: string | null;
  btl?: boolean;
};

const SEED_ITEMS: SeedItem[] = [
  {
    id: 1001,
    title: "Workspace SSO for member orgs",
    requester: "Alex Rivera",
    requesterBU: "Platform",
    l0Id: "l0_platform",
    l1Id: "l1_plat_core",
    teamId: "t_plat_id",
    status: "In_Progress",
    effort: 3,
    effortConfirmed: true,
    startDate: "2026-04-14",
    endDate: "2026-05-12",
    priority: "P0",
    score: 88,
    description:
      "Allow organization admins to require SSO (OIDC) for members, including enforced session timeout.",
    businessOutcome: "Reduce account-takeover risk and unblock enterprise pilots.",
    successMetric: "80% of enterprise orgs on SSO within 60 days of GA",
    needByDate: "2026-05-15",
    inScope: true,
    scopeReason: "Identity team owns authn surfaces.",
    aiRationale: "Foundational; unblocks several enterprise deals. High score, confirmed effort.",
    risks: ["IdP variance across customers"],
    openQuestions: [],
    submittedAt: "2026-03-20",
  },
  {
    id: 1002,
    title: "Usage-based billing dashboard",
    requester: "Morgan Lee",
    requesterBU: "Growth",
    l0Id: "l0_growth",
    l1Id: "l1_growth_life",
    teamId: "t_growth_life",
    status: "Planned",
    effort: 4,
    effortConfirmed: false,
    effortRationale: "Needs metering events from Platform plus a new billing UI.",
    startDate: "2026-05-05",
    endDate: "2026-06-16",
    priority: "P1",
    score: 81,
    description:
      "Self-serve dashboard showing current-period usage, projected invoice, and alert thresholds.",
    businessOutcome: "Cut billing support tickets and improve expansion conversion.",
    successMetric: "Billing tickets −40%; expansion CTR +10%",
    needByDate: "2026-06-01",
    inScope: true,
    scopeReason: "Lifecycle owns customer-facing billing UX.",
    aiRationale: "Strong outcome, but depends on metering completeness.",
    risks: ["Metering schema still in flux"],
    openQuestions: ["Is invoice projection in v1 or v1.1?"],
    submittedAt: "2026-04-02",
  },
  {
    id: 1003,
    title: "Audit log export API",
    requester: "Sam Patel",
    requesterBU: "Trust",
    l0Id: "l0_trust",
    l1Id: "l1_trust_sec",
    teamId: "t_trust_appsec",
    status: "Needs_Review",
    effort: 2,
    effortConfirmed: false,
    effortRationale: "New export endpoint with pagination and cursor auth.",
    priority: "P1",
    score: 76,
    description:
      "JSON/CSV export of workspace audit events for customer SIEM ingestion.",
    businessOutcome: "Unblock security reviews for regulated customers.",
    successMetric: "Export used by 15 design-partner orgs in first month",
    needByDate: "2026-06-30",
    inScope: true,
    scopeReason: "AppSec owns audit event catalog and export.",
    aiRationale: "Clear compliance pull. Confirm rate limits before accepting.",
    risks: ["PII in event payloads"],
    openQuestions: ["Which event types are in v1?"],
    submittedAt: "2026-04-18",
  },
  {
    id: 1004,
    title: "Search relevance v2",
    requester: "Jamie Chen",
    requesterBU: "Data",
    l0Id: "l0_data",
    l1Id: "l1_data_ml",
    teamId: "t_data_ml",
    status: "In_Progress",
    effort: 3,
    effortConfirmed: true,
    startDate: "2026-04-01",
    endDate: "2026-05-20",
    priority: "P1",
    score: 79,
    description:
      "Replace lexical-only search with a hybrid ranker using click signals.",
    businessOutcome: "Improve findability of saved objects and docs.",
    successMetric: "Click-through on first 3 results +15%",
    inScope: true,
    scopeReason: "ML Platform owns ranking; search UI stays put.",
    aiRationale: "In flight. Watch evaluation set quality.",
    risks: ["Sparse click data on new tenants"],
    openQuestions: [],
    submittedAt: "2026-03-12",
  },
  {
    id: 1005,
    title: "Feature-flag kill switch for agent runs",
    requester: "Riley Brooks",
    requesterBU: "Platform",
    l0Id: "l0_platform",
    l1Id: "l1_plat_core",
    teamId: "t_plat_api",
    status: "Accepted",
    effort: 2,
    effortConfirmed: true,
    startDate: "2026-05-12",
    endDate: "2026-05-26",
    priority: "P0",
    score: 90,
    description:
      "Global and per-workspace kill switch that stops new agent runs within 30s.",
    businessOutcome: "Contain runaway spend and bad-output incidents.",
    successMetric: "p99 flag propagation < 30s; 0 missed kills in game day",
    needByDate: "2026-05-30",
    inScope: true,
    scopeReason: "API Platform owns runtime control plane.",
    aiRationale: "Incident-driven P0. Small surface, high leverage.",
    risks: ["In-flight runs still complete"],
    openQuestions: [],
    submittedAt: "2026-04-22",
  },
  {
    id: 1006,
    title: "Onboarding checklist for first workspace",
    requester: "Casey Nguyen",
    requesterBU: "Growth",
    l0Id: "l0_growth",
    l1Id: "l1_growth_acq",
    teamId: "t_growth_acq",
    status: "Planned",
    effort: 2,
    effortConfirmed: true,
    startDate: "2026-05-19",
    endDate: "2026-06-02",
    priority: "P2",
    score: 68,
    description:
      "Guided first-run checklist covering invite, data source, and a sample spec.",
    businessOutcome: "Lift activation from signup to first value.",
    successMetric: "D7 activation +12%",
    inScope: true,
    scopeReason: "Acquisition owns first-run UX.",
    aiRationale: "Good growth bet, not on the critical path this month.",
    risks: ["Checklist copy will churn"],
    openQuestions: ["Which sample spec do we ship?"],
    submittedAt: "2026-04-09",
  },
  {
    id: 1007,
    title: "SLO burn-rate alerts",
    requester: "Jordan Blake",
    requesterBU: "Trust",
    l0Id: "l0_trust",
    l1Id: "l1_trust_sre",
    teamId: "t_trust_sre",
    status: "Backlog",
    effort: 2,
    effortConfirmed: true,
    priority: "P2",
    score: 64,
    description: "Page on 2% hour and 5% day error-budget burn for public APIs.",
    businessOutcome: "Faster detection of customer-visible reliability issues.",
    successMetric: "MTTD for 5xx incidents −25%",
    inScope: true,
    scopeReason: "SRE owns alerting; product surfaces stay unchanged.",
    aiRationale: "Solid, but capacity is on the kill switch this cycle.",
    risks: ["Alert fatigue if thresholds are tight"],
    openQuestions: [],
    submittedAt: "2026-04-01",
  },
  {
    id: 1008,
    title: "Saved-view sharing",
    requester: "Avery Cole",
    requesterBU: "Platform",
    l0Id: "l0_platform",
    l1Id: "l1_plat_dx",
    teamId: "t_plat_dx",
    status: "Needs_Review",
    effort: 3,
    effortConfirmed: false,
    effortRationale: "Sharing model plus ACL on views.",
    priority: "P2",
    score: 61,
    description: "Let users share filtered list views with a team or a link.",
    businessOutcome: "Reduce duplicate setup across teammates.",
    successMetric: "30% of weekly-active users open a shared view",
    inScope: true,
    scopeReason: "DX owns workspace UI chrome.",
    aiRationale: "Useful but underspecified ACLs. Needs review.",
    risks: ["Oversharing of private filters"],
    openQuestions: ["Link vs. named share in v1?"],
    submittedAt: "2026-04-25",
  },
];

const BTL_ITEMS: SeedItem[] = [
  {
    id: 3001,
    title: "Mobile shell spike",
    requester: "Alex Rivera",
    requesterBU: "Platform",
    l0Id: "l0_platform",
    l1Id: "l1_plat_dx",
    teamId: "t_plat_dx",
    btl: true,
    status: "Backlog",
    effort: 3,
    effortConfirmed: false,
    priority: "P3",
    score: 48,
    description: "Spike a read-only mobile shell for inbox + item detail.",
    businessOutcome: "Inform whether a mobile surface is warranted next half.",
    successMetric: "Spike doc with go/no-go",
    inScope: false,
    scopeReason: "Below the line — not committed this quarter.",
    aiRationale: "Deferred for capacity.",
    risks: [],
    openQuestions: [],
    submittedAt: "2026-04-01",
  },
  {
    id: 3002,
    title: "Custom report builder",
    requester: "Jamie Chen",
    requesterBU: "Data",
    l0Id: "l0_data",
    l1Id: "l1_data_metrics",
    teamId: "t_data_metrics",
    btl: true,
    status: "Backlog",
    effort: 5,
    effortConfirmed: false,
    priority: "P3",
    score: 44,
    description: "Drag-and-drop report builder over the metrics warehouse.",
    businessOutcome: "Self-serve analytics for team leads.",
    successMetric: "50 custom reports created by design partners",
    inScope: false,
    scopeReason: "Below the line — not committed this quarter.",
    aiRationale: "Large bet; wait for warehouse stability.",
    risks: [],
    openQuestions: [],
    submittedAt: "2026-04-01",
  },
];

const DRAFTS: {
  title: string;
  summary: string;
  problemStatement: string;
  proposedSolution: string;
  whoItHelps: string;
  successMetric: string;
  estimatedEffort: string;
  priority: string;
  requester: string;
  rawRequest: string;
  status: DraftStatus;
  submittedAt: string;
  approvedAt?: string;
  submittedByEmail: string;
}[] = [
  {
    title: "Per-environment API keys",
    summary: "Separate live and sandbox keys so customers can test without prod risk.",
    problemStatement: "A single key is used in prod and staging, so a leaked sandbox key is a prod incident.",
    proposedSolution: "Issue environment-scoped keys and reject cross-env use.",
    whoItHelps: "Customer platform engineers",
    successMetric: "0 cross-env key uses after migration period",
    estimatedEffort: "S",
    priority: "P1",
    requester: "Sam Patel",
    rawRequest:
      "We need separate API keys for sandbox vs production. Right now one leaked staging key is a production incident. Please scope keys per environment.",
    status: "pending",
    submittedAt: "2026-04-26",
    submittedByEmail: "sam.dev@example.com",
  },
  {
    title: "Digest email of blocked items",
    summary: "Weekly mail to DRIs listing items stuck in Blocked or Needs Review.",
    problemStatement: "Blocked work sits unnoticed until standup.",
    proposedSolution: "Monday digest with links into the plan.",
    whoItHelps: "PMs and team leads",
    successMetric: "Median time-in-Blocked −20%",
    estimatedEffort: "XS",
    priority: "P3",
    requester: "Morgan Lee",
    rawRequest:
      "Can we get a weekly email of items that are blocked or still in needs-review so they don't rot?",
    status: "pending",
    submittedAt: "2026-04-27",
    submittedByEmail: "morgan.pm@example.com",
  },
  {
    title: "CSV import for members",
    summary: "Bulk-add workspace members from a CSV of email + role.",
    problemStatement: "IT has to click-invite 200 people at a time.",
    proposedSolution: "Upload CSV, preview diffs, commit invites.",
    whoItHelps: "IT admins at larger customers",
    successMetric: "Invite time for 100 users < 5 minutes",
    estimatedEffort: "M",
    priority: "P2",
    requester: "Casey Nguyen",
    rawRequest: "Need a CSV importer for inviting members with roles. 200 clicks is not a process.",
    status: "approved",
    submittedAt: "2026-04-10",
    approvedAt: "2026-04-12",
    submittedByEmail: "morgan.pm@example.com",
  },
  {
    title: "Dark mode everywhere",
    summary: "Theme the entire app dark.",
    problemStatement: "Some users want dark mode.",
    proposedSolution: "Full visual redesign in dark tokens.",
    whoItHelps: "Night-shift operators",
    successMetric: "50% of users enable dark mode",
    estimatedEffort: "L",
    priority: "P3",
    requester: "Avery Cole",
    rawRequest: "Please ship dark mode across the product this quarter.",
    status: "rejected",
    submittedAt: "2026-04-05",
    submittedByEmail: "sam.dev@example.com",
  },
];

const USERS: { email: string; name: string; role: Role; l0Ids: string[]; teamIds: string[] }[] = [
  {
    email: "alex.admin@example.com",
    name: "Alex Admin",
    role: "super_admin",
    l0Ids: ["l0_platform", "l0_growth", "l0_data", "l0_trust"],
    teamIds: [],
  },
  {
    email: "morgan.pm@example.com",
    name: "Morgan PM",
    role: "admin",
    l0Ids: ["l0_growth", "l0_platform"],
    teamIds: [],
  },
  {
    email: "sam.dev@example.com",
    name: "Sam Dev",
    role: "user",
    l0Ids: [],
    teamIds: ["t_plat_api", "t_plat_id"],
  },
];

async function main() {
  console.log("Seeding users…");
  const passwordHash = hashPassword("password123");
  const userByEmail = new Map<string, string>();
  for (const u of USERS) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { ...u, passwordHash },
      create: { ...u, passwordHash },
    });
    userByEmail.set(u.email, row.id);
  }

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

  console.log("Seeding drafts…");
  const existingDrafts = await prisma.fRDraft.count();
  if (existingDrafts === 0) {
    for (const d of DRAFTS) {
      const { submittedByEmail, ...rest } = d;
      await prisma.fRDraft.create({
        data: {
          ...rest,
          submittedByUserId: userByEmail.get(submittedByEmail),
          submittedByName: USERS.find((u) => u.email === submittedByEmail)?.name,
        },
      });
    }
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
