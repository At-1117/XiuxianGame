import { REALMS } from "../../data/GameConfig";
import type {
  BossId,
  BossProgress,
  BreakthroughState,
  PlayerSettings,
  ProfessionId,
  RealmId,
  RealmProgress,
  RealmStageId,
  ReincarnationState,
  TalentAllocation,
} from "../types/GameTypes";

/** 当前存档版本。每次不兼容修改必须递增。 */
export const CURRENT_SAVE_VERSION = 1 as const;

/** P1 使用的玩家存档结构。 */
export interface PlayerSaveV1 {
  schemaVersion: typeof CURRENT_SAVE_VERSION;
  createdAtMs: number;
  updatedAtMs: number;
  lastCalculatedAtMs: number;
  onboardingCompleted: boolean;
  profession: ProfessionId;
  talents: TalentAllocation;
  realm: RealmProgress;
  cultivation: number;
  spiritStones: number;
  /** 神游石数量；旧版开发存档缺省时按初始值补齐。 */
  adventureStones?: number;
  /** 神游石上次恢复结算时间戳。 */
  lastAdventureStoneRecoveryAtMs?: number;
  bossProgress: BossProgress;
  breakthrough: BreakthroughState;
  reincarnation: ReincarnationState;
  settings: PlayerSettings;
}

/** 当前版本存档别名。 */
export type PlayerSave = PlayerSaveV1;

const professionIds: readonly ProfessionId[] = ["sword", "spear", "blade"];
const realmIds = REALMS.map((realm) => realm.id);
const realmStageIds: readonly RealmStageId[] = ["early", "middle", "late", "perfection"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isOptionalNonNegativeInteger(value: unknown): boolean {
  return value === undefined || (typeof value === "number" && Number.isInteger(value) && value >= 0);
}

function isProfessionId(value: unknown): value is ProfessionId {
  return typeof value === "string" && professionIds.includes(value as ProfessionId);
}

function isRealmId(value: unknown): value is RealmId {
  return typeof value === "string" && realmIds.includes(value as RealmId);
}

function isRealmStageId(value: unknown): value is RealmStageId {
  return typeof value === "string" && realmStageIds.includes(value as RealmStageId);
}

function isBossId(value: unknown): value is BossId {
  return typeof value === "string" && /^(qi_refining|foundation|golden_core|nascent_soul|spirit_transform|void_refining|body_integration|mahayana|tribulation)_(middle|perfection)$/.test(value);
}

function isTalentAllocation(value: unknown): value is TalentAllocation {
  if (!isRecord(value)) {
    return false;
  }
  const values = [value.spiritRoot, value.physique, value.luck, value.mind];
  return values.every(
    (talent) =>
      typeof talent === "number" &&
      Number.isInteger(talent) &&
      talent >= 0 &&
      talent <= 25,
  );
}

function isRealmProgress(value: unknown): value is RealmProgress {
  return isRecord(value) && isRealmId(value.realmId) && isRealmStageId(value.stage);
}

function isPlayerSettings(value: unknown): value is PlayerSettings {
  return isRecord(value) && typeof value.autoAdventureEnabled === "boolean";
}

function isBossProgress(value: unknown): value is BossProgress {
  if (!isRecord(value) || !isBossId(value.currentBossId)) {
    return false;
  }

  const defeatedBossIds = value.defeatedBossIds;
  const failedAttemptsByBossId = value.failedAttemptsByBossId;
  if (
    !Array.isArray(defeatedBossIds) ||
    !defeatedBossIds.every(isBossId) ||
    !isRecord(failedAttemptsByBossId) ||
    typeof value.activeReincarnationUnlocked !== "boolean"
  ) {
    return false;
  }

  return Object.entries(failedAttemptsByBossId).every(
    ([bossId, attempts]) => isBossId(bossId) && Number.isInteger(attempts) && Number(attempts) >= 0,
  );
}

function isBreakthroughState(value: unknown): value is BreakthroughState {
  return (
    isRecord(value) &&
    isFiniteNonNegativeNumber(value.recoveryRemaining) &&
    Number.isInteger(value.consecutiveFailures) &&
    Number(value.consecutiveFailures) >= 0
  );
}

function isReincarnationState(value: unknown): value is ReincarnationState {
  return isRecord(value) && Number.isInteger(value.count) && Number(value.count) >= 0;
}

/** 严格检查对象是否符合当前存档结构。 */
export function isPlayerSaveV1(value: unknown): value is PlayerSaveV1 {
  if (!isRecord(value) || value.schemaVersion !== CURRENT_SAVE_VERSION) {
    return false;
  }

  return (
    Number.isInteger(value.createdAtMs) &&
    Number(value.createdAtMs) >= 0 &&
    Number.isInteger(value.updatedAtMs) &&
    Number(value.updatedAtMs) >= 0 &&
    Number.isInteger(value.lastCalculatedAtMs) &&
    Number(value.lastCalculatedAtMs) >= 0 &&
    typeof value.onboardingCompleted === "boolean" &&
    isProfessionId(value.profession) &&
    isTalentAllocation(value.talents) &&
    isRealmProgress(value.realm) &&
    isFiniteNonNegativeNumber(value.cultivation) &&
    isFiniteNonNegativeNumber(value.spiritStones) &&
    isOptionalNonNegativeInteger(value.adventureStones) &&
    isOptionalNonNegativeInteger(value.lastAdventureStoneRecoveryAtMs) &&
    isBossProgress(value.bossProgress) &&
    isBreakthroughState(value.breakthrough) &&
    isReincarnationState(value.reincarnation) &&
    isPlayerSettings(value.settings)
  );
}

/** 将未知数据转成当前存档；格式不符合时抛出错误。 */
export function parsePlayerSaveV1(value: unknown): PlayerSaveV1 {
  if (!isPlayerSaveV1(value)) {
    throw new Error("Invalid player save format.");
  }
  return value;
}

