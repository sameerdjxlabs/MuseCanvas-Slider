export const EASING_PRESETS = {
  smooth: { label: 'Smooth', value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  snappy: { label: 'Snappy', value: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  soft: { label: 'Soft', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  bounce: { label: 'Bounce', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  linear: { label: 'Linear', value: 'linear' }
}

export const DEFAULT_SETTINGS = {
  layout: 'arc',
  gap: 1,
  positionX: 0,
  positionY: 0,
  rotateIntensity: 1,
  scaleFalloff: 1,
  minScale: 0.3,
  cardWidth: 24,
  cardHeight: 36,
  perspective: 1200,
  blurAmount: 1,
  opacityFalloff: 1,
  snapDuration: 350,
  easing: 'smooth',
  dragSensitivity: 0.25,
  dragThreshold: 40,
  idleTimeout: 25,
  showHints: true,
  showLayoutPanel: true,
  showCounter: true
}

export const layouts = {
  arc(effectiveOffset, absO, sign, s) {
    const g = s.gap
    let tx
    if (absO <= 1) tx = sign * absO * 28 * g
    else if (absO <= 2) tx = sign * (28 + (absO - 1) * 18) * g
    else tx = sign * (46 + (absO - 2) * 10) * g

    let scale
    if (absO <= 1) scale = 1 - absO * 0.22 * s.scaleFalloff
    else if (absO <= 2) scale = 0.78 - (absO - 1) * 0.2 * s.scaleFalloff
    else scale = Math.max(s.minScale, 0.58 - (absO - 2) * 0.18 * s.scaleFalloff)

    const rotateY = sign * Math.min(absO, 2) * -35 * s.rotateIntensity
    return { tx, ty: 0, scale, rotateY, rotateX: 0, rotateZ: 0 }
  },

  spiral(effectiveOffset, absO, sign, s) {
    const tx = sign * absO * 18 * s.gap
    const ty = effectiveOffset * -15 * s.gap
    const scale = Math.max(s.minScale, 1 - absO * 0.15 * s.scaleFalloff)
    const rotateY = sign * Math.min(absO, 2) * -20 * s.rotateIntensity
    return { tx, ty, scale, rotateY, rotateX: 0, rotateZ: 0 }
  },

  fan(effectiveOffset, absO, sign, s) {
    const tx = sign * absO * 25 * s.gap
    const ty = absO * 8 * s.gap
    const scale = Math.max(s.minScale, 1 - absO * 0.15 * s.scaleFalloff)
    const rotateZ = effectiveOffset * 10 * s.rotateIntensity
    return { tx, ty, scale, rotateY: 0, rotateX: 0, rotateZ }
  },

  gallery(effectiveOffset, absO, sign, s) {
    const tx = sign * (absO <= 0.2 ? absO * 30 : 25 + absO * 8) * s.gap
    const scale = Math.max(s.minScale, 1 - absO * 0.15 * s.scaleFalloff)
    const rotateY = sign * Math.min(absO, 1) * 75 * s.rotateIntensity
    return { tx, ty: 0, scale, rotateY, rotateX: 0, rotateZ: 0 }
  },

  vortex(effectiveOffset, absO, sign, s) {
    const tx = Math.sin(effectiveOffset) * 25 * s.gap
    const ty = (Math.cos(effectiveOffset) * 25 - 25) * s.gap
    const scale = Math.max(0.1, 1 - absO * 0.2 * s.scaleFalloff)
    const rotateZ = effectiveOffset * 15 * s.rotateIntensity
    return { tx, ty, scale, rotateY: 0, rotateX: 0, rotateZ }
  },

  deck(effectiveOffset, absO, sign, s) {
    const tx = effectiveOffset * 15 * s.gap
    const ty = absO * 5 * s.gap
    const scale = Math.max(s.minScale, 1 - absO * 0.15 * s.scaleFalloff)
    const rotateX = 15 * s.rotateIntensity
    const rotateY = sign * 5 * s.rotateIntensity
    return { tx, ty, scale, rotateY, rotateX, rotateZ: 0 }
  },

  wave(effectiveOffset, absO, sign, s) {
    const tx = effectiveOffset * 22 * s.gap
    const ty = Math.sin(effectiveOffset * 1.5) * 12 * s.gap
    const scale = Math.max(s.minScale, 1 - absO * 0.15 * s.scaleFalloff)
    const rotateY = effectiveOffset * 10 * s.rotateIntensity
    return { tx, ty, scale, rotateY, rotateX: 0, rotateZ: 0 }
  },

  tunnel(effectiveOffset, absO, sign, s) {
    const tx = sign * Math.pow(absO, 1.2) * 15 * s.gap
    const ty = 0
    const scale = Math.max(0.1, Math.pow(Math.max(0.5, 0.7 / s.scaleFalloff), absO))
    const rotateZ = effectiveOffset * 4 * s.rotateIntensity
    return { tx, ty, scale, rotateY: 0, rotateX: 0, rotateZ }
  }
}

export function getCardOffset(index, activeIndex, total) {
  let offset = (index - activeIndex) % total
  if (offset > total / 2) offset -= total
  if (offset < -total / 2) offset += total
  return offset
}

export function getTransformForOffset(effectiveOffset, layoutName, settings = DEFAULT_SETTINGS) {
  const absO = Math.abs(effectiveOffset)
  const sign = Math.sign(effectiveOffset)
  const layoutFn = layouts[layoutName] || layouts.arc
  const { tx, ty, scale, rotateY, rotateX, rotateZ } = layoutFn(
    effectiveOffset,
    absO,
    sign,
    settings
  )

  return {
    tx: tx + settings.positionX,
    ty: ty + settings.positionY,
    scale,
    rotateY,
    rotateX,
    rotateZ,
    opacity: Math.max(0, 1 - Math.max(0, absO - 0.5) * 0.5 * settings.opacityFalloff),
    blur: Math.max(0, (absO - 0.2) * 3 * settings.blurAmount),
    zIndex: 30 - Math.floor(absO * 10)
  }
}

export function getEasingCss(easingKey) {
  return EASING_PRESETS[easingKey]?.value || EASING_PRESETS.smooth.value
}
