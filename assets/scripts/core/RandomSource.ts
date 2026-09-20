/** 统一随机数源，便于测试中替换为确定性随机序列。 */
export interface RandomSource {
  /** 返回 [0, 1) 区间的随机数。 */
  next(): number;
}

/** 正式环境使用的系统随机数实现。 */
export class SystemRandomSource implements RandomSource {
  public next(): number {
    return Math.random();
  }
}
