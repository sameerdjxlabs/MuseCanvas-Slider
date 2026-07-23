function CarouselCard({ artefact, style, transitionEnabled, interactable, isActive }) {
  return (
    <div
      className={`mw-card${isActive ? ' is-active' : ''}`}
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
      <div className="mw-card-pattern" aria-hidden="true" />
      <div className="mw-card-content">
        <div className="mw-card-title-row">
          <h3 className="mw-card-title">{artefact.title}</h3>
          <p className="mw-card-meta">{artefact.era}</p>
        </div>
        <span className="mw-card-pill">Details of extraction</span>
        <p className="mw-card-desc">{artefact.desc}</p>
        <div className="mw-card-brand">
          <span className="mw-card-brand-powered">powered by</span>
          <img src="/djlogo.png" alt="DJ labs" className="mw-card-brand-dj" />
        </div>
      </div>
    </div>
  )
}

export default CarouselCard
