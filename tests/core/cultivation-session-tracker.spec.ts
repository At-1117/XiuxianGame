import { describe, expect, it } from "vitest";
import {
  CULTIVATION_FOREGROUND_AWAY_STARTED_AT_MS_KEY,
  CultivationSessionTracker,
} from "../../assets/scripts/core/cultivation/CultivationSessionTracker";
import type { PlatformStorage } from "../../assets/scripts/platform/PlatformAdapter";

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

describe("cultivation session tracker", () => {
  it("stores and reads the foreground-away timestamp", () => {
    const storage = new MemoryStorage();
    const tracker = new CultivationSessionTracker(storage);

    tracker.markForegroundAway(12_345);

    expect(storage.read(CULTIVATION_FOREGROUND_AWAY_STARTED_AT_MS_KEY)).toBe("12345");
    expect(tracker.readForegroundAwayStartedAtMs()).toBe(12_345);
  });

  it("ignores invalid timestamps and clears the marker", () => {
    const storage = new MemoryStorage();
    const tracker = new CultivationSessionTracker(storage);

    tracker.markForegroundAway(-1);
    expect(tracker.readForegroundAwayStartedAtMs()).toBeNull();

    storage.write(CULTIVATION_FOREGROUND_AWAY_STARTED_AT_MS_KEY, "not-a-number");
    expect(tracker.readForegroundAwayStartedAtMs()).toBeNull();

    tracker.markForegroundAway(1_000);
    tracker.clearForegroundAway();
    expect(tracker.readForegroundAwayStartedAtMs()).toBeNull();
  });
});
