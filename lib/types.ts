export type LeadRecord = {
  id?: string;
  placeId: string;
  businessName: string;
  phone: string | null;
  address: string;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  digitalHealthScore: number;
};