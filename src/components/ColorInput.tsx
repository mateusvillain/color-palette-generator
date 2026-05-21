interface Props {
  label: string
  value: string
  onChange: (v: string) => void
}

export function ColorInput({ label, value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 40,
            height: 36,
            padding: 2,
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            background: 'none',
          }}
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={e => {
            const v = e.target.value
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
          }}
          style={{
            flex: 1,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            fontWeight: 500,
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--surface)',
            color: 'var(--text)',
            outline: 'none',
          }}
          maxLength={7}
        />
      </div>
    </div>
  )
}
