import { useCallback, useEffect, useRef, useState } from 'react'
import { artefacts } from '../../data/artefacts'
import { DEFAULT_SETTINGS, getCardOffset, getEasingCss, getTransformForOffset } from '../../data/layouts'
import CarouselCard from './CarouselCard'
import ControlsMenu from './ControlsMenu'
import DetailOverlay from './DetailOverlay'
import LayoutPanel from './LayoutPanel'
import NavigationHints from './NavigationHints'
import './museweave.css'

const SPACE_DOUBLE_MS = 400

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

  const [activeIndex, setActiveIndex] = useState(0)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [dragOffset, setDragOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [hintOpacity, setHintOpacity] = useState(0.7)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [controlsOpen, setControlsOpen] = useState(false)

  activeIndexRef.current = activeIndex
  isAnimatingRef.current = isAnimating
  detailOpenRef.current = detailOpen
  controlsOpenRef.current = controlsOpen
  settingsRef.current = settings

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
  }, [])

  const snapToIndex = useCallback((index) => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current)

    const duration = settingsRef.current.snapDuration

    setActiveIndex(index)
    activeIndexRef.current = index
    setDragOffset(0)
    setTransitionEnabled(true)
    setIsAnimating(true)
    isAnimatingRef.current = true
    interactionStateRef.current = 'snapping'

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
      if (controlsOpenRef.current || detailOpenRef.current || isAnimatingRef.current) return
      if (pointerIdRef.current !== null) return

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
      if (e.pointerId !== pointerIdRef.current) return

      dragCurrentXRef.current = e.clientX
      const dx = dragCurrentXRef.current - dragStartXRef.current
      const threshold = settingsRef.current.dragThreshold

      if (interactionStateRef.current !== 'dragging' && Math.abs(dx) > threshold) {
        interactionStateRef.current = 'dragging'
        setTransitionEnabled(false)
      }

      if (interactionStateRef.current === 'dragging') {
        setDragOffset(dx / (window.innerWidth * settingsRef.current.dragSensitivity))
      }

      markInteraction()
    },
    [markInteraction]
  )

  const handlePointerUp = useCallback(
    (e) => {
      if (e.pointerId !== pointerIdRef.current) return
      pointerIdRef.current = null

      const threshold = settingsRef.current.dragThreshold

      if (interactionStateRef.current === 'dragging') {
        const dx = dragCurrentXRef.current - dragStartXRef.current

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
          className={`mw-carousel-stage${detailOpen || controlsOpen ? ' ' : ''}`}
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
