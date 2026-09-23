import { getRealmDefinition, RESOURCE_RULES } from "../../data/GameConfig";
import {
  ADVENTURES,
  ADVENTURE_CATEGORY_WEIGHTS,
  type AdventureCategory,
  type AdventureDefinition,
} from "../../data/AdventureConfig";
import type { RandomSource } from "../RandomSource";
import type { PlayerSaveV1 } from "../save/SaveSchema";

/** 一次神游结算结果。 */
export interface AdventureOutcome {
  readonly save: PlayerSaveV1;
  readonly eventId: string;
  readonly title: string;
  readonly category: AdventureCategory;
  readonly choice: "A" | "B" | "default";
  readonly cultivationGained: number;
  readonly spiritStonesGained: number;
  readonly adventureStonesRemaining: number;
}

/** 复制存档，避免神游结算直接修改原始对象。 */
function cloneSave(save: PlayerSaveV1): PlayerSaveV1 {
  return {
    ...save,
    talents: { ...save.talents },
    realm: { ...save.realm },
    breakthrough: { ...save.breakthrough },
    bossProgress: {
      ...save.bossProgress,
      defeatedBossIds: [...save.bossProgress.defeatedBossIds],
      failedAttemptsByBossId: { ...save.bossProgress.failedAttemptsByBossId },
    },
    reincarnation: { ...save.reincarnation },
    settings: { ...save.settings },
  };
}

/**
 * 神游与奇遇领域服务。
 *
 * 负责神游石恢复、神游消耗、事件抽取和奖励应用，不依赖 Cocos 节点。
 */
export class AdventureService {
  /** 把旧存档缺失的神游字段补齐。 */
  public ensureAdventureState(save: PlayerSaveV1, nowMs: number): PlayerSaveV1 {
    if (
      save.adventureStones !== undefined &&
      save.lastAdventureStoneRecoveryAtMs !== undefined
    ) {
      return save;
    }

    return {
      ...cloneSave(save),
      adventureStones: save.adventureStones ?? RESOURCE_RULES.initialAdventureStones,
      lastAdventureStoneRecoveryAtMs: save.lastAdventureStoneRecoveryAtMs ?? nowMs,
    };
  }

  /** 按时间恢复神游石，被动恢复上限固定为 30。 */
  public recoverSpiritStones(save: PlayerSaveV1, nowMs: number): PlayerSaveV1 {
    const normalizedSave = this.ensureAdventureState(save, nowMs);
    const currentStones = normalizedSave.adventureStones ?? RESOURCE_RULES.initialAdventureStones;
    const lastRecoveryAtMs = normalizedSave.lastAdventureStoneRecoveryAtMs ?? nowMs;
    const nextSave = cloneSave(normalizedSave);

    if (currentStones >= RESOURCE_RULES.passiveRecoveryLimit) {
      nextSave.adventureStones = currentStones;
      nextSave.lastAdventureStoneRecoveryAtMs = nowMs;
      return nextSave;
    }

    const intervalMs = RESOURCE_RULES.recoveryIntervalSeconds * 1000;
    const elapsedMs = Math.max(0, nowMs - lastRecoveryAtMs);
    const recoveredCount = Math.floor(elapsedMs / intervalMs);
    if (recoveredCount <= 0) {
      nextSave.adventureStones = currentStones;
      nextSave.lastAdventureStoneRecoveryAtMs = lastRecoveryAtMs;
      return nextSave;
    }

    const recoveredStones = Math.min(
      RESOURCE_RULES.passiveRecoveryLimit,
      currentStones + recoveredCount,
    );
    nextSave.adventureStones = recoveredStones;
    nextSave.lastAdventureStoneRecoveryAtMs =
      recoveredStones >= RESOURCE_RULES.passiveRecoveryLimit
        ? nowMs
        : lastRecoveryAtMs + recoveredCount * intervalMs;
    return nextSave;
  }

  /**
   * 执行一次神游。
   *
   * @returns 神游石不足时返回 null；否则返回事件和奖励结果。
   */
  public runAdventure(
    save: PlayerSaveV1,
    random: RandomSource,
    nowMs: number,
  ): AdventureOutcome | null {
    const recoveredSave = this.recoverSpiritStones(save, nowMs);
    const currentStones = recoveredSave.adventureStones ?? RESOURCE_RULES.initialAdventureStones;
    if (currentStones < RESOURCE_RULES.adventureStoneCost) {
      return null;
    }

    const saveAfterCost = cloneSave(recoveredSave);
    saveAfterCost.adventureStones = currentStones - RESOURCE_RULES.adventureStoneCost;

    const category = this.pickCategory(random.next());
    const candidates = ADVENTURES.filter((event) => event.category === category);
    const event = candidates[Math.min(candidates.length - 1, Math.floor(random.next() * candidates.length))];
    const optionASelected =
      event.optionAChance === undefined || random.next() < event.optionAChance;
    return this.applyEvent(saveAfterCost, event, optionASelected);
  }

  /** 应用指定事件奖励；选择类 B 分支不获得奖励。 */
  private applyEvent(
    save: PlayerSaveV1,
    event: AdventureDefinition,
    optionASelected: boolean,
  ): AdventureOutcome {
    const nextSave = cloneSave(save);
    const hasReward = event.optionAChance === undefined || optionASelected;
    const cultivationBaseUnits = hasReward ? event.reward.cultivationBaseUnits ?? 0 : 0;
    const baseCultivation = getRealmDefinition(nextSave.realm.realmId).baseCultivationPerFiveSeconds;
    const cultivationGained = cultivationBaseUnits * baseCultivation;
    const spiritStonesGained = hasReward ? event.reward.spiritStones ?? 0 : 0;

    if (cultivationGained > 0) {
      const realm = getRealmDefinition(nextSave.realm.realmId);
      nextSave.cultivation = Math.min(
        realm.fullCultivation,
        nextSave.cultivation + cultivationGained,
      );
    }
    if (spiritStonesGained > 0) {
      nextSave.spiritStones = Math.min(
        RESOURCE_RULES.maximumSpiritStones,
        nextSave.spiritStones + spiritStonesGained,
      );
    }

    return {
      save: nextSave,
      eventId: event.id,
      title: event.title,
      category: event.category,
      choice: event.optionAChance === undefined ? "default" : optionASelected ? "A" : "B",
      cultivationGained,
      spiritStonesGained,
      adventureStonesRemaining: nextSave.adventureStones ?? 0,
    };
  }

  /** 按 50 / 45 / 5 权重抽取奇遇分类。 */
  private pickCategory(roll: number): AdventureCategory {
    const totalWeight =
      ADVENTURE_CATEGORY_WEIGHTS.profit +
      ADVENTURE_CATEGORY_WEIGHTS.choice +
      ADVENTURE_CATEGORY_WEIGHTS.rare;
    const normalizedRoll = Math.min(0.999999, Math.max(0, roll)) * totalWeight;
    if (normalizedRoll < ADVENTURE_CATEGORY_WEIGHTS.profit) {
      return "profit";
    }
    if (
      normalizedRoll <
      ADVENTURE_CATEGORY_WEIGHTS.profit + ADVENTURE_CATEGORY_WEIGHTS.choice
    ) {
      return "choice";
    }
    return "rare";
  }
}
