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

class BrowserPlatformStorage implements PlatformStorage {
  private readonly fallbackValues = new Map<string, string>();

  public read(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return this.fallbackValues.get(key) ?? null;
    }
  }

  public write(key: string, value: string): boolean {
    try {
      globalThis.localStorage?.setItem(key, value);
      return true;
    } catch {
      this.fallbackValues.set(key, value);
      return true;
    }
  }

  public remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Storage cleanup is best-effort; an inaccessible store must not break gameplay.
    }
    this.fallbackValues.delete(key);
  }
}
