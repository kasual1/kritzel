import { KritzelBoundingBox } from "./bounding-box.interface";
import { KritzelSelection } from "./selection.interface";

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
    resizing: boolean;
    markedForRemoval: boolean;
    selection: KritzelSelection;
    get boundingBox(): KritzelBoundingBox;
    generateId(): string;
    isInViewport(viewport: KritzelBoundingBox, scale: number): boolean;
    centerInViewport(): void;
    updateDimensions(x: number, y: number, width: number, height: number): void;
}
