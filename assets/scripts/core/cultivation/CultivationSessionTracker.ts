import type { PlatformStorage } from "../../platform/PlatformAdapter";

/** 记录“已离开修炼场景但游戏仍在前台”的开始时间。 */
export const CULTIVATION_FOREGROUND_AWAY_STARTED_AT_MS_KEY =
  "xiuxian.cultivation.foregroundAwayStartedAtMs";

/**
 * 跨场景修炼会话标记。
 *
 * 该服务只负责记录玩家离开修炼场景的时间点，不直接计算灵力。
 * 修炼场景返回时会读取该标记，把停留在其他面板的时间按在线收益补算。
 */
export class CultivationSessionTracker {
  public constructor(private readonly storage: PlatformStorage) {}

  /** 标记玩家从前台进入了另一个面板。 */
  public markForegroundAway(nowMs: number): void {
    if (!Number.isFinite(nowMs) || nowMs < 0) {
      return;
    }
    this.storage.write(CULTIVATION_FOREGROUND_AWAY_STARTED_AT_MS_KEY, String(nowMs));
  }

  /** 读取离开时间；没有标记或数据非法时返回 null。 */
  public readForegroundAwayStartedAtMs(): number | null {
    const raw = this.storage.read(CULTIVATION_FOREGROUND_AWAY_STARTED_AT_MS_KEY);
    if (raw === null) {
      return null;
    }

    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  /** 清除跨场景标记，防止同一段时间被重复结算。 */
  public clearForegroundAway(): void {
    this.storage.remove(CULTIVATION_FOREGROUND_AWAY_STARTED_AT_MS_KEY);
  }
}
