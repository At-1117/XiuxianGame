/** 统一时间源，后续业务只通过该接口读取时间。 */
export interface GameClock {
  /** 返回 Unix 毫秒时间戳。 */
  nowMs(): number;
}

/** 正式环境使用的系统时钟实现。 */
export class SystemGameClock implements GameClock {
  public nowMs(): number {
    return Date.now();
  }
}
