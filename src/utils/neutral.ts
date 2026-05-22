import { hexToColorLCH, generatePalette } from './color'
import type { ColorMode, ColorShade } from './color'
import type { GlobalSettings } from '../types'

// Tint strength: how much of the source hue bleeds into the neutral.
// 0 = pure gray, 1 = full chroma. Values around 0.08–0.15 produce
// the "warm/cool gray" effect used in Material You and Radix.
const NEUTRAL_CHROMA_RATIO = 0.10

/**
 * Derives a neutral (low-chroma) palette from a source color.
 * The neutral inherits the hue and a small fraction of the chroma,
 * producing a tinted gray that feels related to the primary color
 * rather than a disconnected pure gray.
 */
export function generateNeutralPalette(
  sourceHex: string,
  settings: GlobalSettings,
): ColorShade[] {
  const { h, c } = hexToColorLCH(sourceHex, settings.colorMode as ColorMode)

  // Normalize chroma back to 0-100 UI scale for generatePalette
  const OKLCH_C_SCALE = 0.004
  const cNormalized = settings.colorMode === 'oklch'
    ? (c / OKLCH_C_SCALE) * NEUTRAL_CHROMA_RATIO
    : c * NEUTRAL_CHROMA_RATIO

  return generatePalette({
    colorMode: settings.colorMode as ColorMode,
    useBaseColor: false,
    baseColor: sourceHex,
    manualHue: h,
    manualChroma: Math.min(cNormalized, 12), // hard cap — stays gray-ish
    shadeCount: settings.shadeCount,
    hueShift: 0,                             // no hue shift on neutrals
    chromaScale: settings.chromaScale,
    lightnessRange: [settings.lightnessMin, settings.lightnessMax],
    curve: settings.curve,
    lightContrastColor: settings.lightContrastColor,
    darkContrastColor: settings.darkContrastColor,
  })
}
