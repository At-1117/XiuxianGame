/** 奇遇分类。 */
export type AdventureCategory = "profit" | "choice" | "rare";

/** 单个事件的奖励定义。 */
export interface AdventureRewardDefinition {
  /** 以当前境界 baseCultivationPerFiveSeconds 为单位的修为奖励。 */
  readonly cultivationBaseUnits?: number;
  /** 灵石奖励。 */
  readonly spiritStones?: number;
}

/** 单个神游事件定义。 */
export interface AdventureDefinition {
  readonly id: string;
  readonly category: AdventureCategory;
  readonly title: string;
  /** 选择类事件在自动结算时进入 A 分支的概率；未填写表示直接结算奖励。 */
  readonly optionAChance?: number;
  readonly reward: AdventureRewardDefinition;
}

/** 神游类型权重，总和为 100。 */
export const ADVENTURE_CATEGORY_WEIGHTS = Object.freeze({
  profit: 50,
  choice: 45,
  rare: 5,
});

/** P1 首轮神游事件；奖励数值集中在配置层，便于后续替换 P14 定稿。 */
export const ADVENTURES: readonly AdventureDefinition[] = Object.freeze([
  Object.freeze({
    id: "profit_01",
    category: "profit",
    title: "凝神吐纳",
    reward: Object.freeze({ cultivationBaseUnits: 10 }),
  }),
  Object.freeze({
    id: "profit_02",
    category: "profit",
    title: "灵石矿脉",
    reward: Object.freeze({ spiritStones: 10 }),
  }),
  Object.freeze({
    id: "choice_01",
    category: "choice",
    title: "集市冲突",
    optionAChance: 0.5,
    reward: Object.freeze({ spiritStones: 5 }),
  }),
  Object.freeze({
    id: "choice_02",
    category: "choice",
    title: "深潭巨蟒",
    optionAChance: 0.5,
    reward: Object.freeze({ spiritStones: 5, cultivationBaseUnits: 10 }),
  }),
  Object.freeze({
    id: "rare_01",
    category: "rare",
    title: "无名功法残页",
    reward: Object.freeze({ cultivationBaseUnits: 30 }),
  }),
  Object.freeze({
    id: "rare_02",
    category: "rare",
    title: "法宝现世",
    reward: Object.freeze({ spiritStones: 100 }),
  }),
]);
