export class UpdrawMathHelper {
  public static average(a: number, b: number): number {
    return (a + b) / 2;
  }

  public static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /** Whether a value is a number other than `NaN` and the infinities. */
  public static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
}
