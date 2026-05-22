import { useMemo, useState } from 'react'
import type { PaletteConfig, GlobalSettings } from '../types'
import { generatePalette, wcagLevel, relativeLuminance } from '../utils/color'
import type { ColorShade } from '../utils/color'
import { simulateCVD } from '../utils/colorblind'
import type { ColorblindMode } from '../utils/colorblind'
import { Slider } from './Slider'

// Flag adjacent shade pairs whose simulated luminance difference is negligible
function hasPoorCvdContrast(hexA: string, hexB: string): boolean {
  const la = relativeLuminance(hexA)
  const lb = relativeLuminance(hexB)
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  return ratio < 1.5
}

const PRESETS = ['#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#64748b']

const LEVEL_COLOR: Record<string, string> = {
  AAA: '#4ade80',
  AA: '#60a5fa',
  'AA Large': '#fbbf24',
  Fail: '#f87171',
}

function ShadeCell({ shade, lightContrastColor, darkContrastColor, displayHex }: {
  shade: ColorShade
  lightContrastColor: string
  darkContrastColor: string
  displayHex?: string
}) {
  const bg = displayHex ?? shade.hex
  const textColor = shade.contrastLight >= shade.contrastDark ? lightContrastColor : darkContrastColor

  return (
    <div
      onClick={() => navigator.clipboard.writeText(shade.hex)}
      title={`${shade.index} · ${shade.hex.toUpperCase()}`}
      style={{
        flex: 1, background: bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 3px', cursor: 'pointer', transition: 'flex 0.15s',
        minWidth: 0, overflow: 'hidden',
      }}
      onMouseEnter={e => (e.currentTarget.style.flex = '1.6')}
      onMouseLeave={e => (e.currentTarget.style.flex = '1')}
    >
      <span style={{ color: textColor, fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', opacity: 0.7, letterSpacing: 0.3 }}>
        {shade.index}
      </span>
      <span style={{ color: textColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', opacity: 0.85, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', padding: '0 4px' }}>
        {shade.hex.toUpperCase()}
      </span>
      {/* Contrast badges — horizontal */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflow: 'hidden', padding: '0 4px' }}>
        {[
          { cr: shade.contrastLight, bg: lightContrastColor },
          { cr: shade.contrastDark, bg: darkContrastColor },
        ].map(({ cr, bg }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: bg, border: '0.5px solid rgba(128,128,128,0.35)', flexShrink: 0 }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: LEVEL_COLOR[wcagLevel(cr)], flexShrink: 0 }} />
            <span style={{ color: textColor, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', opacity: 0.9, whiteSpace: 'nowrap' }}>
              {cr.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 30, height: 17, borderRadius: 99, position: 'relative', flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--border)',
        transition: 'background 0.2s', cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute', top: 1.5, left: checked ? 14 : 1.5, width: 14, height: 14,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </div>
  )
}

interface Props {
  config: PaletteConfig
  globalSettings: GlobalSettings
  onChange: (updates: Partial<PaletteConfig>) => void
  onDelete: () => void
  onExport: () => void
  canDelete: boolean
}

const CVD_LABELS: { mode: ColorblindMode; label: string }[] = [
  { mode: 'normal',      label: 'Normal' },
  { mode: 'deuteranopia', label: 'Deut' },
  { mode: 'protanopia',   label: 'Prot' },
  { mode: 'tritanopia',   label: 'Trit' },
]

export function PaletteCard({ config, globalSettings, onChange, onDelete, onExport, canDelete }: Props) {
  const [cvdMode, setCvdMode] = useState<ColorblindMode>('normal')

  const palette = useMemo(() => generatePalette({
    colorMode: globalSettings.colorMode,
    useBaseColor: config.useBaseColor,
    baseColor: config.baseColor,
    manualHue: config.manualHue,
    manualChroma: config.manualChroma,
    shadeCount: globalSettings.shadeCount,
    hueShift: globalSettings.hueShift,
    chromaScale: globalSettings.chromaScale,
    lightnessRange: [globalSettings.lightnessMin, globalSettings.lightnessMax],
    curve: globalSettings.curve,
    lightContrastColor: globalSettings.lightContrastColor,
    darkContrastColor: globalSettings.darkContrastColor,
  }), [config, globalSettings])

  const midShade = palette[Math.floor(palette.length / 2)]

  const previewSwatches = useMemo(() => {
    if (palette.length <= 7) return palette
    return [0, 1, 2, 3, 4, 5, 6].map(i => palette[Math.round(i * (palette.length - 1) / 6)])
  }, [palette])

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      borderTop: `3px solid ${midShade?.hex ?? 'var(--accent)'}`,
    }}>
      {/* ── Card Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {previewSwatches.map(s => (
            <div key={s.index} style={{ width: 13, height: 20, borderRadius: 3, background: s.hex, border: '1px solid rgba(0,0,0,0.07)' }} />
          ))}
        </div>

        <input
          value={config.name}
          onChange={e => onChange({ name: e.target.value })}
          style={{
            fontWeight: 700, fontSize: 13, background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontFamily: 'inherit', width: 130, padding: '2px 5px', borderRadius: 5,
          }}
          onFocus={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
          onBlur={e => (e.currentTarget.style.background = 'none')}
        />

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-raised)', borderRadius: 6, padding: 2 }}>
          {CVD_LABELS.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setCvdMode(mode)}
              style={{
                background: cvdMode === mode ? 'var(--surface)' : 'none',
                border: 'none', borderRadius: 5, padding: '3px 7px', cursor: 'pointer',
                fontSize: 10, fontWeight: 600,
                color: cvdMode === mode ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: cvdMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'background 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={onExport} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          Export
        </button>
        {canDelete && (
          <button onClick={onDelete} title="Remove" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1 }}>
            ×
          </button>
        )}
      </div>

      {/* ── Color Row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
        background: 'var(--surface-raised)',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Toggle checked={config.useBaseColor} onChange={v => onChange({ useBaseColor: v })} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, whiteSpace: 'nowrap' }}>
            Base color
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

        {config.useBaseColor ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
            <input
              type="color"
              value={config.baseColor}
              onChange={e => onChange({ baseColor: e.target.value })}
              style={{ width: 30, height: 26, padding: 2, border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', background: 'none', flexShrink: 0 }}
            />
            <input
              type="text"
              value={config.baseColor.toUpperCase()}
              onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange({ baseColor: e.target.value }) }}
              maxLength={7}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500, width: 76, padding: '4px 7px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => onChange({ baseColor: c })}
                  style={{ width: 18, height: 18, borderRadius: 4, background: c, cursor: 'pointer', border: config.baseColor === c ? '2px solid var(--text)' : '2px solid transparent', transition: 'transform 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 200 }}>
            <div style={{ flex: 1 }}>
              <Slider label="Hue" value={config.manualHue} min={0} max={359} unit="°" onChange={v => onChange({ manualHue: v })} />
            </div>
            <div style={{ flex: 1 }}>
              <Slider label="Chroma" value={config.manualChroma} min={0} max={100} onChange={v => onChange({ manualChroma: v })} />
            </div>
          </div>
        )}
      </div>

      {/* ── Strip ── */}
      <div style={{ display: 'flex', height: 96 }}>
        {palette.map(shade => (
          <ShadeCell
            key={shade.index}
            shade={shade}
            lightContrastColor={globalSettings.lightContrastColor}
            darkContrastColor={globalSettings.darkContrastColor}
            displayHex={cvdMode !== 'normal' ? simulateCVD(shade.hex, cvdMode) : undefined}
          />
        ))}
      </div>

      {/* ── CVD comparison strip ── */}
      {cvdMode !== 'normal' && (() => {
        const simHexes = palette.map(s => simulateCVD(s.hex, cvdMode))
        return (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <div style={{ padding: '4px 14px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Original
              </span>
            </div>
            <div style={{ display: 'flex', height: 28 }}>
              {palette.map((shade, i) => {
                const poor = i < palette.length - 1 && hasPoorCvdContrast(simHexes[i], simHexes[i + 1])
                return (
                  <div key={shade.index} style={{ flex: 1, background: shade.hex, position: 'relative' }}>
                    {poor && (
                      <div title="Low contrast with next shade under this CVD mode" style={{
                        position: 'absolute', top: 4, right: 2,
                        width: 6, height: 6, borderRadius: '50%', background: '#f87171',
                        border: '1px solid rgba(255,255,255,0.6)',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
