import { useCallback, useEffect, useRef, useState } from 'react'
import { artefacts } from '../../data/artefacts'
import { DEFAULT_SETTINGS, getCardOffset, getEasingCss, getTransformForOffset } from '../../data/layouts'
import { HAND_DRAG_UNIT } from '../../hand/constants'
import { useHandTracking } from '../../hand/useHandTracking'
import { WebcamOverlay } from '../../hand/WebcamOverlay'
import CarouselCard from './CarouselCard'
import ControlsMenu from './ControlsMenu'
import DetailOverlay from './DetailOverlay'
import LayoutPanel from './LayoutPanel'
import NavigationHints from './NavigationHints'
import './museweave.css'

const SPACE_DOUBLE_MS = 400
const HAND_SLIDE_THRESHOLD = 0.35

function MuseWeave() {
  const totalCards = artefacts.length
  const stageRef = useRef(null)
  const pointerIdRef = useRef(null)
  const dragStartXRef = useRef(0)
  const dragCurrentXRef = useRef(0)
  const tapTargetIndexRef = useRef(null)
  const lastInteractionRef = useRef(Date.now())
  const snapTimerRef = useRef(null)
  const lastSpaceRef = useRef(0)
  const interactionStateRef = useRef('idle')
  const isAnimatingRef = useRef(false)
  const detailOpenRef = useRef(false)
  const controlsOpenRef = useRef(false)
  const activeIndexRef = useRef(0)
  const settingsRef = useRef(DEFAULT_SETTINGS)
  const inputSourceRef = useRef(null)
  const handDragStartXRef = useRef(0)
  const handPinchingRef = useRef(false)
  const dragOffsetRef = useRef(0)

  const [activeIndex, setActiveIndex] = useState(0)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [dragOffset, setDragOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [hintOpacity, setHintOpacity] = useState(0.7)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [controlsOpen, setControlsOpen] = useState(false)

  const { videoRef, gestureRefs, status: handStatus } = useHandTracking(
    settings.inputMode === 'gesture'
  )
  const inputModeRef = useRef(settings.inputMode)
  inputModeRef.current = settings.inputMode

  activeIndexRef.current = activeIndex
  isAnimatingRef.current = isAnimating
  detailOpenRef.current = detailOpen
  controlsOpenRef.current = controlsOpen
  settingsRef.current = settings
  dragOffsetRef.current = dragOffset

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
  }, [])

  const snapToIndex = useCallback((index) => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current)

    const duration = settingsRef.current.snapDuration

    setActiveIndex(index)
    activeIndexRef.current = index
    setDragOffset(0)
    dragOffsetRef.current = 0
    setTransitionEnabled(true)
    setIsAnimating(true)
    isAnimatingRef.current = true
    interactionStateRef.current = 'snapping'
    inputSourceRef.current = null
    handPinchingRef.current = false

    if (Date.now() - lastInteractionRef.current < 5000) {
      setHintOpacity(0)
    }

    snapTimerRef.current = setTimeout(() => {
      setIsAnimating(false)
      isAnimatingRef.current = false
      interactionStateRef.current = 'idle'
    }, duration)
  }, [])

  const goToNext = useCallback(() => {
    snapToIndex((activeIndexRef.current + 1) % totalCards)
  }, [snapToIndex, totalCards])

  const goToPrevious = useCallback(() => {
    snapToIndex((activeIndexRef.current - 1 + totalCards) % totalCards)
  }, [snapToIndex, totalCards])

  const finishHandDrag = useCallback(() => {
    if (inputSourceRef.current !== 'hand') return

    const offset = dragOffsetRef.current
    inputSourceRef.current = null
    handPinchingRef.current = false

    // Drag offset follows finger: positive = moved left → next slide
    if (offset > HAND_SLIDE_THRESHOLD) {
      goToNext()
    } else if (offset < -HAND_SLIDE_THRESHOLD) {
      goToPrevious()
    } else {
      snapToIndex(activeIndexRef.current)
    }
  }, [goToNext, goToPrevious, snapToIndex])

  const openDetail = useCallback((item) => {
    setDetailItem(item)
    setDetailOpen(true)
    detailOpenRef.current = true
  }, [])

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    detailOpenRef.current = false
    markInteraction()
  }, [markInteraction])

  const handleLayoutChange = useCallback(
    (preset) => {
      setSettings((prev) => ({ ...prev, layout: preset }))
      snapToIndex(activeIndexRef.current)
      markInteraction()
    },
    [markInteraction, snapToIndex]
  )

  const handleSettingsChange = useCallback(
    (next) => {
      setSettings(next)
      markInteraction()
    },
    [markInteraction]
  )

  const handleSettingsReset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    snapToIndex(activeIndexRef.current)
    markInteraction()
  }, [markInteraction, snapToIndex])

  const toggleControls = useCallback(() => {
    setControlsOpen((open) => {
      const next = !open
      controlsOpenRef.current = next
      return next
    })
    markInteraction()
  }, [markInteraction])

  const handlePointerDown = useCallback(
    (e) => {
      if (inputModeRef.current !== 'pointer') return
      if (controlsOpenRef.current || detailOpenRef.current || isAnimatingRef.current) return
      if (inputSourceRef.current === 'hand') return
      if (pointerIdRef.current !== null) return

      inputSourceRef.current = 'pointer'
      pointerIdRef.current = e.pointerId
      dragStartXRef.current = e.clientX
      dragCurrentXRef.current = e.clientX
      markInteraction()

      const card = e.target.closest('.mw-card')
      tapTargetIndexRef.current = card ? Number(card.dataset.index) : null

      stageRef.current?.setPointerCapture(e.pointerId)
    },
    [markInteraction]
  )

  const handlePointerMove = useCallback(
    (e) => {
      if (inputModeRef.current !== 'pointer') return
      if (inputSourceRef.current !== 'pointer') return
      if (e.pointerId !== pointerIdRef.current) return

      dragCurrentXRef.current = e.clientX
      const dx = dragCurrentXRef.current - dragStartXRef.current
      const threshold = settingsRef.current.dragThreshold

      if (interactionStateRef.current !== 'dragging' && Math.abs(dx) > threshold) {
        interactionStateRef.current = 'dragging'
        setTransitionEnabled(false)
      }

      if (interactionStateRef.current === 'dragging') {
        // Negate so slides follow the drag direction
        const next = -dx / (window.innerWidth * settingsRef.current.dragSensitivity)
        dragOffsetRef.current = next
        setDragOffset(next)
      }

      markInteraction()
    },
    [markInteraction]
  )

  const handlePointerUp = useCallback(
    (e) => {
      if (inputModeRef.current !== 'pointer') return
      if (inputSourceRef.current !== 'pointer') return
      if (e.pointerId !== pointerIdRef.current) return
      pointerIdRef.current = null
      inputSourceRef.current = null

      const threshold = settingsRef.current.dragThreshold

      if (interactionStateRef.current === 'dragging') {
        const dx = dragCurrentXRef.current - dragStartXRef.current

        // Drag left → next, drag right → previous (matches follow-finger motion)
        if (dx > threshold) {
          goToPrevious()
        } else if (dx < -threshold) {
          goToNext()
        } else {
          snapToIndex(activeIndexRef.current)
        }
      } else {
        const index = tapTargetIndexRef.current
        if (index !== null && !Number.isNaN(index)) {
          if (index === activeIndexRef.current) {
            openDetail(artefacts[index])
          } else {
            snapToIndex(index)
          }
        }
      }

      tapTargetIndexRef.current = null
      markInteraction()
    },
    [goToNext, goToPrevious, markInteraction, openDetail, snapToIndex]
  )

  // Hand pinch + drag → same slide navigation as swipe
  useEffect(() => {
    let frameId = 0

    const tick = () => {
      const gestureEnabled = inputModeRef.current === 'gesture'
      const blocked =
        !gestureEnabled ||
        controlsOpenRef.current ||
        detailOpenRef.current ||
        isAnimatingRef.current ||
        inputSourceRef.current === 'pointer'

      if (!blocked && handStatus === 'ready') {
        const g = gestureRefs

        if (g.pinchJustStarted.current && g.handReady.current) {
          inputSourceRef.current = 'hand'
          handPinchingRef.current = true
          handDragStartXRef.current = g.fingerX.current
          interactionStateRef.current = 'dragging'
          setTransitionEnabled(false)
          dragOffsetRef.current = 0
          setDragOffset(0)
          markInteraction()
        }

        if (inputSourceRef.current === 'hand' && g.isPinching.current && g.handReady.current) {
          // Invert so slides follow hand direction
          const next = (handDragStartXRef.current - g.fingerX.current) / HAND_DRAG_UNIT
          dragOffsetRef.current = next
          setDragOffset(next)
          markInteraction()
        }

        const handDragEnded =
          inputSourceRef.current === 'hand' &&
          handPinchingRef.current &&
          (g.pinchJustEnded.current || !g.isPinching.current || !g.handVisible.current)

        if (handDragEnded) {
          finishHandDrag()
        }
      } else if (inputSourceRef.current === 'hand') {
        // Cancel hand drag cleanly if mode changes or overlay opens
        inputSourceRef.current = null
        handPinchingRef.current = false
        dragOffsetRef.current = 0
        setDragOffset(0)
        setTransitionEnabled(true)
        interactionStateRef.current = 'idle'
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [finishHandDrag, gestureRefs, handStatus, markInteraction])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Escape' && controlsOpenRef.current) {
        e.preventDefault()
        setControlsOpen(false)
        controlsOpenRef.current = false
        markInteraction()
        return
      }

      if (e.code !== 'Space' && e.key !== ' ') return
      if (e.repeat) return

      e.preventDefault()
      const now = Date.now()
      if (now - lastSpaceRef.current <= SPACE_DOUBLE_MS) {
        lastSpaceRef.current = 0
        toggleControls()
      } else {
        lastSpaceRef.current = now
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [markInteraction, toggleControls])

  useEffect(() => {
    const idleTimer = setInterval(() => {
      if (controlsOpenRef.current) return
      if (Date.now() - lastInteractionRef.current <= settingsRef.current.idleTimeout * 1000) return

      if (detailOpenRef.current) {
        setDetailOpen(false)
        detailOpenRef.current = false
        setTimeout(() => {
          if (activeIndexRef.current !== 0) snapToIndex(0)
        }, 400)
      } else if (activeIndexRef.current !== 0) {
        snapToIndex(0)
      }

      setHintOpacity(0.7)
    }, 5000)

    return () => clearInterval(idleTimer)
  }, [snapToIndex])

  useEffect(() => {
    return () => {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
    }
  }, [])

  const easingCss = getEasingCss(settings.easing)
  const transitionCss = transitionEnabled
    ? `transform ${settings.snapDuration}ms ${easingCss}, opacity ${settings.snapDuration}ms ${easingCss}, filter ${settings.snapDuration}ms ${easingCss}`
    : 'none'

  const counter = `${String(activeIndex + 1).padStart(2, '0')} / ${totalCards}`

  return (
    <div className="mw-app">
      <div
        className="mw-stage"
        style={{
          '--mw-card-w': settings.cardWidth,
          '--mw-card-h': settings.cardHeight
        }}
      >
        <div className="mw-bg-glow" />
        <div className="mw-vignette" />

        <div className="mw-header">
          <div className="mw-title-area">
            <div className="mw-app-title">MuseWeave</div>
            {settings.showCounter && <div className="mw-item-counter">{counter}</div>}
          </div>
        </div>

        {settings.showLayoutPanel && (
          <LayoutPanel activeLayout={settings.layout} onChange={handleLayoutChange} />
        )}

        <div
          ref={stageRef}
          className={`mw-carousel-stage${detailOpen || controlsOpen ? ' dimmed' : ''}`}
          style={{ perspective: `${settings.perspective}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {artefacts.map((artefact, i) => {
            const offset = getCardOffset(i, activeIndex, totalCards)
            const effectiveOffset = offset - dragOffset
            const transform = getTransformForOffset(effectiveOffset, settings.layout, settings)
            const absO = Math.abs(offset)
            const interactable =
              absO < 1.5 && !detailOpen && !isAnimating && !controlsOpen

            return (
              <CarouselCard
                key={`${artefact.title}-${i}`}
                artefact={{ ...artefact, index: i }}
                interactable={interactable}
                transitionEnabled={transitionEnabled}
                style={{
                  transition: transitionCss,
                  transform: `translate3d(calc(${transform.tx} * var(--sw)), calc(${transform.ty} * var(--sh)), 0) scale(${transform.scale}) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) rotateZ(${transform.rotateZ}deg)`,
                  zIndex: Math.max(0, transform.zIndex),
                  opacity: transform.opacity,
                  filter: `blur(${transform.blur}px)`
                }}
              />
            )
          })}
        </div>

        {settings.showHints && (
          <NavigationHints
            hintOpacity={hintOpacity}
            disabled={detailOpen || isAnimating || controlsOpen}
            onPrev={() => {
              goToPrevious()
              markInteraction()
            }}
            onNext={() => {
              goToNext()
              markInteraction()
            }}
          />
        )}

        {settings.inputMode === 'gesture' && handStatus === 'ready' && !controlsOpen && (
          <div className="mw-hand-hint">Pinch &amp; drag to change slides</div>
        )}

        {settings.inputMode === 'gesture' && (
          <WebcamOverlay
            videoRef={videoRef}
            landmarksRef={gestureRefs.landmarks}
            handDetectedRef={gestureRefs.handVisible}
            visible={handStatus !== 'error'}
            status={handStatus}
          />
        )}

        <DetailOverlay item={detailItem} open={detailOpen} onClose={closeDetail} />

        <ControlsMenu
          open={controlsOpen}
          settings={settings}
          onChange={handleSettingsChange}
          onReset={handleSettingsReset}
          onClose={() => {
            setControlsOpen(false)
            controlsOpenRef.current = false
            markInteraction()
          }}
        />
      </div>
    </div>
  )
}

export default MuseWeave
