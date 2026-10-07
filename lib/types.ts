import type { LeadGrade } from "./lead-quality";

export const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const leadGradeLabels: Record<LeadGrade, string> = {
  S_PLUS: "S+",
  S: "S",
  A: "A",
  B: "B",
};

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "Nieuw",
  CONTACTED: "Contact opgenomen",
  QUALIFIED: "Gekwalificeerd",
  WON: "Gewonnen",
  LOST: "Verloren",
};

export type LeadRecord = {
  id?: string;
  placeId: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  address: string;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  digitalHealthScore: number;
  leadGrade: LeadGrade;
  status: LeadStatus;
  notes: string | null;
  nextFollowUpAt: string | null;
};