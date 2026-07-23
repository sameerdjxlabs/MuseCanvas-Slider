import { EASING_PRESETS, DEFAULT_SETTINGS } from '../../data/layouts'
import { LAYOUT_PRESETS } from '../../data/artefacts'

function SliderRow({ label, value, min, max, step, unit, onChange }) {
  return (
    <label className="mw-ctrl-row">
      <div className="mw-ctrl-row-head">
        <span>{label}</span>
        <span className="mw-ctrl-value">
          {typeof value === 'number' ? (Number.isInteger(step) ? value : value.toFixed(2)) : value}
          {unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="mw-ctrl-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

function ControlsMenu({ open, settings, onChange, onReset, onClose }) {
  if (!open) return null

  const set = (key, value) => onChange({ ...settings, [key]: value })

  return (
    <div className="mw-controls-overlay" onClick={onClose}>
      <aside
        className="mw-controls-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Slider controls"
      >
        <div className="mw-controls-header">
          <div>
            <h2>Slider Controls</h2>
            <p>Double-tap Space to toggle</p>
          </div>
          <button type="button" className="mw-controls-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="mw-controls-body">
          <section className="mw-controls-section">
            <h3>Layout</h3>
            <div className="mw-ctrl-chips">
              {LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`mw-ctrl-chip${settings.layout === preset ? ' active' : ''}`}
                  onClick={() => set('layout', preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <SliderRow
              label="Slide Gap"
              value={settings.gap}
              min={0.4}
              max={2}
              step={0.05}
              unit="×"
              onChange={(v) => set('gap', v)}
            />
            <SliderRow
              label="Position X"
              value={settings.positionX}
              min={-40}
              max={40}
              step={1}
              onChange={(v) => set('positionX', v)}
            />
            <SliderRow
              label="Position Y"
              value={settings.positionY}
              min={-30}
              max={30}
              step={1}
              onChange={(v) => set('positionY', v)}
            />
            <SliderRow
              label="Rotate Intensity"
              value={settings.rotateIntensity}
              min={0}
              max={2}
              step={0.05}
              unit="×"
              onChange={(v) => set('rotateIntensity', v)}
            />
            <SliderRow
              label="Scale Falloff"
              value={settings.scaleFalloff}
              min={0.2}
              max={2}
              step={0.05}
              unit="×"
              onChange={(v) => set('scaleFalloff', v)}
            />
            <SliderRow
              label="Min Scale"
              value={settings.minScale}
              min={0.1}
              max={0.8}
              step={0.05}
              onChange={(v) => set('minScale', v)}
            />
          </section>

          <section className="mw-controls-section">
            <h3>Motion</h3>
            <label className="mw-ctrl-row">
              <div className="mw-ctrl-row-head">
                <span>Easing</span>
              </div>
              <select
                className="mw-ctrl-select"
                value={settings.easing}
                onChange={(e) => set('easing', e.target.value)}
              >
                {Object.entries(EASING_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <SliderRow
              label="Snap Duration"
              value={settings.snapDuration}
              min={120}
              max={1200}
              step={10}
              unit="ms"
              onChange={(v) => set('snapDuration', v)}
            />
            <SliderRow
              label="Drag Sensitivity"
              value={settings.dragSensitivity}
              min={0.1}
              max={0.6}
              step={0.01}
              onChange={(v) => set('dragSensitivity', v)}
            />
            <SliderRow
              label="Drag Threshold"
              value={settings.dragThreshold}
              min={10}
              max={100}
              step={1}
              unit="px"
              onChange={(v) => set('dragThreshold', v)}
            />
            <SliderRow
              label="Idle Reset"
              value={settings.idleTimeout}
              min={5}
              max={120}
              step={1}
              unit="s"
              onChange={(v) => set('idleTimeout', v)}
            />
          </section>

          <section className="mw-controls-section">
            <h3>Look</h3>
            <SliderRow
              label="Card Width"
              value={settings.cardWidth}
              min={14}
              max={36}
              step={1}
              onChange={(v) => set('cardWidth', v)}
            />
            <SliderRow
              label="Card Height"
              value={settings.cardHeight}
              min={20}
              max={48}
              step={1}
              onChange={(v) => set('cardHeight', v)}
            />
            <SliderRow
              label="Perspective"
              value={settings.perspective}
              min={400}
              max={2400}
              step={50}
              unit="px"
              onChange={(v) => set('perspective', v)}
            />
            <SliderRow
              label="Blur Amount"
              value={settings.blurAmount}
              min={0}
              max={2.5}
              step={0.05}
              unit="×"
              onChange={(v) => set('blurAmount', v)}
            />
            <SliderRow
              label="Opacity Falloff"
              value={settings.opacityFalloff}
              min={0}
              max={2}
              step={0.05}
              unit="×"
              onChange={(v) => set('opacityFalloff', v)}
            />
          </section>

          <section className="mw-controls-section">
            <h3>UI</h3>
            <ToggleRow
              label="Show Swipe Hints"
              checked={settings.showHints}
              onChange={(v) => set('showHints', v)}
            />
            <ToggleRow
              label="Show Layout Buttons"
              checked={settings.showLayoutPanel}
              onChange={(v) => set('showLayoutPanel', v)}
            />
            <ToggleRow
              label="Show Item Counter"
              checked={settings.showCounter}
              onChange={(v) => set('showCounter', v)}
            />
          </section>
        </div>

        <div className="mw-controls-footer">
          <button type="button" className="mw-ctrl-reset" onClick={onReset}>
            Reset defaults
          </button>
          <button type="button" className="mw-ctrl-done" onClick={onClose}>
            Done
          </button>
        </div>
      </aside>
    </div>
  )
}

export { DEFAULT_SETTINGS }
export default ControlsMenu
