import { useEffect, useMemo, useRef, useState } from 'react'
import { createGestureManager } from './GestureManager'
import { createHandLandmarker } from './mediapipe'

/**
 * Webcam + MediaPipe detection loop. Gesture data lives in refs.
 * Pass enabled=false to fully stop camera and tracking.
 */
export function useHandTracking(enabled = true) {
  const videoRef = useRef(null)
  const gestureManager = useMemo(() => createGestureManager(), [])

  const handLandmarkerRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)

  const [status, setStatus] = useState(enabled ? 'loading' : 'idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setStatus('idle')
      setError(null)
      gestureManager.onHandLost()
      return undefined
    }

    let cancelled = false
    setStatus('loading')
    setError(null)

    async function init() {
      try {
        const landmarker = await createHandLandmarker()
        if (cancelled) {
          landmarker.close()
          return
        }
        handLandmarkerRef.current = landmarker

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          landmarker.close()
          return
        }
        streamRef.current = stream

        const video = videoRef.current
        if (!video) throw new Error('Video element is not available.')

        video.srcObject = stream
        await video.play()
        if (cancelled) return
        setStatus('ready')

        const detect = () => {
          if (cancelled || !handLandmarkerRef.current || !videoRef.current) return

          const currentVideo = videoRef.current

          if (
            currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            currentVideo.currentTime !== lastVideoTimeRef.current
          ) {
            lastVideoTimeRef.current = currentVideo.currentTime

            const results = handLandmarkerRef.current.detectForVideo(
              currentVideo,
              performance.now()
            )

            gestureManager.processDetection(results)
          }

          animationFrameRef.current = requestAnimationFrame(detect)
        }

        detect()
      } catch (err) {
        if (cancelled) return

        let message = 'Hand tracking unavailable.'

        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          message = 'Camera permission denied. Touch/swipe still works.'
        } else if (
          err?.message?.toLowerCase().includes('model') ||
          err?.message?.toLowerCase().includes('fetch') ||
          err?.message?.toLowerCase().includes('404')
        ) {
          message = 'Hand model failed to load. Touch/swipe still works.'
        } else if (err?.message) {
          message = err.message
        }

        setError(message)
        setStatus('error')
      }
    }

    init()

    return () => {
      cancelled = true
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close()
        handLandmarkerRef.current = null
      }
      gestureManager.onHandLost()
      lastVideoTimeRef.current = -1
    }
  }, [enabled, gestureManager])

  return {
    videoRef,
    gestureRefs: gestureManager.refs,
    status,
    error
  }
}
