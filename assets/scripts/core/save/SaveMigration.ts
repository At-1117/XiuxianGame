import type { PlayerSaveV1 } from "./SaveSchema";
import { CURRENT_SAVE_VERSION, isPlayerSaveV1 } from "./SaveSchema";

/** 存档迁移或版本校验失败。 */
export class SaveMigrationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "SaveMigrationError";
  }
}

/**
 * 将未知存档迁移到当前版本。
 *
 * 当前仅有版本 1，因此先做严格校验。后续新增版本时，应在这里按版本顺序
 * 逐级迁移，不能直接在读取处散落兼容分支。
 */
export function migrateSaveToLatest(value: unknown): PlayerSaveV1 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SaveMigrationError("Save data must be an object.");
  }

  const version = (value as { schemaVersion?: unknown }).schemaVersion;
  if (version !== CURRENT_SAVE_VERSION) {
    throw new SaveMigrationError(`Unsupported save version: ${String(version)}.`);
  }

  if (!isPlayerSaveV1(value)) {
    throw new SaveMigrationError("Save data is incomplete or invalid.");
  }

  return value;
}
