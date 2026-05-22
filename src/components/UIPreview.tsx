import type { ColorShade } from '../utils/color'

interface Props {
  shades: ColorShade[]
  name: string
}

// TODO: Implement contextual UI preview — shows palette tokens applied to
// real component examples (button, badge, card, input) so users can evaluate
// the palette in context before exporting.
//
// Shade mapping convention (Tailwind-style):
//   background   → shade[0]   (lightest, e.g. 50)
//   surface      → shade[1]   (e.g. 100)
//   border       → shade[2]   (e.g. 200)
//   muted text   → shade[3]   (e.g. 300 / 400)
//   default      → shade[4]   (mid, e.g. 500 / 600)
//   emphasis     → shade[5]   (e.g. 700)
//   text on fill → shade[6]   (darkest, e.g. 900 / 950)

export function UIPreview({ shades, name }: Props) {
  const mid   = shades[Math.floor(shades.length / 2)]
  const light = shades[0]
  const dark  = shades[shades.length - 1]

  const textOnMid = mid.contrastLight >= mid.contrastDark ? '#ffffff' : '#000000'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
        Preview
      </span>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Primary button */}
        <button style={{
          background: mid.hex, color: textOnMid, border: 'none',
          borderRadius: 6, padding: '7px 14px', fontWeight: 600, fontSize: 12,
          cursor: 'default', fontFamily: 'inherit',
        }}>
          {name}
        </button>

        {/* Outline button */}
        <button style={{
          background: 'transparent', color: mid.hex,
          border: `1.5px solid ${mid.hex}`,
          borderRadius: 6, padding: '6px 14px', fontWeight: 600, fontSize: 12,
          cursor: 'default', fontFamily: 'inherit',
        }}>
          {name}
        </button>

        {/* Badge */}
        <span style={{
          background: light.hex, color: dark.hex,
          borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600,
          fontFamily: 'inherit',
        }}>
          {name}
        </span>

        {/* Icon-style dot */}
        <div style={{ width: 28, height: 28, borderRadius: 8, background: mid.hex }} />
      </div>

      {/* Surface card sample */}
      <div style={{
        background: light.hex, borderRadius: 8, padding: '10px 12px',
        border: `1px solid ${shades[Math.min(2, shades.length - 1)].hex}`,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: dark.hex, marginBottom: 4 }}>
          Card title
        </div>
        <div style={{ fontSize: 11, color: shades[Math.floor(shades.length * 0.6)].hex }}>
          Surface background using the lightest shade.
        </div>
      </div>
    </div>
  )
}
