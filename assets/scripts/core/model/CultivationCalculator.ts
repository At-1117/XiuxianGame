import { getRealmDefinition } from "../../data/GameConfig";
import type { RealmId, TalentAllocation } from "../types/GameTypes";

/** 计算灵力获取效率：1 + 灵根点数 × 0.02。 */
export function getCultivationEfficiency(talents: TalentAllocation): number {
  return 1 + talents.spiritRoot * 0.02;
}

/** 计算每秒基础灵力产出。当前公式以每 5 秒值为基准。 */
export function getCultivationPerSecond(realmId: RealmId, talents: TalentAllocation): number {
  const realm = getRealmDefinition(realmId);
  return (realm.baseCultivationPerFiveSeconds / 5) * getCultivationEfficiency(talents);
}
