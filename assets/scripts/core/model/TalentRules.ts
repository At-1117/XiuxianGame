import { TALENT_RULES } from "../../data/GameConfig";
import type { TalentAllocation } from "../types/GameTypes";

/** 天赋校验失败时抛出的业务异常。 */
export class TalentValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "TalentValidationError";
  }
}

/** 创建四项全零的天赋分配。 */
export function createEmptyTalents(): TalentAllocation {
  return { spiritRoot: 0, physique: 0, luck: 0, mind: 0 };
}

/** 返回天赋总点数。 */
export function getTalentPointTotal(talents: TalentAllocation): number {
  return talents.spiritRoot + talents.physique + talents.luck + talents.mind;
}

/** 判断初始天赋是否完成分配：总点数恰好 20 且四项都至少 1 点。 */
export function isInitialTalentAllocationComplete(talents: TalentAllocation): boolean {
  return (
    getTalentPointTotal(talents) === TALENT_RULES.initialPoints &&
    talents.spiritRoot > 0 &&
    talents.physique > 0 &&
    talents.luck > 0 &&
    talents.mind > 0
  );
}

/** 校验初始天赋分配，保证点数为整数、总点数恰好 20 且每项不超过 25。 */
export function validateInitialTalents(talents: TalentAllocation): void {
  const values = [talents.spiritRoot, talents.physique, talents.luck, talents.mind];
  if (values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new TalentValidationError("Talent points must be non-negative integers.");
  }
  if (values.some((value) => value > TALENT_RULES.maximumPerTalent)) {
    throw new TalentValidationError(`Single talent cannot exceed ${TALENT_RULES.maximumPerTalent}.`);
  }
  if (getTalentPointTotal(talents) !== TALENT_RULES.initialPoints) {
    throw new TalentValidationError(`Initial talent total must equal ${TALENT_RULES.initialPoints}.`);
  }
}
