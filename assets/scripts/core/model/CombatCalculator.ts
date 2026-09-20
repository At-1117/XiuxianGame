import { getProfessionDefinition, getRealmDefinition } from "../../data/GameConfig";
import type { ProfessionId, RealmId, TalentAllocation } from "../types/GameTypes";

/** 计算体质加成：1 + 体质点数 × 0.03。 */
export function getPhysiquePowerMultiplier(talents: TalentAllocation): number {
  return 1 + talents.physique * 0.03;
}

/** P21：首版玩家基础战力等于当前境界 P2 推荐战力。 */
export function getPlayerBasePower(realmId: RealmId): number {
  return getRealmDefinition(realmId).recommendedPower;
}

/** 计算无装备状态下的当前战力。 */
export function getPlayerPower(realmId: RealmId, talents: TalentAllocation): number {
  return getPlayerBasePower(realmId) * getPhysiquePowerMultiplier(talents);
}

/** 计算 P1 普攻每秒伤害，不含 Boss 抗性和后续装备词条。 */
export function getBasicAttackPerSecond(
  realmId: RealmId,
  professionId: ProfessionId,
  talents: TalentAllocation,
): number {
  const profession = getProfessionDefinition(professionId);
  return (
    getPlayerPower(realmId, talents) *
    profession.attackSpeedCoefficient *
    profession.damageCoefficient
  );
}
