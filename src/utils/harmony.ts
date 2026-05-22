import type { HarmonyMode } from '../types'
import { hexToColorLCH } from './color'
import type { ColorMode } from './color'

// Hue offsets for each harmony mode relative to the base hue
const HARMONY_OFFSETS: Record<HarmonyMode, number[]> = {
  'none':                 [],
  'complementary':        [180],
  'analogous':            [-30, 30],
  'triadic':              [120, 240],
  'split-complementary':  [150, 210],
}

/**
 * Given a base color hex and a harmony mode, returns the hues that should
 * be used to seed additional palettes.
 */
export function deriveHarmonyHues(baseHex: string, mode: HarmonyMode, colorMode: ColorMode): number[] {
  if (mode === 'none') return []
  const { h } = hexToColorLCH(baseHex, colorMode)
  return HARMONY_OFFSETS[mode].map(offset => ((h + offset) % 360 + 360) % 360)
}
