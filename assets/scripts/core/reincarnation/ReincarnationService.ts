import { P1_BOSS_ORDER, REALMS, RESOURCE_RULES } from "../../data/GameConfig";
import type { BossId, RealmId } from "../types/GameTypes";
import type { PlayerSaveV1 } from "../save/SaveSchema";

/** 判断大境界是否达到金丹或更高。 */
function isGoldenCoreOrHigher(realmId: RealmId): boolean {
  const currentIndex = REALMS.findIndex((realm) => realm.id === realmId);
  const goldenCoreIndex = REALMS.findIndex((realm) => realm.id === "golden_core");
  return currentIndex >= goldenCoreIndex;
}

/** 复制完整存档，避免轮回结算直接修改原对象。 */
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
 * 主动轮回领域服务。
 *
 * 该服务只处理解锁条件、Boss 失败记录和轮回重置，不依赖 Cocos 节点。
 * 确认弹窗和场景切换由后续 UI 层调用该服务完成。
 */
export class ReincarnationService {
  /** 记录当前 Boss 的一次失败，并在金丹以上首次失败时解锁主动轮回。 */
  public recordBossFailure(
    save: PlayerSaveV1,
    bossId: BossId,
    nowMs: number,
  ): PlayerSaveV1 | null {
    if (save.bossProgress.currentBossId !== bossId) {
      return null;
    }

    const nextSave = cloneSave(save);
    const previousAttempts = nextSave.bossProgress.failedAttemptsByBossId[bossId] ?? 0;
    nextSave.bossProgress.failedAttemptsByBossId[bossId] = previousAttempts + 1;

    if (isGoldenCoreOrHigher(nextSave.realm.realmId)) {
      nextSave.bossProgress.activeReincarnationUnlocked = true;
    }

    nextSave.updatedAtMs = nowMs;
    nextSave.lastCalculatedAtMs = nowMs;
    return nextSave;
  }

  /** 当前是否满足主动轮回条件。 */
  public canPerformActiveReincarnation(save: PlayerSaveV1): boolean {
    return (
      save.bossProgress.activeReincarnationUnlocked &&
      isGoldenCoreOrHigher(save.realm.realmId)
    );
  }

  /**
   * 执行主动轮回。
   *
   * 保留职业、天赋、灵石、设置以及后续装备/药方/宗门数据；
   * 神游石返还 50%，境界、突破和 Boss 进度重置。
   */
  public performActiveReincarnation(
    save: PlayerSaveV1,
    nowMs: number,
  ): PlayerSaveV1 | null {
    if (!this.canPerformActiveReincarnation(save)) {
      return null;
    }

    const nextSave = cloneSave(save);
    const retainedAdventureStones = Math.floor(
      (nextSave.adventureStones ?? RESOURCE_RULES.initialAdventureStones) * 0.5,
    );

    nextSave.reincarnation.count += 1;
    nextSave.adventureStones = retainedAdventureStones;
    nextSave.lastAdventureStoneRecoveryAtMs = nowMs;
    nextSave.realm = { realmId: "qi_refining", stage: "early" };
    nextSave.cultivation = 0;
    nextSave.breakthrough = { recoveryRemaining: 0, consecutiveFailures: 0 };
    nextSave.bossProgress = {
      currentBossId: P1_BOSS_ORDER[0],
      defeatedBossIds: [],
      failedAttemptsByBossId: {},
      activeReincarnationUnlocked: false,
    };
    nextSave.updatedAtMs = nowMs;
    nextSave.lastCalculatedAtMs = nowMs;
    return nextSave;
  }
}
