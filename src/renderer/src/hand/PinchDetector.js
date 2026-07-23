import { INDEX_FINGER_TIP, THUMB_TIP } from './mediapipe'
import { PINCH_END, PINCH_START } from './constants'

/**
 * Hysteresis-based pinch detector to avoid flicker.
 */
export function createPinchDetector() {
  let isPinching = false

  function getPinchDistance(landmarks) {
    const thumb = landmarks[THUMB_TIP]
    const index = landmarks[INDEX_FINGER_TIP]
    return Math.hypot(thumb.x - index.x, thumb.y - index.y, thumb.z - index.z)
  }

  function update(landmarks) {
    const distance = getPinchDistance(landmarks)
    const wasPinching = isPinching

    if (!isPinching && distance < PINCH_START) {
      isPinching = true
    } else if (isPinching && distance > PINCH_END) {
      isPinching = false
    }

    return {
      isPinching,
      pinchJustStarted: isPinching && !wasPinching,
      pinchJustEnded: !isPinching && wasPinching,
      distance
    }
  }

  function reset() {
    isPinching = false
  }

  return { update, reset }
}
