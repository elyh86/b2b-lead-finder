import { describe, expect, it } from "vitest";
import { gradeLead } from "./lead-quality";

describe("gradeLead", () => {
  it("returns S+ only for an exact category, both contact channels, and no listed website", () => {
    expect(gradeLead({ exactCategoryMatch: true, hasPhone: true, hasEmail: true, hasWebsite: false })).toBe("S_PLUS");
    expect(gradeLead({ exactCategoryMatch: false, hasPhone: true, hasEmail: true, hasWebsite: false })).toBe("A");
    expect(gradeLead({ exactCategoryMatch: true, hasPhone: true, hasEmail: false, hasWebsite: false })).toBe("S");
    expect(gradeLead({ exactCategoryMatch: true, hasPhone: true, hasEmail: true, hasWebsite: true })).toBe("A");
  });

  it("keeps broader contactable results below the strict tier", () => {
    expect(gradeLead({ exactCategoryMatch: false, hasPhone: true, hasEmail: false, hasWebsite: false })).toBe("A");
    expect(gradeLead({ exactCategoryMatch: false, hasPhone: false, hasEmail: false, hasWebsite: false })).toBe("B");
  });
});