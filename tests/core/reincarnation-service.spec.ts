import { describe, expect, it } from "vitest";
import { ReincarnationService } from "../../assets/scripts/core/reincarnation/ReincarnationService";
import { createInitialPlayerSave } from "../../assets/scripts/core/model/PlayerProfile";
import type { PlayerSaveV1 } from "../../assets/scripts/core/save/SaveSchema";
import type { TalentAllocation } from "../../assets/scripts/core/types/GameTypes";

const talents: TalentAllocation = { spiritRoot: 20, physique: 0, luck: 0, mind: 0 };
const service = new ReincarnationService();

function createSave(): PlayerSaveV1 {
  return createInitialPlayerSave({ profession: "sword", talents, nowMs: 1_000 });
}

describe("reincarnation service", () => {
  it("does not unlock active reincarnation before golden core", () => {
    const result = service.recordBossFailure(createSave(), "qi_refining_middle", 2_000);
    expect(result?.bossProgress.activeReincarnationUnlocked).toBe(false);
    expect(service.canPerformActiveReincarnation(result!)).toBe(false);
  });

  it("unlocks active reincarnation after a golden-core boss failure", () => {
    const save = {
      ...createSave(),
      realm: { realmId: "golden_core" as const, stage: "early" as const },
    };
    const result = service.recordBossFailure(save, "qi_refining_middle", 2_000);
    expect(result?.bossProgress.failedAttemptsByBossId.qi_refining_middle).toBe(1);
    expect(service.canPerformActiveReincarnation(result!)).toBe(true);
  });

  it("rejects a failure recorded for a boss that is not current", () => {
    const result = service.recordBossFailure(createSave(), "qi_refining_perfection", 2_000);
    expect(result).toBeNull();
  });

  it("resets cultivation progress and returns half adventure stones", () => {
    const save = {
      ...createSave(),
      realm: { realmId: "golden_core" as const, stage: "middle" as const },
      cultivation: 12_345,
      adventureStones: 31,
      spiritStones: 88,
      bossProgress: {
        ...createSave().bossProgress,
        activeReincarnationUnlocked: true,
        failedAttemptsByBossId: { qi_refining_middle: 1 },
      },
    };

    const result = service.performActiveReincarnation(save, 9_999);
    expect(result).not.toBeNull();
    expect(result?.reincarnation.count).toBe(1);
    expect(result?.adventureStones).toBe(15);
    expect(result?.spiritStones).toBe(88);
    expect(result?.realm).toEqual({ realmId: "qi_refining", stage: "early" });
    expect(result?.cultivation).toBe(0);
    expect(result?.bossProgress.currentBossId).toBe("qi_refining_middle");
    expect(result?.bossProgress.activeReincarnationUnlocked).toBe(false);
  });
});
