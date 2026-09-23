import type { PlatformStorage } from "../../platform/PlatformAdapter";
import { migrateSaveToLatest } from "./SaveMigration";
import type { PlayerSaveV1 } from "./SaveSchema";

/** 玩家存档在平台存储中的固定键名。 */
export const PLAYER_SAVE_STORAGE_KEY = "xiuxian.playerSave.v1";

/**
 * 玩家存档读写服务。
 *
 * 该服务只负责把当前版本的 PlayerSaveV1 序列化到平台存储，
 * 不处理业务规则，也不依赖 Cocos 节点。
 */
export class SaveService {
  public constructor(private readonly storage: PlatformStorage) {}

  /**
   * 读取并迁移玩家存档。
   *
   * @returns 存档不存在时返回 null；存在但格式非法时抛出错误。
   */
  public load(): PlayerSaveV1 | null {
    const raw = this.storage.read(PLAYER_SAVE_STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    return migrateSaveToLatest(JSON.parse(raw) as unknown);
  }

  /** 将当前存档写入平台存储。 */
  public save(save: PlayerSaveV1): void {
    this.storage.write(PLAYER_SAVE_STORAGE_KEY, JSON.stringify(save));
  }

  /** 删除当前存档，主要用于设置界面的删档重玩。 */
  public clear(): void {
    this.storage.remove(PLAYER_SAVE_STORAGE_KEY);
  }
}
