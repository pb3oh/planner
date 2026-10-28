import type { DorCriterion } from "@/lib/gates/definitionOfReady";

export type ExportTask = {
  title: string;
  description: string;
  acIndex?: number | null;
};

export type ExportSpec = {
  id: string;
  title: string;
  problem: string;
  outcome: string;
  successMetric: string;
  scope: string;
  nonGoals: string;
  constraints?: string;
  risks: string[];
  openQuestions: string[];
  priority?: string;
  requester?: string;
  acceptanceCriteria: DorCriterion[];
  tasks: ExportTask[];
};
