import { useCallback, useEffect, useState } from 'react'
import type { GlobalSettings, PaletteConfig } from '../types'
import { createDefaultSettings, createDefaultPalette } from '../types'

const CURRENT_VERSION = 1

interface AppState {
  settings: GlobalSettings
  palettes: PaletteConfig[]
}

interface SerializedState {
  v: number
  settings: GlobalSettings
  palettes: PaletteConfig[]
}

function encode(state: AppState): string {
  const payload: SerializedState = { v: CURRENT_VERSION, ...state }
  return btoa(JSON.stringify(payload))
}

function decode(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(atob(raw)) as Partial<SerializedState>

    // Version guard: unknown future versions are discarded gracefully
    if (parsed.v !== undefined && parsed.v > CURRENT_VERSION) return null

    // Required fields validation
    if (!parsed.settings || !Array.isArray(parsed.palettes) || parsed.palettes.length === 0) return null

    // Field-level migration: fill in any settings keys added after the URL was created
    const defaults = createDefaultSettings()
    const migratedSettings = { ...defaults, ...parsed.settings } as GlobalSettings

    // Ensure each palette has all required fields
    const migratedPalettes = parsed.palettes
      .filter((p): p is PaletteConfig => !!p && typeof p.id === 'string')
      .map(p => ({
        id: p.id,
        name: p.name ?? 'Palette',
        useBaseColor: p.useBaseColor ?? true,
        baseColor: p.baseColor ?? '#3b82f6',
        manualHue: p.manualHue ?? 220,
        manualChroma: p.manualChroma ?? 60,
      }))

    if (migratedPalettes.length === 0) return null

    return { settings: migratedSettings, palettes: migratedPalettes }
  } catch {
    return null
  }
}

function readHash(): AppState | null {
  const hash = window.location.hash.slice(1)
  return hash ? decode(hash) : null
}

function writeHash(state: AppState): void {
  window.history.replaceState(null, '', `#${encode(state)}`)
}

export function useUrlState() {
  const [state, setState] = useState<AppState>(() => {
    return readHash() ?? {
      settings: createDefaultSettings(),
      palettes: [createDefaultPalette('Primary')],
    }
  })

  // Sync state → URL on every change
  useEffect(() => {
    writeHash(state)
  }, [state])

  // Sync URL → state when navigating back/forward
  useEffect(() => {
    const onPopState = () => {
      const parsed = readHash()
      if (parsed) setState(parsed)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setSettings = useCallback((updater: (s: GlobalSettings) => GlobalSettings) =>
    setState(prev => ({ ...prev, settings: updater(prev.settings) })), [])

  const setPalettes = useCallback((updater: (p: PaletteConfig[]) => PaletteConfig[]) =>
    setState(prev => ({ ...prev, palettes: updater(prev.palettes) })), [])

  return { ...state, setSettings, setPalettes }
}
