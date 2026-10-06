export type LeadSignals = {
  website: string | null;
  rating: number | null;
  reviewCount: number;
  phone: string | null;
};

export function calculateDigitalHealthScore(lead: LeadSignals): number {
  let score = 100;
  if (!lead.website) score -= 40;
  if (lead.rating !== null && lead.rating < 4) score -= 20;
  if (lead.reviewCount < 10) score -= 20;
  if (!lead.phone) score -= 20;
  return Math.max(0, Math.min(100, score));
}