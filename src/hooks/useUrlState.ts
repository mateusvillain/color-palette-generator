import { useCallback, useEffect, useState } from 'react'
import type { GlobalSettings, PaletteConfig } from '../types'
import { createDefaultSettings, createDefaultPalette } from '../types'

interface AppState {
  settings: GlobalSettings
  palettes: PaletteConfig[]
}

function encode(state: AppState): string {
  return btoa(JSON.stringify(state))
}

function decode(raw: string): AppState | null {
  try {
    return JSON.parse(atob(raw)) as AppState
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
