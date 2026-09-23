import { getProfessionDefinition, RESOURCE_RULES } from "../../data/GameConfig";
import type { PlayerSaveV1 } from "../save/SaveSchema";
import { CURRENT_SAVE_VERSION } from "../save/SaveSchema";
import type { ProfessionId, TalentAllocation } from "../types/GameTypes";
import { validateInitialTalents } from "./TalentRules";

/** 创建初始玩家档案所需的输入。 */
export interface CreateInitialPlayerSaveInput {
  profession: ProfessionId;
  talents: TalentAllocation;
  nowMs: number;
}

/** 创建有效的首版玩家存档。 */
export function createInitialPlayerSave(input: CreateInitialPlayerSaveInput): PlayerSaveV1 {
  const profession = getProfessionDefinition(input.profession);
  if (!profession.enabledInP1) {
    throw new Error(`${profession.name} is not selectable in P1.`);
  }

  validateInitialTalents(input.talents);
  if (!Number.isFinite(input.nowMs) || input.nowMs < 0) {
    throw new Error("nowMs must be a non-negative finite number.");
  }

  return {
    schemaVersion: CURRENT_SAVE_VERSION,
    createdAtMs: input.nowMs,
    updatedAtMs: input.nowMs,
    lastCalculatedAtMs: input.nowMs,
    onboardingCompleted: true,
    profession: input.profession,
    talents: { ...input.talents },
    realm: {
      realmId: "qi_refining",
      stage: "early",
    },
    cultivation: 0,
    spiritStones: RESOURCE_RULES.initialSpiritStones,
    adventureStones: RESOURCE_RULES.initialAdventureStones,
    lastAdventureStoneRecoveryAtMs: input.nowMs,
    breakthrough: {
      recoveryRemaining: 0,
      consecutiveFailures: 0,
    },
    bossProgress: {
      currentBossId: "qi_refining_middle",
      defeatedBossIds: [],
      failedAttemptsByBossId: {},
      activeReincarnationUnlocked: false,
    },
    reincarnation: {
      count: 0,
    },
    settings: {
      autoAdventureEnabled: false,
    },
  };
}

