function NavigationHints({ hintOpacity, onPrev, onNext, disabled }) {
  return (
    <div className="mw-navigation-hints">
      <button
        type="button"
        className="mw-nav-arrow"
        aria-label="Previous"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onPrev()
        }}
      >
        &#8592;
      </button>
      <div className="mw-hint-text" style={{ opacity: hintOpacity }}>
        Swipe to explore
      </div>
      <button
        type="button"
        className="mw-nav-arrow"
        aria-label="Next"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onNext()
        }}
      >
        &#8594;
      </button>
    </div>
  )
}

export default NavigationHints
