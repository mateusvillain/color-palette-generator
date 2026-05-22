import { useState } from 'react'
import type { ColorShade } from '../utils/color'

interface Props {
  shades: ColorShade[]
  name: string
}

function pick(shades: ColorShade[], ratio: number): ColorShade {
  return shades[Math.round(Math.max(0, Math.min(1, ratio)) * (shades.length - 1))]
}

export function UIPreview({ shades, name }: Props) {
  const [darkSurface, setDarkSurface] = useState(false)

  const mid      = pick(shades, 0.5)
  const light    = shades[0]
  const dark     = shades[shades.length - 1]
  const border   = pick(shades, 0.2)
  const muted    = pick(shades, 0.55)
  const emphasis = pick(shades, 0.75)

  const textOnMid = mid.contrastLight >= mid.contrastDark ? '#ffffff' : '#000000'

  const surface       = darkSurface ? emphasis.hex : light.hex
  const surfaceText   = darkSurface ? light.hex    : dark.hex
  const surfaceMuted  = darkSurface ? border.hex   : muted.hex
  const surfaceBorder = darkSurface ? muted.hex    : border.hex

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
          Preview
        </span>
        <div style={{ display: 'flex', gap: 1, background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
          {(['Light', 'Dark'] as const).map(mode => {
            const active = mode === 'Dark' ? darkSurface : !darkSurface
            return (
              <button
                key={mode}
                onClick={() => setDarkSurface(mode === 'Dark')}
                style={{
                  padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: active ? 'var(--bg)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 10, fontFamily: 'inherit',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  transition: 'background 0.15s',
                }}
              >
                {mode}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Component canvas ── */}
      <div style={{
        background: surface, border: `1px solid ${surfaceBorder}`,
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'background 0.2s',
      }}>

        {/* Buttons + badge + link */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            background: mid.hex, color: textOnMid, border: 'none',
            borderRadius: 6, padding: '7px 14px', fontWeight: 600, fontSize: 12,
            cursor: 'default', fontFamily: 'inherit',
          }}>
            {name}
          </button>

          <button style={{
            background: 'transparent', color: mid.hex,
            border: `1.5px solid ${mid.hex}`,
            borderRadius: 6, padding: '6px 14px', fontWeight: 600, fontSize: 12,
            cursor: 'default', fontFamily: 'inherit',
          }}>
            Outline
          </button>

          <span style={{
            background: darkSurface ? dark.hex : light.hex,
            color: mid.hex,
            border: `1px solid ${border.hex}`,
            borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600,
            fontFamily: 'inherit',
          }}>
            Badge
          </span>

          <span style={{ color: mid.hex, fontSize: 12, fontWeight: 500, textDecoration: 'underline', fontFamily: 'inherit' }}>
            Link
          </span>
        </div>

        {/* Input + submit */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            readOnly
            value="Search…"
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 6,
              border: `1px solid ${surfaceBorder}`,
              background: darkSurface ? dark.hex : 'var(--bg)',
              color: surfaceMuted,
              fontSize: 12, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <button style={{
            background: mid.hex, color: textOnMid, border: 'none',
            borderRadius: 6, padding: '6px 14px', fontWeight: 600, fontSize: 12,
            cursor: 'default', fontFamily: 'inherit',
          }}>
            Go
          </button>
        </div>

        {/* Surface card */}
        <div style={{
          background: darkSurface ? dark.hex : 'var(--bg)',
          borderRadius: 8, padding: '10px 12px',
          border: `1px solid ${surfaceBorder}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: surfaceText, marginBottom: 4 }}>
            Card title
          </div>
          <div style={{ fontSize: 11, color: surfaceMuted }}>
            Surface background using palette tokens.
          </div>
        </div>

        {/* Alert */}
        <div style={{
          background: darkSurface ? dark.hex : light.hex,
          border: `1px solid ${border.hex}`,
          borderLeft: `3px solid ${mid.hex}`,
          borderRadius: 6, padding: '8px 12px',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: mid.hex, flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: surfaceText }}>Info</div>
            <div style={{ fontSize: 10, color: surfaceMuted, marginTop: 2 }}>
              Informational message using this palette.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
