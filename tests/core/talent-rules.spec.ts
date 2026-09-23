import { describe, expect, it } from "vitest";
import { getTalentPointTotal, isInitialTalentAllocationComplete, validateInitialTalents } from "../../assets/scripts/core/model/TalentRules";
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

  it("requires all four talents to receive at least one point", () => {
    expect(isInitialTalentAllocationComplete({ spiritRoot: 5, physique: 5, luck: 5, mind: 5 })).toBe(true);
    expect(isInitialTalentAllocationComplete({ spiritRoot: 20, physique: 0, luck: 0, mind: 0 })).toBe(false);
    expect(isInitialTalentAllocationComplete({ spiritRoot: 5, physique: 5, luck: 5, mind: 4 })).toBe(false);
  });
});
