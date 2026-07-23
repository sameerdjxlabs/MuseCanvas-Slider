import { useEffect, useRef } from 'react'
import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision'
import './handtracking.css'

const LANDMARK_STYLE = { color: '#ffb347', lineWidth: 2 }
const CONNECTOR_STYLE = { color: '#ffb347', lineWidth: 1.5 }

/**
 * Small PIP webcam preview with hand skeleton overlay.
 */
export function WebcamOverlay({ videoRef, landmarksRef, handDetectedRef, visible = true, status }) {
  const canvasRef = useRef(null)
  const statusDotRef = useRef(null)
  const drawingUtilsRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    drawingUtilsRef.current = new DrawingUtils(ctx)

    let frameId

    const render = () => {
      const video = videoRef.current
      const overlayCanvas = canvasRef.current
      const drawingUtils = drawingUtilsRef.current

      if (video && overlayCanvas && video.videoWidth > 0) {
        if (
          overlayCanvas.width !== video.videoWidth ||
          overlayCanvas.height !== video.videoHeight
        ) {
          overlayCanvas.width = video.videoWidth
          overlayCanvas.height = video.videoHeight
        }

        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

        const landmarks = landmarksRef.current
        if (landmarks?.length > 0 && drawingUtils) {
          for (const handLandmarks of landmarks) {
            drawingUtils.drawConnectors(
              handLandmarks,
              HandLandmarker.HAND_CONNECTIONS,
              CONNECTOR_STYLE
            )
            drawingUtils.drawLandmarks(handLandmarks, LANDMARK_STYLE)
          }
        }
      }

      if (statusDotRef.current) {
        statusDotRef.current.classList.toggle(
          'mw-webcam__status--active',
          !!handDetectedRef.current
        )
      }

      frameId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(frameId)
  }, [videoRef, landmarksRef, handDetectedRef])

  return (
    <div className={`mw-webcam${visible ? '' : ' mw-webcam--hidden'}`}>
      <div className="mw-webcam__header">
        <span ref={statusDotRef} className="mw-webcam__status" />
        <span className="mw-webcam__label">
          {status === 'ready' ? 'HAND TRACKING' : status === 'loading' ? 'LOADING…' : 'CAMERA OFF'}
        </span>
      </div>
      <div className="mw-webcam__feed">
        <video ref={videoRef} className="mw-webcam__video" playsInline muted autoPlay />
        <canvas ref={canvasRef} className="mw-webcam__canvas" />
      </div>
    </div>
  )
}
