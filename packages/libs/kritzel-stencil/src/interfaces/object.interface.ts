import { KritzelBoundingBox } from "./bounding-box.interface";

export interface KritzelObject {
    id: string;
    visible: boolean;
    isInViewport(viewport: KritzelBoundingBox, scale: number): boolean;
}
