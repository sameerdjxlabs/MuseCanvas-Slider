import { HAND_WARMUP_FRAMES } from './constants'
import { getClosestHand, getFingerX, getFingerY, INDEX_FINGER_TIP } from './mediapipe'
import { createPinchDetector } from './PinchDetector'

/**
 * Per-frame hand tracking + pinch state. Data lives in refs (no React state).
 */
export function createGestureManager() {
  const pinchDetector = createPinchDetector()

  const refs = {
    fingerX: { current: 0.5 },
    fingerY: { current: 0.5 },
    previousFingerX: { current: 0.5 },
    fingerDelta: { current: 0 },
    handVisible: { current: false },
    handReady: { current: false },
    isPinching: { current: false },
    pinchJustStarted: { current: false },
    pinchJustEnded: { current: false },
    landmarks: { current: null },
    warmupFramesRemaining: { current: 0 }
  }

  let handWasVisible = false

  function onHandLost() {
    refs.handVisible.current = false
    refs.handReady.current = false
    refs.isPinching.current = false
    refs.pinchJustStarted.current = false
    refs.pinchJustEnded.current = false
    refs.fingerDelta.current = 0
    refs.landmarks.current = null
    refs.warmupFramesRemaining.current = 0
    pinchDetector.reset()
    handWasVisible = false
  }

  function processDetection(results) {
    refs.pinchJustStarted.current = false
    refs.pinchJustEnded.current = false
    refs.fingerDelta.current = 0

    const handLandmarks = getClosestHand(results?.landmarks)

    if (!handLandmarks) {
      onHandLost()
      return
    }

    const indexTip = handLandmarks[INDEX_FINGER_TIP]
    const nextX = getFingerX(indexTip)
    const nextY = getFingerY(indexTip)

    if (!handWasVisible) {
      refs.previousFingerX.current = nextX
      refs.fingerX.current = nextX
      refs.fingerY.current = nextY
      refs.warmupFramesRemaining.current = HAND_WARMUP_FRAMES
      handWasVisible = true
    } else if (refs.warmupFramesRemaining.current > 0) {
      refs.previousFingerX.current = nextX
      refs.fingerX.current = nextX
      refs.fingerY.current = nextY
      refs.warmupFramesRemaining.current -= 1
    } else {
      refs.previousFingerX.current = refs.fingerX.current
      refs.fingerX.current = nextX
      refs.fingerY.current = nextY
      refs.fingerDelta.current = nextX - refs.previousFingerX.current
    }

    refs.handVisible.current = true
    refs.handReady.current = refs.warmupFramesRemaining.current === 0
    refs.landmarks.current = [handLandmarks]

    const pinch = pinchDetector.update(handLandmarks)
    refs.isPinching.current = pinch.isPinching
    refs.pinchJustStarted.current = pinch.pinchJustStarted
    refs.pinchJustEnded.current = pinch.pinchJustEnded
  }

  return { refs, processDetection, onHandLost }
}
