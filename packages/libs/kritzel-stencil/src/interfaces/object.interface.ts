import { KritzelBoundingBox } from "./bounding-box.interface";

export interface KritzelObject {
    id: string;
    visible: boolean;
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    height: number;
    width: number;
    scale: number;
    selected: boolean;
    markedForRemoval: boolean;
    get boundingBox(): KritzelBoundingBox;
    generateId(): string;
    isInViewport(viewport: KritzelBoundingBox, scale: number): boolean;
    isPointInBoundingBox(_x: number, _y: number): boolean;
    centerInViewport(): void;
}
