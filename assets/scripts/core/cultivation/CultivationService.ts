import { getRealmDefinition, REALMS, RESOURCE_RULES } from "../../data/GameConfig";
import type { PlayerSaveV1 } from "../save/SaveSchema";
import type { BreakthroughState, RealmId, RealmStageId } from "../types/GameTypes";
import { getCultivationPerSecond } from "../model/CultivationCalculator";

/**
 * 小境界所需灵力占当前大境界总灵力的比例。
 * early 到达 25% 可突破 middle，middle 到达 50% 可突破 late，依此类推。
 */
const STAGE_THRESHOLDS: readonly number[] = [0.25, 0.5, 0.75, 1];
const STAGE_ORDER: readonly RealmStageId[] = ["early", "middle", "late", "perfection"];
const MAX_BREAKTHROUGH_CHANCE = 0.95;

/** 一次修炼结算结果。 */
export interface CultivationTickResult {
  save: PlayerSaveV1;
  gainedCultivation: number;
  reachedStageThreshold: boolean;
  reachedRealmLimit: boolean;
}

/** 一次境界突破结果。 */
export interface BreakthroughResult {
  save: PlayerSaveV1;
  success: boolean;
  chance: number;
}

/** 创建大境界失败后的 10% 补修状态。 */
function createBreakthroughFailureState(realmId: RealmId): BreakthroughState {
  const realm = getRealmDefinition(realmId);
  return {
    recoveryRemaining: realm.fullCultivation * 0.1,
    consecutiveFailures: 1,
  };
}

/** 获取下一大境界；金丹是 P1 的边界。 */
function getNextRealmId(realmId: RealmId): RealmId | null {
  const index = REALMS.findIndex((realm) => realm.id === realmId);
  if (index < 0 || index >= REALMS.length - 1) return null;
  return REALMS[index + 1].id;
}

/** 复制完整存档，避免结算时直接修改原对象。 */
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
 * 修炼与突破领域服务。
 *
 * 该服务只处理灵力积累、阶段门槛、突破概率和失败补修；
 * 不依赖 Cocos 节点，修炼界面只需要读取返回结果。
 */
export class CultivationService {
  /** 返回当前小境界突破所需的累计灵力。 */
  public getRequiredCultivation(save: PlayerSaveV1): number {
    const realm = getRealmDefinition(save.realm.realmId);
    const stageIndex = STAGE_ORDER.indexOf(save.realm.stage);
    return realm.fullCultivation * STAGE_THRESHOLDS[stageIndex];
  }

  /** 判断当前是否满足突破条件。 */
  public canAttemptBreakthrough(save: PlayerSaveV1): boolean {
    return (
      save.cultivation >= this.getRequiredCultivation(save) &&
      save.breakthrough.recoveryRemaining <= 0
    );
  }

  /** 结算在线或离线修炼时间，只增加灵力，不自动推进境界。 */
  public tick(save: PlayerSaveV1, elapsedSeconds: number, timeScale = 1): CultivationTickResult {
    const safeSeconds = Math.max(0, elapsedSeconds) * Math.max(0, timeScale);
    const realm = getRealmDefinition(save.realm.realmId);
    const rawGain = getCultivationPerSecond(save.realm.realmId, save.talents) * safeSeconds;
    const nextSave = cloneSave(save);
    let remainingGain = rawGain;

    // 大境界失败后，先补足恢复所需灵力，恢复完成后才能再次挑战。
    if (nextSave.breakthrough.recoveryRemaining > 0) {
      const recovered = Math.min(remainingGain, nextSave.breakthrough.recoveryRemaining);
      nextSave.breakthrough.recoveryRemaining -= recovered;
      remainingGain -= recovered;
      if (nextSave.breakthrough.recoveryRemaining <= 0) {
        nextSave.breakthrough.consecutiveFailures = 0;
      }
    }

    const availableCapacity = Math.max(0, realm.fullCultivation - nextSave.cultivation);
    const appliedGain = Math.min(availableCapacity, remainingGain);
    nextSave.cultivation += appliedGain;
    nextSave.updatedAtMs += safeSeconds * 1000;
    nextSave.lastCalculatedAtMs = nextSave.updatedAtMs;

    const requiredCultivation = this.getRequiredCultivation(nextSave);
    return {
      save: nextSave,
      gainedCultivation: appliedGain,
      reachedStageThreshold: nextSave.cultivation >= requiredCultivation,
      reachedRealmLimit:
        nextSave.realm.stage === "perfection" &&
        nextSave.cultivation >= realm.fullCultivation,
    };
  }

  /** 结算离线修炼：在线收益的 50%，最多 8 小时。 */
  public tickOffline(save: PlayerSaveV1, elapsedSeconds: number, timeScale = 1): CultivationTickResult {
    const cappedSeconds = Math.min(
      Math.max(0, elapsedSeconds),
      RESOURCE_RULES.offlineCapHours * 3600,
    );
    return this.tick(save, cappedSeconds * RESOURCE_RULES.offlineEfficiency, timeScale);
  }

  /** 返回当前大境界突破成功率。 */
  public getBreakthroughChance(save: PlayerSaveV1): number {
    if (save.realm.stage !== "perfection") return 0;
    if (save.realm.realmId === "qi_refining") return 1;
    if (save.realm.realmId !== "foundation") return 0;
    return Math.min(MAX_BREAKTHROUGH_CHANCE, 0.8 + save.talents.luck * 0.015);
  }

  /**
   * 执行一次突破。
   *
   * - 小境界：达到对应门槛后直接成功；
   * - 炼气圆满：100% 进入筑基；
   * - 筑基圆满：按 80% + 运气加成判定，成功后进入金丹；
   * - 突破失败：不扣已有灵力，需要额外补足当前大境界 10% 的灵力。
   */
  public attemptBreakthrough(save: PlayerSaveV1, roll: number): BreakthroughResult {
    const nextSave = cloneSave(save);
    if (!this.canAttemptBreakthrough(save)) {
      return { save: nextSave, success: false, chance: 0 };
    }

    const stageIndex = STAGE_ORDER.indexOf(save.realm.stage);
    if (stageIndex < STAGE_ORDER.length - 1) {
      nextSave.realm.stage = STAGE_ORDER[stageIndex + 1];
      return { save: nextSave, success: true, chance: 1 };
    }

    const nextRealmId = getNextRealmId(save.realm.realmId);
    if (!nextRealmId) {
      return { save: nextSave, success: false, chance: 0 };
    }

    const chance = this.getBreakthroughChance(save);
    if (roll <= chance) {
      nextSave.realm = { realmId: nextRealmId, stage: "early" };
      nextSave.cultivation = 0;
      nextSave.breakthrough = { recoveryRemaining: 0, consecutiveFailures: 0 };
      return { save: nextSave, success: true, chance };
    }

    const previousFailures = save.breakthrough.consecutiveFailures;
    nextSave.breakthrough = createBreakthroughFailureState(save.realm.realmId);
    nextSave.breakthrough.consecutiveFailures = previousFailures + 1;
    return { save: nextSave, success: false, chance };
  }
}
