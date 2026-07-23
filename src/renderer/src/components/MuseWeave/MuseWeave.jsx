import { useCallback, useEffect, useRef, useState } from 'react'
import { artefacts } from '../../data/artefacts'
import { getCardOffset, getTransformForOffset } from '../../data/layouts'
import CarouselCard from './CarouselCard'
import DetailOverlay from './DetailOverlay'
import LayoutPanel from './LayoutPanel'
import NavigationHints from './NavigationHints'
import './museweave.css'

const DRAG_THRESHOLD = 40
const SNAP_MS = 350
const IDLE_MS = 25000

function MuseWeave() {
  const totalCards = artefacts.length
  const stageRef = useRef(null)
  const pointerIdRef = useRef(null)
  const dragStartXRef = useRef(0)
  const dragCurrentXRef = useRef(0)
  const tapTargetIndexRef = useRef(null)
  const lastInteractionRef = useRef(Date.now())
  const snapTimerRef = useRef(null)
  const interactionStateRef = useRef('idle')
  const isAnimatingRef = useRef(false)
  const detailOpenRef = useRef(false)
  const activeIndexRef = useRef(0)

  const [activeIndex, setActiveIndex] = useState(0)
  const [activeLayout, setActiveLayout] = useState('arc')
  const [dragOffset, setDragOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [hintOpacity, setHintOpacity] = useState(0.7)
  const [transitionEnabled, setTransitionEnabled] = useState(true)

  activeIndexRef.current = activeIndex
  isAnimatingRef.current = isAnimating
  detailOpenRef.current = detailOpen

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
  }, [])

  const snapToIndex = useCallback((index) => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current)

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
    }, SNAP_MS)
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
      setActiveLayout(preset)
      snapToIndex(activeIndexRef.current)
      markInteraction()
    },
    [markInteraction, snapToIndex]
  )

  const handlePointerDown = useCallback(
    (e) => {
      if (detailOpenRef.current || isAnimatingRef.current) return
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

      if (interactionStateRef.current !== 'dragging' && Math.abs(dx) > DRAG_THRESHOLD) {
        interactionStateRef.current = 'dragging'
        setTransitionEnabled(false)
      }

      if (interactionStateRef.current === 'dragging') {
        setDragOffset(dx / (window.innerWidth * 0.25))
      }

      markInteraction()
    },
    [markInteraction]
  )

  const handlePointerUp = useCallback(
    (e) => {
      if (e.pointerId !== pointerIdRef.current) return
      pointerIdRef.current = null

      if (interactionStateRef.current === 'dragging') {
        const dx = dragCurrentXRef.current - dragStartXRef.current

        if (dx > DRAG_THRESHOLD) {
          goToPrevious()
        } else if (dx < -DRAG_THRESHOLD) {
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
    const idleTimer = setInterval(() => {
      if (Date.now() - lastInteractionRef.current <= IDLE_MS) return

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

  const counter = `${String(activeIndex + 1).padStart(2, '0')} / ${totalCards}`

  return (
    <div className="mw-app">
      <div className="mw-stage">
        <div className="mw-bg-glow" />
        <div className="mw-vignette" />

        <div className="mw-header">
          <div className="mw-title-area">
            <div className="mw-app-title">MuseWeave</div>
            <div className="mw-item-counter">{counter}</div>
          </div>
        </div>

        <LayoutPanel activeLayout={activeLayout} onChange={handleLayoutChange} />

        <div
          ref={stageRef}
          className={`mw-carousel-stage${detailOpen ? ' dimmed' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {artefacts.map((artefact, i) => {
            const offset = getCardOffset(i, activeIndex, totalCards)
            const effectiveOffset = offset - dragOffset
            const transform = getTransformForOffset(effectiveOffset, activeLayout)
            const absO = Math.abs(offset)
            const interactable = absO < 1.5 && !detailOpen && !isAnimating

            return (
              <CarouselCard
                key={`${artefact.title}-${i}`}
                artefact={{ ...artefact, index: i }}
                interactable={interactable}
                transitionEnabled={transitionEnabled}
                style={{
                  transform: `translate3d(calc(${transform.tx} * var(--sw)), calc(${transform.ty} * var(--sh)), 0) scale(${transform.scale}) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) rotateZ(${transform.rotateZ}deg)`,
                  zIndex: Math.max(0, transform.zIndex),
                  opacity: transform.opacity,
                  filter: `blur(${transform.blur}px)`
                }}
              />
            )
          })}
        </div>

        <NavigationHints
          hintOpacity={hintOpacity}
          disabled={detailOpen || isAnimating}
          onPrev={() => {
            goToPrevious()
            markInteraction()
          }}
          onNext={() => {
            goToNext()
            markInteraction()
          }}
        />

        <DetailOverlay item={detailItem} open={detailOpen} onClose={closeDetail} />
      </div>
    </div>
  )
}

export default MuseWeave
