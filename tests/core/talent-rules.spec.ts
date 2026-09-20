import { describe, expect, it } from "vitest";
import { getTalentPointTotal, validateInitialTalents } from "../../assets/scripts/core/model/TalentRules";
import type { TalentAllocation } from "../../assets/scripts/core/types/GameTypes";

const validTalents: TalentAllocation = {
  spiritRoot: 20,
  physique: 0,
  luck: 0,
  mind: 0,
};

describe("talent rules", () => {
  it("accepts twenty points distributed within limits", () => {
    expect(getTalentPointTotal(validTalents)).toBe(20);
    expect(() => validateInitialTalents(validTalents)).not.toThrow();
  });

  it("rejects missing or excessive points", () => {
    expect(() => validateInitialTalents({ ...validTalents, spiritRoot: 19 })).toThrow();
    expect(() => validateInitialTalents({ ...validTalents, spiritRoot: 21, physique: 1 })).toThrow();
  });

  it("rejects negative and fractional points", () => {
    expect(() => validateInitialTalents({ ...validTalents, spiritRoot: -1, physique: 21 })).toThrow();
    expect(() => validateInitialTalents({ ...validTalents, spiritRoot: 19.5, physique: 0.5 })).toThrow();
  });
});
