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
}
