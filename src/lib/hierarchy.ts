export type TeamNode = {
  id: string;
  name: string;
  l1Id?: string;
  sortOrder?: number;
};

export type L1Node = {
  id: string;
  name: string;
  l0Id?: string;
  teams: TeamNode[];
};

export type L0Node = {
  id: string;
  name: string;
  color: string;
  description?: string;
  l1s: L1Node[];
};
