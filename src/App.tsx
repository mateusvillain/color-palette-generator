import { useState } from 'react'
import type { PaletteConfig, GlobalSettings } from './types'
import { createDefaultPalette, createDefaultSettings } from './types'
import { generatePalette, hexToColorLCH } from './utils/color'
import type { ColorShade, ColorMode } from './utils/color'
import { PaletteCard } from './components/PaletteCard'
import { Slider } from './components/Slider'
import { ColorInput } from './components/ColorInput'
import { CurvePicker } from './components/CurvePicker'

// ── Helpers ──────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'palette'
}

interface ExportEntry { name: string; shades: ColorShade[] }

function buildExportEntry(config: PaletteConfig, s: GlobalSettings): ExportEntry {
  return {
    name: config.name,
    shades: generatePalette({
      colorMode: s.colorMode,
      useBaseColor: config.useBaseColor,
      baseColor: config.baseColor,
      manualHue: config.manualHue,
      manualChroma: config.manualChroma,
      shadeCount: s.shadeCount,
      hueShift: s.hueShift,
      chromaScale: s.chromaScale,
      lightnessRange: [s.lightnessMin, s.lightnessMax],
      curve: s.curve,
      lightContrastColor: s.lightContrastColor,
      darkContrastColor: s.darkContrastColor,
    }),
  }
}

// ── Export Modal ──────────────────────────────────────────

