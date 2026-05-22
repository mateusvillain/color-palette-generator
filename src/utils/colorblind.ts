// Color vision deficiency simulation using the Brettel (1997) / Viénot (1999) method.
// Matrices operate in linear RGB space.

export type ColorblindMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia'

// Linear RGB transformation matrices for each CVD type
const CVD_MATRICES: Record<Exclude<ColorblindMode, 'normal'>, readonly [number, number, number, number, number, number, number, number, number]> = {
  // Red-green (green-weak) — most common, ~6% of men
  deuteranopia: [
    0.367322, 0.860646, -0.227968,
    0.280085, 0.672501,  0.047413,
   -0.011820, 0.042940,  0.968881,
  ],
  // Red-green (red-weak)
  protanopia: [
    0.152286, 1.052583, -0.204868,
    0.114503, 0.786281,  0.099216,
   -0.003882,-0.048116,  1.051998,
  ],
  // Blue-yellow (rare)
  tritanopia: [
    1.255528, -0.076749, -0.178779,
   -0.078411,  0.930809,  0.147602,
    0.004733,  0.691367,  0.303900,
  ],
}

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function toSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Simulates how a hex color appears under a given color vision deficiency.
 * Returns a new hex color representing the simulated perception.
 */
export function simulateCVD(hex: string, mode: ColorblindMode): string {
  if (mode === 'normal') return hex

  const r = toLinear(parseInt(hex.slice(1, 3), 16) / 255)
  const g = toLinear(parseInt(hex.slice(3, 5), 16) / 255)
  const b = toLinear(parseInt(hex.slice(5, 7), 16) / 255)

  const m = CVD_MATRICES[mode]
  const rs = m[0] * r + m[1] * g + m[2] * b
  const gs = m[3] * r + m[4] * g + m[5] * b
  const bs = m[6] * r + m[7] * g + m[8] * b

  const toHex = (v: number) => Math.round(clamp(toSrgb(v)) * 255).toString(16).padStart(2, '0')
  return `#${toHex(rs)}${toHex(gs)}${toHex(bs)}`
}

/**
 * Simulates an entire palette under a given CVD mode.
 */
export function simulatePaletteCVD(
  hexes: string[],
  mode: ColorblindMode,
): string[] {
  return hexes.map(hex => simulateCVD(hex, mode))
}
