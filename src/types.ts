import type { ColorMode, CurveType } from './utils/color'

export type { ColorMode }

export interface GlobalSettings {
  colorMode: ColorMode
  shadeCount: number
  hueShift: number
  chromaScale: number
  lightnessMin: number
  lightnessMax: number
  curve: CurveType
  lightContrastColor: string
  darkContrastColor: string
}

export interface PaletteConfig {
  id: string
  name: string
  useBaseColor: boolean
  baseColor: string
  manualHue: number
  manualChroma: number  // 0-100 normalized (LCH: ×1.0, OKLCH: ×0.004)
  isNeutral?: boolean
}

export function createDefaultSettings(): GlobalSettings {
  return {
    colorMode: 'oklch',
    shadeCount: 6,
    hueShift: 10,
    chromaScale: 1.0,
    lightnessMin: 8,
    lightnessMax: 97,
    curve: 'ease-in-out',
    lightContrastColor: '#ffffff',
    darkContrastColor: '#000000',
  }
}

const PRESET_COLORS = ['#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#64748b']
let _count = 0

export function createDefaultPalette(name?: string): PaletteConfig {
  const color = PRESET_COLORS[_count % PRESET_COLORS.length]
  _count++
  return {
    id: crypto.randomUUID(),
    name: name ?? `Palette ${_count}`,
    useBaseColor: true,
    baseColor: color,
    manualHue: 220,
    manualChroma: 60,
  }
}
