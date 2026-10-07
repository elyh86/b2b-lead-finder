import { describe, expect, it } from "vitest";
import { selectScanResults } from "./scan-results";

describe("selectScanResults", () => {
  it("keeps known results and caps new leads at the available credits", () => {
    const foundLeads = [{ placeId: "saved" }, { placeId: "new-1" }, { placeId: "new-2" }];
    const result = selectScanResults(foundLeads, new Set(["saved"]), 1, false);

    expect(result.leads.map((lead) => lead.placeId)).toEqual(["saved", "new-1"]);
    expect(result.billableLeads.map((lead) => lead.placeId)).toEqual(["new-1"]);
  });

  it("does not charge known leads again and removes duplicate provider results", () => {
    const foundLeads = [{ placeId: "saved" }, { placeId: "saved" }];
    const result = selectScanResults(foundLeads, new Set(["saved"]), 0, false);

    expect(result.leads.map((lead) => lead.placeId)).toEqual(["saved"]);
    expect(result.billableLeads).toEqual([]);
  });

  it("keeps every new result for unlimited accounts", () => {
    const foundLeads = [{ placeId: "one" }, { placeId: "two" }];
    const result = selectScanResults(foundLeads, new Set(), 0, true);

    expect(result.leads).toEqual(foundLeads);
    expect(result.billableLeads).toEqual(foundLeads);
  });
});