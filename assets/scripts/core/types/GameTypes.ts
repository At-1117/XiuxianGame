/** 职业标识。P1 只开放剑修，但存档结构保留三职业。 */
export type ProfessionId = "sword" | "spear" | "blade";

/** 九大境界标识。 */
export type RealmId =
  | "qi_refining"
  | "foundation"
  | "golden_core"
  | "nascent_soul"
  | "spirit_transform"
  | "void_refining"
  | "body_integration"
  | "mahayana"
  | "tribulation";

/** 每个大境界的四个阶段。 */
export type RealmStageId = "early" | "middle" | "late" | "perfection";

/** Boss 标识由境界和关卡类型组成。 */
export type BossId = `${RealmId}_${"middle" | "perfection"}`;

/** 四项天赋。 */
export interface TalentAllocation {
  spiritRoot: number;
  physique: number;
  luck: number;
  mind: number;
}

/** 当前境界位置。 */
export interface RealmProgress {
  realmId: RealmId;
  stage: RealmStageId;
}

/** Boss 进度及主动轮回解锁状态。 */
export interface BossProgress {
  currentBossId: BossId;
  defeatedBossIds: BossId[];
  failedAttemptsByBossId: Partial<Record<BossId, number>>;
  activeReincarnationUnlocked: boolean;
}

/** 玩家设置。首版仅保留自动神游开关。 */
export interface PlayerSettings {
  autoAdventureEnabled: boolean;
}

/** 大境界突破失败后的恢复状态。 */
export interface BreakthroughState {
  /** 还需补足的灵力；为 0 时可以再次挑战大境界。 */
  recoveryRemaining: number;
  /** 当前大境界的连续失败次数，用于检验保底与显示。 */
  consecutiveFailures: number;
}

/** 主动轮回状态。 */
export interface ReincarnationState {
  count: number;
}

