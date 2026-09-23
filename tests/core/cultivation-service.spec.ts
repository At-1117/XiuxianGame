import { describe, expect, it } from "vitest";
import { CultivationService } from "../../assets/scripts/core/cultivation/CultivationService";
import { createInitialPlayerSave } from "../../assets/scripts/core/model/PlayerProfile";
import type { PlayerSaveV1 } from "../../assets/scripts/core/save/SaveSchema";
import type { RealmId, RealmStageId, TalentAllocation } from "../../assets/scripts/core/types/GameTypes";

const spiritualTalents: TalentAllocation = { spiritRoot: 20, physique: 0, luck: 0, mind: 0 };
const luckyTalents: TalentAllocation = { spiritRoot: 0, physique: 0, luck: 20, mind: 0 };
const service = new CultivationService();

function createSave(
  realmId: RealmId,
  stage: RealmStageId,
  cultivation: number,
  talents: TalentAllocation = spiritualTalents,
): PlayerSaveV1 {
  const save = createInitialPlayerSave({ profession: "sword", talents, nowMs: 1_000 });
  return { ...save, realm: { realmId, stage }, cultivation };
}

describe("cultivation service", () => {
  it("adds cultivation without automatically advancing the realm stage", () => {
    const result = service.tick(createSave("qi_refining", "early", 0), 5);
    expect(result.gainedCultivation).toBeCloseTo(7);
    expect(result.save.cultivation).toBeCloseTo(7);
    expect(result.save.realm.stage).toBe("early");
  });

  it("reports readiness at each small-stage threshold", () => {
    const result = service.tick(createSave("qi_refining", "early", 245), 5);
    expect(result.reachedStageThreshold).toBe(true);
    expect(service.canAttemptBreakthrough(result.save)).toBe(true);
  });

  it("carries excess cultivation into the next small stage", () => {
    const save = createSave("qi_refining", "early", 260);
    const result = service.attemptBreakthrough(save, 1);
    expect(result.success).toBe(true);
    expect(result.save.realm.stage).toBe("middle");
    expect(result.save.cultivation).toBe(10);
  });

  it("always succeeds from qi refining perfection to foundation", () => {
    const save = createSave("qi_refining", "perfection", 1_000);
    const result = service.attemptBreakthrough(save, 1);
    expect(result.success).toBe(true);
    expect(result.save.realm).toEqual({ realmId: "foundation", stage: "early" });
    expect(result.save.cultivation).toBe(0);
  });

  it("carries excess cultivation into the next major realm", () => {
    const save = createSave("qi_refining", "perfection", 1_050);
    const result = service.attemptBreakthrough(save, 1);
    expect(result.success).toBe(true);
    expect(result.save.realm).toEqual({ realmId: "foundation", stage: "early" });
    expect(result.save.cultivation).toBe(50);
  });

  it("uses eighty percent plus luck for foundation to golden core", () => {
    const save = createSave("foundation", "perfection", 10_000, luckyTalents);
    expect(service.getBreakthroughChance(save)).toBeCloseTo(0.95);
    const success = service.attemptBreakthrough(save, 0.94);
    expect(success.success).toBe(true);
    expect(success.save.realm.realmId).toBe("golden_core");

    const failure = service.attemptBreakthrough(save, 0.96);
    expect(failure.success).toBe(false);
    expect(failure.save.realm.realmId).toBe("foundation");
    expect(failure.save.cultivation).toBe(10_000);
    expect(failure.save.breakthrough.recoveryRemaining).toBe(1_000);
  });

  it("requires recovery cultivation after a failed breakthrough", () => {
    const failed = service.attemptBreakthrough(createSave("foundation", "perfection", 10_000, luckyTalents), 1).save;
    const recovered = service.tick(failed, 1_000);
    expect(recovered.save.breakthrough.recoveryRemaining).toBe(0);
    expect(recovered.save.cultivation).toBe(10_000);
    expect(service.canAttemptBreakthrough(recovered.save)).toBe(true);
  });

  it("caps offline cultivation at eight hours with fifty percent efficiency", () => {
    const result = service.tickOffline(createSave("qi_refining", "early", 0), 24 * 3600);
    expect(result.save.cultivation).toBe(1_000);
  });

  it("advances the offline timestamp by the real capped duration", () => {
    const save = createSave("qi_refining", "early", 0);
    const result = service.tickOffline(save, 24 * 3600);

    // 时间戳必须推进 8 小时，而不是收益折算后的 4 小时；
    // 否则下次启动会把已经结算过的离线时间再结算一次。
    expect(result.save.updatedAtMs).toBe(save.updatedAtMs + 8 * 3600 * 1_000);
    expect(result.save.lastCalculatedAtMs).toBe(result.save.updatedAtMs);
  });
});
