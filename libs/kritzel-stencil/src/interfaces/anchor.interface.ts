/**
 * Represents an anchor connection from a line endpoint to another object's center.
 */
export interface LineAnchor {
  /** The ID of the object that this line endpoint is anchored to */
  objectId: string;
}

/**
 * Entry in the anchor index that tracks which lines are anchored to an object.
 */
export interface AnchorIndexEntry {
  /** The ID of the line that has an anchor */
  lineId: string;
  /** Which endpoint of the line is anchored */
  endpoint: 'start' | 'end';
}

/**
 * Represents a potential snap target during line endpoint dragging.
 */
export interface SnapTarget {
  /** The ID of the object that can be snapped to */
  objectId: string;
  /** The center X coordinate of the snap target in world coordinates */
  centerX: number;
  /** The center Y coordinate of the snap target in world coordinates */
  centerY: number;
}

/**
 * Represents the current snap candidate state during dragging.
 */
export interface SnapCandidate {
  /** The ID of the object being snapped to */
  objectId: string;
  /** Which endpoint of the line is being snapped */
  endpoint: 'start' | 'end';
  /** The center X coordinate for the snap indicator */
  centerX: number;
  /** The center Y coordinate for the snap indicator */
  centerY: number;
  /** The X coordinate of the line endpoint (world coords) */
  lineEndpointX: number;
  /** The Y coordinate of the line endpoint (world coords) */
  lineEndpointY: number;
  /** The X coordinate where the line intersects the object's edge (world coords) */
  edgeX?: number;
  /** The Y coordinate where the line intersects the object's edge (world coords) */
  edgeY?: number;
  /** The stroke color of the line being snapped */
  lineStroke?: string;
  /** The stroke width of the line being snapped */
  lineStrokeWidth?: number;
}

/**
 * Visualization data for rendering anchor indicator lines.
 */
export interface AnchorVisualization {
  /** The X coordinate where the line intersects the object's edge */
  edgeX: number;
  /** The Y coordinate where the line intersects the object's edge */
  edgeY: number;
  /** The center X coordinate of the anchored object */
  centerX: number;
  /** The center Y coordinate of the anchored object */
  centerY: number;
}

/**
 * Render data for anchor lines visualization (dashed lines from edge to center).
 */
export interface AnchorLinesRenderData {
  /** The stroke width of the line */
  lineStrokeWidth: number;
  /** The stroke width for the indicator circle */
  indicatorStrokeWidth: string;
  /** The dash array for the dashed line */
  dashArray: string;
  /** The radius of the indicator circle */
  indicatorRadius: number;
  /** Visualization data for the start anchor, if any */
  startAnchorViz: AnchorVisualization | null;
  /** Visualization data for the end anchor, if any */
  endAnchorViz: AnchorVisualization | null;
}

/**
 * Render data for snap indicator visualization.
 */
export interface SnapIndicatorRenderData {
  /** The radius of the indicator circle */
  indicatorRadius: number;
  /** The stroke width for the indicator circle */
  indicatorStrokeWidth: string;
  /** The stroke width for the line */
  lineStrokeWidth: string;
  /** The dash array for the dashed line */
  dashArray: string;
  /** The stroke color of the line */
  lineStroke: string;
  /** The center X coordinate */
  centerX: number;
  /** The center Y coordinate */
  centerY: number;
  /** The X coordinate of the line endpoint */
  lineEndpointX: number;
  /** The Y coordinate of the line endpoint */
  lineEndpointY: number;
  /** The X coordinate where the line intersects the object's edge */
  edgeX?: number;
  /** The Y coordinate where the line intersects the object's edge */
  edgeY?: number;
}

