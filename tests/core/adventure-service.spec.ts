import { describe, expect, it } from "vitest";
import { AdventureService } from "../../assets/scripts/core/adventure/AdventureService";
import { createInitialPlayerSave } from "../../assets/scripts/core/model/PlayerProfile";
import type { RandomSource } from "../../assets/scripts/core/RandomSource";
import type { PlayerSaveV1 } from "../../assets/scripts/core/save/SaveSchema";
import type { TalentAllocation } from "../../assets/scripts/core/types/GameTypes";

const talents: TalentAllocation = { spiritRoot: 20, physique: 0, luck: 0, mind: 0 };
const service = new AdventureService();

class SequenceRandomSource implements RandomSource {
  public constructor(private readonly values: readonly number[]) {}

  private index = 0;

  public next(): number {
    const value = this.values[this.index] ?? 0;
    this.index += 1;
    return value;
  }
}

function createSave(): PlayerSaveV1 {
  return createInitialPlayerSave({ profession: "sword", talents, nowMs: 1_000 });
}

describe("adventure service", () => {
  it("recovers one adventure stone every thirty seconds up to thirty", () => {
    const save = { ...createSave(), adventureStones: 10, lastAdventureStoneRecoveryAtMs: 0 };
    const result = service.recoverSpiritStones(save, 90_000);
    expect(result.adventureStones).toBe(13);
    expect(result.lastAdventureStoneRecoveryAtMs).toBe(90_000);
  });

  it("applies profit event one as ten cultivation base units", () => {
    const result = service.runAdventure(createSave(), new SequenceRandomSource([0.1, 0.1]), 1_000);
    expect(result?.eventId).toBe("profit_01");
    expect(result?.cultivationGained).toBe(50);
    expect(result?.save.cultivation).toBe(50);
  });

  it("applies profit event two as ten spirit stones", () => {
    const result = service.runAdventure(createSave(), new SequenceRandomSource([0.1, 0.9]), 1_000);
    expect(result?.eventId).toBe("profit_02");
    expect(result?.spiritStonesGained).toBe(10);
    expect(result?.save.spiritStones).toBe(10);
  });

  it("applies choice event two reward when option A succeeds", () => {
    const result = service.runAdventure(createSave(), new SequenceRandomSource([0.6, 0.9, 0.1]), 1_000);
    expect(result?.eventId).toBe("choice_02");
    expect(result?.choice).toBe("A");
    expect(result?.cultivationGained).toBe(50);
    expect(result?.spiritStonesGained).toBe(5);
  });

  it("applies rare event one as thirty cultivation base units", () => {
    const result = service.runAdventure(createSave(), new SequenceRandomSource([0.96, 0.1]), 1_000);
    expect(result?.eventId).toBe("rare_01");
    expect(result?.cultivationGained).toBe(150);
  });

  it("applies rare event two as one hundred spirit stones", () => {
    const result = service.runAdventure(createSave(), new SequenceRandomSource([0.96, 0.9]), 1_000);
    expect(result?.eventId).toBe("rare_02");
    expect(result?.spiritStonesGained).toBe(100);
  });

  it("consumes one adventure stone per run", () => {
    const result = service.runAdventure(createSave(), new SequenceRandomSource([0.1, 0.1]), 1_000);
    expect(result?.adventureStonesRemaining).toBe(29);
  });

  it("returns null when no adventure stones remain", () => {
    const save = { ...createSave(), adventureStones: 0, lastAdventureStoneRecoveryAtMs: 1_000 };
    expect(service.runAdventure(save, new SequenceRandomSource([0.1, 0.1]), 1_000)).toBeNull();
  });
});
