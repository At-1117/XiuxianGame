import type { ProfessionId, RealmId } from "../core/types/GameTypes";

/** 职业的固定战斗系数。 */
export interface ProfessionDefinition {
  readonly id: ProfessionId;
  readonly name: string;
  readonly attackSpeedCoefficient: number;
  readonly damageCoefficient: number;
  readonly enabledInP1: boolean;
}

/** 境界的基础修炼和战斗参数。 */
export interface RealmDefinition {
  readonly id: RealmId;
  readonly name: string;
  readonly fullCultivation: number;
  readonly baseCultivationPerFiveSeconds: number;
  readonly recommendedPower: number;
}

/** P3/P4 职业系数。 */
export const PROFESSIONS: Readonly<Record<ProfessionId, ProfessionDefinition>> = Object.freeze({
  sword: Object.freeze({
    id: "sword",
    name: "剑修",
    attackSpeedCoefficient: 1.2,
    damageCoefficient: 1.0,
    enabledInP1: true,
  }),
  spear: Object.freeze({
    id: "spear",
    name: "枪修",
    attackSpeedCoefficient: 1.0,
    damageCoefficient: 1.1,
    enabledInP1: false,
  }),
  blade: Object.freeze({
    id: "blade",
    name: "刀修",
    attackSpeedCoefficient: 0.8,
    damageCoefficient: 1.3,
    enabledInP1: false,
  }),
});

/** P1/P2 配置使用完整九境，P1 只开放到金丹。 */
export const REALMS: readonly RealmDefinition[] = Object.freeze([
  Object.freeze({ id: "qi_refining", name: "炼气", fullCultivation: 1_000, baseCultivationPerFiveSeconds: 5, recommendedPower: 200 }),
  Object.freeze({ id: "foundation", name: "筑基", fullCultivation: 10_000, baseCultivationPerFiveSeconds: 15, recommendedPower: 1_000 }),
  Object.freeze({ id: "golden_core", name: "金丹", fullCultivation: 100_000, baseCultivationPerFiveSeconds: 120, recommendedPower: 5_000 }),
  Object.freeze({ id: "nascent_soul", name: "元婴", fullCultivation: 1_000_000, baseCultivationPerFiveSeconds: 1_000, recommendedPower: 25_000 }),
  Object.freeze({ id: "spirit_transform", name: "化神", fullCultivation: 10_000_000, baseCultivationPerFiveSeconds: 8_500, recommendedPower: 120_000 }),
  Object.freeze({ id: "void_refining", name: "炼虚", fullCultivation: 100_000_000, baseCultivationPerFiveSeconds: 70_000, recommendedPower: 600_000 }),
  Object.freeze({ id: "body_integration", name: "合体", fullCultivation: 1_000_000_000, baseCultivationPerFiveSeconds: 600_000, recommendedPower: 3_000_000 }),
  Object.freeze({ id: "mahayana", name: "大乘", fullCultivation: 10_000_000_000, baseCultivationPerFiveSeconds: 5_000_000, recommendedPower: 15_000_000 }),
  Object.freeze({ id: "tribulation", name: "渡劫境", fullCultivation: 100_000_000_000, baseCultivationPerFiveSeconds: 20_000_000, recommendedPower: 30_000_000 }),
]);

/** 天赋规则。 */
export const TALENT_RULES = Object.freeze({
  initialPoints: 20,
  maximumPerTalent: 25,
  maximumTotalPoints: 100,
});

/** 神游石和离线规则。 */
export const RESOURCE_RULES = Object.freeze({
  initialSpiritStones: 0,
  maximumSpiritStones: 500,
  passiveRecoveryLimit: 30,
  recoveryIntervalSeconds: 30,
  breakthroughReward: 50,
  offlineEfficiency: 0.5,
  offlineCapHours: 8,
});

/** P1 首发 Boss 顺序。 */
export const P1_BOSS_ORDER = Object.freeze(["qi_refining_middle", "qi_refining_perfection"] as const);

const realmById = new Map<RealmId, RealmDefinition>(REALMS.map((realm) => [realm.id, realm]));

/** 获取境界定义；配置缺失时立即报错，避免静默产生错误数值。 */
export function getRealmDefinition(realmId: RealmId): RealmDefinition {
  const realm = realmById.get(realmId);
  if (!realm) {
    throw new Error(`Unknown realm: ${realmId}`);
  }
  return realm;
}

/** 获取职业定义。 */
export function getProfessionDefinition(professionId: ProfessionId): ProfessionDefinition {
  return PROFESSIONS[professionId];
}
