import { describe, expect, it } from "vitest";
import { calculateDigitalHealthScore } from "./lead-score";

describe("calculateDigitalHealthScore", () => {
  it("subtracts the specified deductions for each digital gap", () => {
    expect(
      calculateDigitalHealthScore({ website: null, rating: 3.9, reviewCount: 9, phone: null }),
    ).toBe(0);
  });

  it("keeps a high score for a business with a website and strong reviews", () => {
    expect(
      calculateDigitalHealthScore({ website: "https://example.nl", rating: 4, reviewCount: 10, phone: "+31123456789" }),
    ).toBe(100);
  });

  it("does not penalize missing rating and review data", () => {
    expect(
      calculateDigitalHealthScore({ website: "https://example.nl", rating: null, reviewCount: 0, phone: "+31123456789" }),
    ).toBe(100);
  });
});
