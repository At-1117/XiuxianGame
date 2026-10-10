import type {
  PlatformAdapter,
  PlatformKind,
  PlatformLifecycleHandlers,
  PlatformStorage,
} from "./PlatformAdapter";

/**
 * 浏览器开发环境实现。
 *
 * local storage 不可用时自动退回进程内存储，保证浏览器预览和自动化测试
 * 不会因为隐私模式或存储异常直接崩溃。
 */
export class BrowserPlatformAdapter implements PlatformAdapter {
  public readonly kind: PlatformKind = "browser";
  public readonly storage: PlatformStorage;

  public constructor() {
    this.storage = new BrowserPlatformStorage();
  }

  public subscribeLifecycle(handlers: PlatformLifecycleHandlers): () => void {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return () => undefined;
    }

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        handlers.onHide();
      } else {
        handlers.onShow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
}

/** 进程内共享回退；确保不同 Scene 创建的适配器仍能读取同一份存档。 */
const sharedFallbackValues = new Map<string, string>();

class BrowserPlatformStorage implements PlatformStorage {
  public read(key: string): string | null {
    try {
      const value = globalThis.localStorage?.getItem(key) ?? null;
      if (value !== null) {
        return value;
      }
    } catch {
      // localStorage 被禁用时继续读取共享回退。
    }
    return sharedFallbackValues.get(key) ?? null;
  }

  public write(key: string, value: string): boolean {
    try {
      const localStorage = globalThis.localStorage;
      if (localStorage) {
        localStorage.setItem(key, value);
        sharedFallbackValues.delete(key);
        return true;
      }
    } catch {
      // localStorage 写入失败时继续使用共享回退。
    }
    sharedFallbackValues.set(key, value);
    return true;
  }

  public remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Storage cleanup is best-effort; an inaccessible store must not break gameplay.
    }
    sharedFallbackValues.delete(key);
  }
}
