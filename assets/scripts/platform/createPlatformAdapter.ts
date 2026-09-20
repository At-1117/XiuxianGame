import type { PlatformAdapter } from "./PlatformAdapter";
import { BrowserPlatformAdapter } from "./BrowserPlatformAdapter";

/**
 * 创建当前运行环境的平台适配器。
 *
 * 微信实现将在后续阶段补充；当前阶段只提供可运行的浏览器实现，确保
 * 工程骨架可以在 Cocos 预览中启动。
 */
export function createPlatformAdapter(): PlatformAdapter {
  return new BrowserPlatformAdapter();
}
