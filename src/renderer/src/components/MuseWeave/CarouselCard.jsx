function CarouselCard({ artefact, style, transitionEnabled, interactable }) {
  return (
    <div
      className="mw-card"
      data-index={artefact.index}
      style={{
        ...style,
        pointerEvents: interactable ? 'auto' : 'none',
        transition:
          style?.transition ??
          (transitionEnabled
            ? 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1), filter 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none')
      }}
    >
      <div className="mw-card-image-container">
        <div className="mw-card-image" style={{ backgroundImage: `url('${artefact.img}')` }} />
      </div>
      <div className="mw-card-content">
        <h3 className="mw-card-title">{artefact.title}</h3>
        <p className="mw-card-meta">
          {artefact.era} • {artefact.origin}
        </p>
      </div>
    </div>
  )
}

export default CarouselCard
