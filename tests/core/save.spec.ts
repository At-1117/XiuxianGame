import { describe, expect, it } from "vitest";
import { createInitialPlayerSave } from "../../assets/scripts/core/model/PlayerProfile";
import { migrateSaveToLatest, SaveMigrationError } from "../../assets/scripts/core/save/SaveMigration";
import { isPlayerSaveV1 } from "../../assets/scripts/core/save/SaveSchema";
import type { TalentAllocation } from "../../assets/scripts/core/types/GameTypes";

const talents: TalentAllocation = { spiritRoot: 20, physique: 0, luck: 0, mind: 0 };

describe("player save", () => {
  it("creates a valid version-one save", () => {
    const save = createInitialPlayerSave({ profession: "sword", talents, nowMs: 1_000 });
    expect(save.schemaVersion).toBe(1);
    expect(save.realm).toEqual({ realmId: "qi_refining", stage: "early" });
    expect(save.spiritStones).toBe(0);
    expect(save.bossProgress.currentBossId).toBe("qi_refining_middle");
    expect(isPlayerSaveV1(save)).toBe(true);
  });

  it("rejects unavailable professions in P1", () => {
    expect(() => createInitialPlayerSave({ profession: "spear", talents, nowMs: 1_000 })).toThrow();
  });

  it("accepts the current version through the migration boundary", () => {
    const save = createInitialPlayerSave({ profession: "sword", talents, nowMs: 1_000 });
    expect(migrateSaveToLatest(save)).toEqual(save);
  });

  it("rejects unknown or malformed saves", () => {
    expect(() => migrateSaveToLatest({ schemaVersion: 99 })).toThrow(SaveMigrationError);
    expect(() => migrateSaveToLatest({ schemaVersion: 1 })).toThrow(SaveMigrationError);
  });
});
