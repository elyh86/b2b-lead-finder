type LeadWithPlaceId = { placeId: string };

export function selectScanResults<T extends LeadWithPlaceId>(
  foundLeads: T[],
  existingPlaceIds: ReadonlySet<string>,
  availableCredits: number,
  unlimitedCredits: boolean,
) {
  const uniqueLeads = [...new Map(foundLeads.map((lead) => [lead.placeId, lead])).values()];
  const newLeads = uniqueLeads.filter((lead) => !existingPlaceIds.has(lead.placeId));
  const billableLeads = unlimitedCredits
    ? newLeads
    : newLeads.slice(0, Math.max(0, availableCredits));
  const billablePlaceIds = new Set(billableLeads.map((lead) => lead.placeId));

  return {
    leads: uniqueLeads.filter(
      (lead) => existingPlaceIds.has(lead.placeId) || billablePlaceIds.has(lead.placeId),
    ),
    billableLeads,
  };
}