import { LAYOUT_PRESETS } from '../../data/artefacts'

function LayoutPanel({ activeLayout, onChange }) {
  return (
    <div className="mw-layout-panel">
      {/* {LAYOUT_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className={`mw-layout-btn${activeLayout === preset ? ' active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onChange(preset)
          }}
        >
          {preset}
        </button>
      ))} */}
    </div>
  )
}

export default LayoutPanel
