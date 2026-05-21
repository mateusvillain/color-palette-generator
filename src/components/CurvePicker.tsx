import type { CurveType } from '../utils/color'

interface CurveOption {
  id: CurveType
  label: string
  // SVG path from (4,46) to (46,4) in a 50x50 viewBox
  path: string
}

const CURVES: CurveOption[] = [
  { id: 'linear',       label: 'Linear',    path: 'M 4 46 L 46 4' },
  { id: 'ease-in',      label: 'Ease In',   path: 'M 4 46 C 36 46 46 20 46 4' },
  { id: 'ease-out',     label: 'Ease Out',  path: 'M 4 46 C 4 30 14 4 46 4' },
  { id: 'ease-in-out',  label: 'In · Out',  path: 'M 4 46 C 22 46 28 4 46 4' },
  { id: 'sine',         label: 'Sine',      path: 'M 4 46 C 18 46 32 4 46 4' },
]

interface Props {
  value: CurveType
  onChange: (v: CurveType) => void
}

export function CurvePicker({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {CURVES.map(curve => {
        const active = value === curve.id
        return (
          <button
            key={curve.id}
            onClick={() => onChange(curve.id)}
            title={curve.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '7px 8px',
              borderRadius: 8,
              border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg)',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <svg
              viewBox="0 0 50 50"
              width={40}
              height={40}
              style={{ overflow: 'visible' }}
            >
              {/* Grid lines */}
              <line x1="4" y1="4" x2="4" y2="46" stroke="var(--border)" strokeWidth="0.8" />
              <line x1="4" y1="46" x2="46" y2="46" stroke="var(--border)" strokeWidth="0.8" />
              {/* Curve */}
              <path
                d={curve.path}
                fill="none"
                stroke={active ? 'var(--accent)' : 'var(--text-secondary)'}
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Endpoints */}
              <circle cx="4" cy="46" r="2.5" fill={active ? 'var(--accent)' : 'var(--text-muted)'} />
              <circle cx="46" cy="4" r="2.5" fill={active ? 'var(--accent)' : 'var(--text-muted)'} />
            </svg>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
            }}>
              {curve.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
