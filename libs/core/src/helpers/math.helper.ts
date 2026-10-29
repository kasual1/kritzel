export class KritzelMathHelper {
  public static average(a: number, b: number): number {
    return (a + b) / 2;
  }

  public static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
