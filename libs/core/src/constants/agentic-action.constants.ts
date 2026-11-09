/** Press duration in milliseconds at the default speed. */
export const AGENTIC_ACTION_PRESS_MS = 90;
/** Release duration in milliseconds at the default speed. */
export const AGENTIC_ACTION_RELEASE_MS = 90;
/** Drag speed in screen pixels per second at the default speed. */
export const AGENTIC_ACTION_DRAG_SPEED = 600;
/** Minimum drag duration in milliseconds at the default speed. */
export const AGENTIC_ACTION_DRAG_MIN_MS = 250;
/** Maximum drag duration in milliseconds at the default speed. */
export const AGENTIC_ACTION_DRAG_MAX_MS = 1500;
/** Interval of throttled Yjs writes during animated changes (same as SelectionGroup's child persist throttle). */
export const AGENTIC_ACTION_PERSIST_INTERVAL_MS = 100;
/** The default speed; `speed / AGENTIC_ACTION_DEFAULT_SPEED` scales all non-flight phases. */
export const AGENTIC_ACTION_DEFAULT_SPEED = 1200;
/** Rotation speed in degrees per second at the default speed (clamped to 300..1500 ms). */
export const AGENTIC_ACTION_ROTATE_SPEED = 180;
/** Drawing speed in screen pixels per second along the path at the default speed (clamped to 250..4000 ms). */
export const AGENTIC_ACTION_DRAW_SPEED = 900;
/** Typing speed in characters per second at the default speed. */
export const AGENTIC_ACTION_TYPING_CPS = 25;
/** Frames a created text waits to be mounted so its size can be measured. */
export const AGENTIC_ACTION_MOUNT_WAIT_FRAMES = 10;
