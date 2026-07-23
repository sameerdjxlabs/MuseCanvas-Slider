export const layouts = {
  arc(effectiveOffset, absO, sign) {
    let tx
    if (absO <= 1) tx = sign * absO * 28
    else if (absO <= 2) tx = sign * (28 + (absO - 1) * 18)
    else tx = sign * (46 + (absO - 2) * 10)

    let scale
    if (absO <= 1) scale = 1 - absO * 0.22
    else if (absO <= 2) scale = 0.78 - (absO - 1) * 0.2
    else scale = Math.max(0.4, 0.58 - (absO - 2) * 0.18)

    const rotateY = sign * Math.min(absO, 2) * -35
    return { tx, ty: 0, scale, rotateY, rotateX: 0, rotateZ: 0 }
  },

  spiral(effectiveOffset, absO, sign) {
    const tx = sign * absO * 18
    const ty = effectiveOffset * -15
    const scale = Math.max(0.3, 1 - absO * 0.15)
    const rotateY = sign * Math.min(absO, 2) * -20
    return { tx, ty, scale, rotateY, rotateX: 0, rotateZ: 0 }
  },

  fan(effectiveOffset, absO, sign) {
    const tx = sign * absO * 25
    const ty = absO * 8
    const scale = Math.max(0.3, 1 - absO * 0.15)
    const rotateZ = effectiveOffset * 10
    return { tx, ty, scale, rotateY: 0, rotateX: 0, rotateZ }
  },

  gallery(effectiveOffset, absO, sign) {
    const tx = sign * (absO <= 0.2 ? absO * 30 : 25 + absO * 8)
    const scale = Math.max(0.4, 1 - absO * 0.15)
    const rotateY = sign * Math.min(absO, 1) * 75
    return { tx, ty: 0, scale, rotateY, rotateX: 0, rotateZ: 0 }
  },

  vortex(effectiveOffset, absO, sign) {
    const tx = Math.sin(effectiveOffset) * 25
    const ty = Math.cos(effectiveOffset) * 25 - 25
    const scale = Math.max(0.1, 1 - absO * 0.2)
    const rotateZ = effectiveOffset * 15
    return { tx, ty, scale, rotateY: 0, rotateX: 0, rotateZ }
  },

  deck(effectiveOffset, absO, sign) {
    const tx = effectiveOffset * 15
    const ty = absO * 5
    const scale = Math.max(0.3, 1 - absO * 0.15)
    const rotateX = 15
    const rotateY = sign * 5
    return { tx, ty, scale, rotateY, rotateX, rotateZ: 0 }
  },

  wave(effectiveOffset, absO, sign) {
    const tx = effectiveOffset * 22
    const ty = Math.sin(effectiveOffset * 1.5) * 12
    const scale = Math.max(0.3, 1 - absO * 0.15)
    const rotateY = effectiveOffset * 10
    return { tx, ty, scale, rotateY, rotateX: 0, rotateZ: 0 }
  },

  tunnel(effectiveOffset, absO, sign) {
    const tx = sign * Math.pow(absO, 1.2) * 15
    const ty = 0
    const scale = Math.max(0.1, Math.pow(0.7, absO))
    const rotateZ = effectiveOffset * 4
    return { tx, ty, scale, rotateY: 0, rotateX: 0, rotateZ }
  }
}

export function getCardOffset(index, activeIndex, total) {
  let offset = (index - activeIndex) % total
  if (offset > total / 2) offset -= total
  if (offset < -total / 2) offset += total
  return offset
}

export function getTransformForOffset(effectiveOffset, layoutName) {
  const absO = Math.abs(effectiveOffset)
  const sign = Math.sign(effectiveOffset)
  const layoutFn = layouts[layoutName] || layouts.arc
  const { tx, ty, scale, rotateY, rotateX, rotateZ } = layoutFn(effectiveOffset, absO, sign)

  return {
    tx,
    ty,
    scale,
    rotateY,
    rotateX,
    rotateZ,
    opacity: Math.max(0, 1 - Math.max(0, absO - 0.5) * 0.5),
    blur: Math.max(0, (absO - 0.2) * 3),
    zIndex: 30 - Math.floor(absO * 10)
  }
}
