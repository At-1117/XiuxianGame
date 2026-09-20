import type { PlatformAdapter } from "../platform/PlatformAdapter";
import { createPlatformAdapter } from "../platform/createPlatformAdapter";
import type { GameClock } from "../core/GameClock";
import { SystemGameClock } from "../core/GameClock";
import type { RandomSource } from "../core/RandomSource";
import { SystemRandomSource } from "../core/RandomSource";

/** 游戏运行时共享的根依赖集合。 */
export interface GameRuntime {
  readonly platform: PlatformAdapter;
  readonly clock: GameClock;
  readonly random: RandomSource;
}

/**
 * 组装运行时依赖。
 *
 * 该函数不依赖 Cocos 节点，场景脚本只需要持有返回的 GameRuntime，
 * 从而保持领域逻辑和表现层的边界稳定。
 */
export function createGameRuntime(): GameRuntime {
  return {
    platform: createPlatformAdapter(),
    clock: new SystemGameClock(),
    random: new SystemRandomSource(),
  };
}
