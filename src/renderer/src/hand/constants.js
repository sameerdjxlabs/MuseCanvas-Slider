/** Pinch hysteresis — start below this, end above this. */
export const PINCH_START = 0.04
export const PINCH_END = 0.06

/** Frames to ignore after hand reappears (avoids jump). */
export const HAND_WARMUP_FRAMES = 8

/**
 * Max wrist z for a hand to count as "close" (MediaPipe: smaller z = nearer).
 */
export const MAX_HAND_Z = 0.02

/**
 * Min wrist-to-middle-finger span in normalized image space.
 * Filters out small/far hands in the background.
 */
export const MIN_HAND_SCALE = 0.14

/**
 * How much horizontal finger travel (0–1 normalized) equals one full slide step.
 * Lower = more sensitive.
 */
export const HAND_DRAG_UNIT = 0.22
