import { describe, expect, it } from "vitest";
import { SaveService } from "../../assets/scripts/core/save/SaveService";
import { createInitialPlayerSave } from "../../assets/scripts/core/model/PlayerProfile";
import type { PlatformStorage } from "../../assets/scripts/platform/PlatformAdapter";
import type { TalentAllocation } from "../../assets/scripts/core/types/GameTypes";

const talents: TalentAllocation = { spiritRoot: 20, physique: 0, luck: 0, mind: 0 };

class MemoryStorage implements PlatformStorage {
  private readonly values = new Map<string, string>();

  public read(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public write(key: string, value: string): boolean {
    this.values.set(key, value);
    return true;
  }

  public remove(key: string): void {
    this.values.delete(key);
  }
}

describe("save service", () => {
  it("returns null before the first save", () => {
    const service = new SaveService(new MemoryStorage());
    expect(service.load()).toBeNull();
  });

  it("round-trips a valid player save", () => {
    const storage = new MemoryStorage();
    const service = new SaveService(storage);
    const save = createInitialPlayerSave({ profession: "sword", talents, nowMs: 1_000 });

    service.save(save);

    expect(service.load()).toEqual(save);
  });

  it("clears the stored save", () => {
    const service = new SaveService(new MemoryStorage());
    const save = createInitialPlayerSave({ profession: "sword", talents, nowMs: 1_000 });

    service.save(save);
    service.clear();

    expect(service.load()).toBeNull();
  });
});
