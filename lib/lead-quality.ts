export const leadGrades = ["S_PLUS", "S", "A", "B"] as const;
export type LeadGrade = (typeof leadGrades)[number];

export type LeadQualitySignals = {
  exactCategoryMatch: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasWebsite: boolean;
};

export function gradeLead(signals: LeadQualitySignals): LeadGrade {
  if (signals.exactCategoryMatch && !signals.hasWebsite && signals.hasPhone && signals.hasEmail) return "S_PLUS";
  if (signals.exactCategoryMatch && !signals.hasWebsite && (signals.hasPhone || signals.hasEmail)) return "S";
  if (signals.hasPhone || signals.hasEmail) return "A";
  return "B";
}