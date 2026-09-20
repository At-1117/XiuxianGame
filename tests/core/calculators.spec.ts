import { describe, expect, it } from "vitest";
import { getBasicAttackPerSecond, getPlayerPower } from "../../assets/scripts/core/model/CombatCalculator";
import { getCultivationPerSecond } from "../../assets/scripts/core/model/CultivationCalculator";
import type { TalentAllocation } from "../../assets/scripts/core/types/GameTypes";

const spiritualTalents: TalentAllocation = { spiritRoot: 20, physique: 0, luck: 0, mind: 0 };
const physicalTalents: TalentAllocation = { spiritRoot: 0, physique: 20, luck: 0, mind: 0 };

describe("core calculators", () => {
  it("applies spirit-root efficiency to cultivation", () => {
    expect(getCultivationPerSecond("qi_refining", spiritualTalents)).toBeCloseTo(1.4);
    expect(getCultivationPerSecond("golden_core", spiritualTalents)).toBeCloseTo(33.6);
  });

  it("applies physique to player power", () => {
    expect(getPlayerPower("qi_refining", physicalTalents)).toBeCloseTo(320);
  });

  it("applies profession coefficients to basic attack damage", () => {
    expect(getBasicAttackPerSecond("qi_refining", "sword", spiritualTalents)).toBeCloseTo(240);
  });
});
