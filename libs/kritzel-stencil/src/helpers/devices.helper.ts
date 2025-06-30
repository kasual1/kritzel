export class KritzelDevicesHelper {
    static isTouchDevice(): boolean {
        return window.matchMedia('(any-pointer: coarse)').matches;
    }
}