interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  decimals?: number
  onChange: (v: number) => void
}

export function Slider({ label, value, min, max, step = 1, unit = '', decimals = 0, onChange }: Props) {
  const display = decimals > 0 ? value.toFixed(decimals) : String(value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
          {label}
        </label>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
          {display}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
    </div>
  )
}
