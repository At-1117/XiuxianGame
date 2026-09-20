import { describe, expect, it } from "vitest";
import { getPlayerBasePower } from "../../assets/scripts/core/model/CombatCalculator";
import { getRealmDefinition, PROFESSIONS, REALMS } from "../../assets/scripts/data/GameConfig";

describe("game configuration", () => {
  it("defines all nine realms in order", () => {
    expect(REALMS).toHaveLength(9);
    expect(REALMS.map((realm) => realm.name)).toEqual([
      "炼气",
      "筑基",
      "金丹",
      "元婴",
      "化神",
      "炼虚",
      "合体",
      "大乘",
      "渡劫境",
    ]);
  });

  it("keeps P1 and P2 values aligned with the authoritative table", () => {
    expect(getRealmDefinition("qi_refining").baseCultivationPerFiveSeconds).toBe(5);
    expect(getRealmDefinition("golden_core").fullCultivation).toBe(100_000);
    expect(getRealmDefinition("golden_core").recommendedPower).toBe(5_000);
  });

  it("only enables sword cultivation in P1", () => {
    expect(PROFESSIONS.sword.enabledInP1).toBe(true);
    expect(PROFESSIONS.spear.enabledInP1).toBe(false);
    expect(PROFESSIONS.blade.enabledInP1).toBe(false);
  });

  it("uses P2 as the P21 player base power", () => {
    expect(getPlayerBasePower("qi_refining")).toBe(200);
    expect(getPlayerBasePower("golden_core")).toBe(5_000);
  });
});
