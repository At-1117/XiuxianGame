/**
 * 平台能力的稳定边界。
 *
 * 领域层只依赖该接口，不直接引用浏览器、微信或 Cocos 的全局对象。
 * 这样后续增加微信小游戏实现时，不需要修改修炼、存档和战斗逻辑。
 */
export type PlatformKind = "browser" | "wechat";

export interface PlatformStorage {
  /** 读取原始字符串；不存在或读取失败时返回 null。 */
  read(key: string): string | null;
  /** 写入原始字符串；成功返回 true。 */
  write(key: string, value: string): boolean;
  /** 删除指定键；删除失败不应中断游戏流程。 */
  remove(key: string): void;
}

export interface PlatformLifecycleHandlers {
  /** 游戏从后台回到前台。 */
  onShow(): void;
  /** 游戏进入后台。 */
  onHide(): void;
}

export interface PlatformAdapter {
  readonly kind: PlatformKind;
  readonly storage: PlatformStorage;
  /** 订阅前后台生命周期，返回取消订阅函数。 */
  subscribeLifecycle(handlers: PlatformLifecycleHandlers): () => void;
}
