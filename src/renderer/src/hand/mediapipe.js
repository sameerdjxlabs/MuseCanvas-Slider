import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { MAX_HAND_Z, MIN_HAND_SCALE } from './constants'

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_PATH = `${import.meta.env.BASE_URL}models/hand_landmarker.task`

export const WRIST = 0
export const THUMB_TIP = 4
export const INDEX_FINGER_TIP = 8
export const MIDDLE_FINGER_TIP = 12

export async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH)

  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_PATH
    },
    runningMode: 'VIDEO',
    numHands: 2
  })
}

/** Mirrored X so hand motion matches a mirrored webcam preview. */
export function getFingerX(landmark) {
  return 1 - landmark.x
}

export function getFingerY(landmark) {
  return landmark.y
}

export function isHandCloseEnough(landmarks, maxZ = MAX_HAND_Z, minScale = MIN_HAND_SCALE) {
  const wrist = landmarks[WRIST]
  const middleTip = landmarks[MIDDLE_FINGER_TIP]

  if (wrist.z > maxZ) return false

  const handScale = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y)
  return handScale >= minScale
}

export function getClosestHand(landmarksList) {
  if (!landmarksList?.length) return null

  let closest = null
  let closestZ = Infinity

  for (const landmarks of landmarksList) {
    if (!isHandCloseEnough(landmarks)) continue

    const wristZ = landmarks[WRIST].z
    if (wristZ < closestZ) {
      closestZ = wristZ
      closest = landmarks
    }
  }

  return closest
}