function ExportModal({ entries, onClose }: { entries: ExportEntry[]; onClose: () => void }) {
  const [format, setFormat] = useState<'css' | 'json' | 'tailwind'>('css')

  const cssOutput = `:root {\n${entries.map(({ name, shades }) =>
    `  /* ${name} */\n` + shades.map(s => `  --${slugify(name)}-${s.index}: ${s.hex};`).join('\n')
  ).join('\n\n')}\n}`

  const jsonOutput = JSON.stringify(
    Object.fromEntries(entries.map(({ name, shades }) => [
      slugify(name),
      Object.fromEntries(shades.map(s => [s.index, s.hex])),
    ])),
    null, 2
  )

  const twOutput = JSON.stringify({
    colors: Object.fromEntries(entries.map(({ name, shades }) => [
      slugify(name),
      Object.fromEntries(shades.map(s => [s.index, s.hex])),
    ])),
  }, null, 2)

  const output = { css: cssOutput, json: jsonOutput, tailwind: twOutput }[format]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 520, maxWidth: '90vw', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Export</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {entries.map(e => e.name).join(', ')}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
          {(['css', 'json', 'tailwind'] as const).map(f => (
            <button key={f} onClick={() => setFormat(f)} style={{
              padding: '5px 13px', borderRadius: 7, border: '1px solid var(--border)',
              background: format === f ? 'var(--accent)' : 'var(--surface)',
              color: format === f ? '#fff' : 'var(--text)', fontWeight: 600,
              fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {f === 'tailwind' ? 'Tailwind' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <pre style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
          padding: 14, fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text)', margin: 0, maxHeight: 320, overflowY: 'auto', overflowX: 'auto',
        }}>
          {output}
        </pre>

        <button
          onClick={() => navigator.clipboard.writeText(output)}
          style={{ marginTop: 12, width: '100%', padding: 10, borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  )
}

// ── Sidebar Section ───────────────────────────────────────

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </section>
  )
}

// ── App ───────────────────────────────────────────────────

export default function App() {
  const [palettes, setPalettes] = useState<PaletteConfig[]>([createDefaultPalette('Primary')])
  const [settings, setSettings] = useState<GlobalSettings>(createDefaultSettings())
  const [darkMode, setDarkMode] = useState(false)
  const [exportEntries, setExportEntries] = useState<ExportEntry[] | null>(null)

  const patchSettings = (updates: Partial<GlobalSettings>) =>
    setSettings(s => ({ ...s, ...updates }))

  const addPalette = () => setPalettes(prev => [...prev, createDefaultPalette()])
  const removePalette = (id: string) => setPalettes(prev => prev.filter(p => p.id !== id))
  const updatePalette = (id: string, updates: Partial<PaletteConfig>) =>
    setPalettes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))

  const addNeutral = (source: PaletteConfig, tintRatio: number) => {
    const OKLCH_C_SCALE = 0.004
    const { h, c } = hexToColorLCH(source.baseColor, settings.colorMode as ColorMode)
    const cNorm = settings.colorMode === 'oklch'
      ? (c / OKLCH_C_SCALE) * tintRatio
      : c * tintRatio
    setPalettes(prev => [...prev, {
      id: crypto.randomUUID(),
      name: `${source.name} Neutral`,
      useBaseColor: false,
      baseColor: source.baseColor,
      manualHue: h,
      manualChroma: Math.min(cNorm, 12),
      isNeutral: true,
    }])
  }

  return (
    <div data-theme={darkMode ? 'dark' : 'light'} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 52, position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#3b82f6', '#8b5cf6', '#f43f5e'].map(c => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: 3, background: c }} />
            ))}
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: -0.3 }}>Palette Generator</span>
        </div>

        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <button
            onClick={addPalette}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 13px', cursor: 'pointer', fontSize: 12, color: 'var(--text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add Palette
          </button>
          <button
            onClick={() => setDarkMode(d => !d)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}
          >
            {darkMode ? '☀' : '☾'}
          </button>
          <button
            onClick={() => setExportEntries(palettes.map(p => buildExportEntry(p, settings)))}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}
          >
            Export All
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '272px 1fr', minHeight: 'calc(100vh - 52px)' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          padding: '22px 18px',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 26,
          position: 'sticky', top: 52, height: 'calc(100vh - 52px)', overflowY: 'auto',
        }}>
          <SidebarSection title="Color Model">
            <div style={{ display: 'flex', gap: 6 }}>
              {(['lch', 'oklch'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => patchSettings({ colorMode: mode })}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8,
                    border: `1.5px solid ${settings.colorMode === mode ? 'var(--accent)' : 'var(--border)'}`,
                    background: settings.colorMode === mode ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg)',
                    color: settings.colorMode === mode ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.5,
                    transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                  }}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {settings.colorMode === 'oklch'
                ? 'Perceptually uniform. Better hue consistency across the scale.'
                : 'CIE standard. Wider chroma range, compatible with CSS lch().'}
            </p>
          </SidebarSection>

          <SidebarSection title="Shades">
            <Slider label="Count" value={settings.shadeCount} min={3} max={20} onChange={v => patchSettings({ shadeCount: v })} />
            <Slider label="Min Lightness" value={settings.lightnessMin} min={2} max={40} unit="%" onChange={v => patchSettings({ lightnessMin: v })} />
            <Slider label="Max Lightness" value={settings.lightnessMax} min={60} max={98} unit="%" onChange={v => patchSettings({ lightnessMax: v })} />
          </SidebarSection>

          <SidebarSection title="Adjustments">
            <Slider label="Hue Shift" value={settings.hueShift} min={0} max={40} unit="°" onChange={v => patchSettings({ hueShift: v })} />
            <Slider label="Chroma Scale" value={settings.chromaScale} min={0.2} max={2} step={0.05} decimals={2} onChange={v => patchSettings({ chromaScale: v })} />
          </SidebarSection>

          <SidebarSection title="Lightness Curve">
            <CurvePicker value={settings.curve} onChange={v => patchSettings({ curve: v })} />
          </SidebarSection>

          <SidebarSection title="Contrast Colors">
            <ColorInput label="Light" value={settings.lightContrastColor} onChange={v => patchSettings({ lightContrastColor: v })} />
            <ColorInput label="Dark" value={settings.darkContrastColor} onChange={v => patchSettings({ darkContrastColor: v })} />
          </SidebarSection>

          <SidebarSection title="WCAG Levels">
            {[
              { level: 'AAA',      ratio: '≥ 7 : 1',   color: '#4ade80' },
              { level: 'AA',       ratio: '≥ 4.5 : 1', color: '#60a5fa' },
              { level: 'AA Large', ratio: '≥ 3 : 1',   color: '#fbbf24' },
              { level: 'Fail',     ratio: '< 3 : 1',   color: '#f87171' },
            ].map(({ level, ratio, color }) => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{level}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>{ratio}</span>
              </div>
            ))}
          </SidebarSection>
        </aside>

        {/* ── Main ── */}
        <main style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {palettes.map(palette => (
            <PaletteCard
              key={palette.id}
              config={palette}
              globalSettings={settings}
              onChange={updates => updatePalette(palette.id, updates)}
              onDelete={() => removePalette(palette.id)}
              onExport={() => setExportEntries([buildExportEntry(palette, settings)])}
              onAddNeutral={(tint) => addNeutral(palette, tint)}
              canDelete={palettes.length > 1}
            />
          ))}

          <button
            onClick={addPalette}
            style={{
              background: 'none', border: '2px dashed var(--border)', borderRadius: 12,
              padding: 16, cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, width: '100%', transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            + Add Palette
          </button>
        </main>
      </div>

      {exportEntries && <ExportModal entries={exportEntries} onClose={() => setExportEntries(null)} />}
    </div>
  )
}
