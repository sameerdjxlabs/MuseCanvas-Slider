function DetailOverlay({ item, open, onClose }) {
  if (!item) return null

  return (
    <div
      className={`mw-detail-overlay${open ? ' ' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mw-detail-panel">
        <button className="mw-detail-close" aria-label="Close" onClick={onClose}>
          &times;
        </button>
        <div className="mw-detail-image" style={{ backgroundImage: `url('${item.img}')` }} />
        <div className="mw-detail-content-wrap">
          <h2 className="mw-detail-title">{item.title}</h2>
          <div className="mw-detail-meta">
            {item.era} • {item.origin}
          </div>
          <div className="mw-detail-desc">{item.desc}</div>
        </div>
      </div>
    </div>
  )
}

export default DetailOverlay
