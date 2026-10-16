export class KritzelUserColorHelper {
  /**
   * Generates a stable HSL color from a name (used for user and agentic cursor colors).
   */
  static generateColorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 45%, 55%)`;
  }
}
