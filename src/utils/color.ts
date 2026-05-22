// ── Types ────────────────────────────────────────────────────────────────────

export type ColorMode = 'lch' | 'oklch'
export type CurveType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'sine'

export interface ColorLCH {
  l: number  // 0-100 for both modes (OKLCH L normalized ×100)
  c: number  // native: LCH 0-150, OKLCH 0-0.4
  h: number  // 0-360
}

export interface ColorShade {
  index: number
  hex: string
  contrastLight: number
  contrastDark: number
}

// ── Easing Curves ─────────────────────────────────────────────────────────────

export function applyCurve(t: number, curve: CurveType): number {
  switch (curve) {
    case 'linear':       return t
    case 'ease-in':      return t * t * t
    case 'ease-out':     return 1 - Math.pow(1 - t, 3)
    case 'ease-in-out':  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    case 'sine':         return -(Math.cos(Math.PI * t) - 1) / 2
  }
}

// ── sRGB Linearization ───────────────────────────────────────────────────────

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function toSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

// ── Hex ↔ Linear RGB ─────────────────────────────────────────────────────────

function hexToLinear(hex: string): [number, number, number] {
  return [
    toLinear(parseInt(hex.slice(1, 3), 16) / 255),
    toLinear(parseInt(hex.slice(3, 5), 16) / 255),
    toLinear(parseInt(hex.slice(5, 7), 16) / 255),
  ]
}

function linearToHex(r: number, g: number, b: number): string {
  const ch = (v: number) =>
    Math.round(Math.max(0, Math.min(1, toSrgb(v))) * 255).toString(16).padStart(2, '0')
  return `#${ch(r)}${ch(g)}${ch(b)}`
}

function isInGamut(r: number, g: number, b: number): boolean {
  return r >= -0.001 && r <= 1.001 && g >= -0.001 && g <= 1.001 && b >= -0.001 && b <= 1.001
}

// ── XYZ D65 ──────────────────────────────────────────────────────────────────

function linearToXyz(r: number, g: number, b: number): [number, number, number] {
  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
  ]
}

function xyzToLinear(x: number, y: number, z: number): [number, number, number] {
  return [
    x *  3.2404542 - y * 1.5371385 - z * 0.4985314,
    x * -0.9692660 + y * 1.8760108 + z * 0.0415560,
    x *  0.0556434 - y * 0.2040259 + z * 1.0572252,
  ]
}

// ── CIE Lab ──────────────────────────────────────────────────────────────────

const D65 = [0.95047, 1.00000, 1.08883] as const

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
  const fy = f(y / D65[1])
  return [116 * fy - 16, 500 * (f(x / D65[0]) - fy), 200 * (fy - f(z / D65[2]))]
}

function labToXyz(l: number, a: number, b: number): [number, number, number] {
  const fy = (l + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200
  const f3 = (v: number) => v * v * v
  return [
    D65[0] * (f3(fx) > 0.008856 ? f3(fx) : (fx - 16 / 116) / 7.787),
    D65[1] * (l > 8 ? f3((l + 16) / 116) : l / 903.3),
    D65[2] * (f3(fz) > 0.008856 ? f3(fz) : (fz - 16 / 116) / 7.787),
  ]
}

// ── OKLab ────────────────────────────────────────────────────────────────────

function linearToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3)
  return [
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ]
}

// ── LCH / OKLCH → linear RGB ─────────────────────────────────────────────────

function lchToLinear(l: number, c: number, h: number): [number, number, number] {
  const rad = h * Math.PI / 180
  return xyzToLinear(...labToXyz(l, c * Math.cos(rad), c * Math.sin(rad)))
}

// lNorm: 0-100, mapped to OKLCH's 0-1 internally
function oklchToLinear(lNorm: number, c: number, h: number): [number, number, number] {
  const rad = h * Math.PI / 180
  return oklabToLinear(lNorm / 100, c * Math.cos(rad), c * Math.sin(rad))
}

// ── Gamut Mapping (chroma reduction) ─────────────────────────────────────────

function gamutMap(lNorm: number, c: number, h: number, mode: ColorMode): string {
  const toLinearRgb = (c2: number) =>
    mode === 'lch' ? lchToLinear(lNorm, c2, h) : oklchToLinear(lNorm, c2, h)

  const [r, g, b] = toLinearRgb(c)
  if (isInGamut(r, g, b)) return linearToHex(r, g, b)

  // Binary search for max in-gamut chroma
  let lo = 0, hi = c
  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2
    const [ri, gi, bi] = toLinearRgb(mid)
    if (isInGamut(ri, gi, bi)) lo = mid
    else hi = mid
  }
  return linearToHex(...toLinearRgb(lo))
}

// ── Public: hex → LCH / OKLCH ────────────────────────────────────────────────

export function hexToColorLCH(hex: string, mode: ColorMode): ColorLCH {
  const [r, g, b] = hexToLinear(hex)
  if (mode === 'lch') {
    const [l, a, lb] = xyzToLab(...linearToXyz(r, g, b))
    return {
      l,
      c: Math.sqrt(a * a + lb * lb),
      h: ((Math.atan2(lb, a) * 180 / Math.PI) + 360) % 360,
    }
  } else {
    const [L, a, ob] = linearToOklab(r, g, b)
    return {
      l: L * 100,
      c: Math.sqrt(a * a + ob * ob),
      h: ((Math.atan2(ob, a) * 180 / Math.PI) + 360) % 360,
    }
  }
}

// ── Contrast ─────────────────────────────────────────────────────────────────

export function relativeLuminance(hex: string): number {
  return (
    0.2126 * toLinear(parseInt(hex.slice(1, 3), 16) / 255) +
    0.7152 * toLinear(parseInt(hex.slice(3, 5), 16) / 255) +
    0.0722 * toLinear(parseInt(hex.slice(5, 7), 16) / 255)
  )
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  return parseFloat(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2))
}

export function wcagLevel(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

// ── APCA Contrast (WCAG 3 candidate) ─────────────────────────────────────────
// Based on the APCA-W3 0.0.98G formula by Myndex Research.
// Returns a signed Lc value: positive = dark text on light bg, negative = light text on dark bg.
// Typical thresholds: |Lc| ≥ 90 → body text, ≥ 75 → large text, ≥ 60 → UI components.

function apcaSoftClamp(y: number): number {
  const exp = 0.56
  return y >= 0.022 ? y : y + Math.pow(0.022 - y, exp)
}

export function apcaContrast(textHex: string, bgHex: string): number {
  const yText = apcaSoftClamp(relativeLuminance(textHex))
  const yBg   = apcaSoftClamp(relativeLuminance(bgHex))

  const darkOverLight = yBg >= yText
  const Lc = darkOverLight
    ? (Math.pow(yBg, 0.56) - Math.pow(yText, 0.57)) * 1.14
    : (Math.pow(yBg, 0.65) - Math.pow(yText, 0.62)) * 1.14

  return parseFloat((Math.abs(Lc) < 0.1 ? 0 : Lc * 100).toFixed(1))
}

export type ApcaLevel = 'Lc90+' | 'Lc75+' | 'Lc60+' | 'Lc45+' | 'Fail'

export function apcaLevel(lc: number): ApcaLevel {
  const abs = Math.abs(lc)
  if (abs >= 90) return 'Lc90+'
  if (abs >= 75) return 'Lc75+'
  if (abs >= 60) return 'Lc60+'
  if (abs >= 45) return 'Lc45+'
  return 'Fail'
}

// ── Shade Steps ───────────────────────────────────────────────────────────────

function shadeSteps(count: number): number[] {
  const presets: Record<number, number[]> = {
    1:  [500],
    3:  [100, 500, 900],
    4:  [100, 400, 700, 900],
    5:  [100, 300, 500, 700, 900],
    6:  [50, 200, 400, 600, 800, 950],
    7:  [50, 100, 300, 500, 700, 900, 950],
    9:  [100, 200, 300, 400, 500, 600, 700, 800, 900],
    11: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  }
  return presets[count] ?? Array.from({ length: count }, (_, i) =>
    Math.round(50 + (i / (count - 1)) * 900)
  )
}

// ── Palette Generation ────────────────────────────────────────────────────────

export interface PaletteOptions {
  colorMode: ColorMode
  useBaseColor: boolean
  baseColor: string
  manualHue: number
  manualChroma: number  // 0-100 normalized; LCH → ×1.0, OKLCH → ×0.004
  shadeCount: number
  hueShift: number
  chromaScale: number
  lightnessRange: [number, number]  // 0-100 for both modes
  curve: CurveType
  lightContrastColor: string
  darkContrastColor: string
}

const OKLCH_C_SCALE = 0.004  // 100 → 0.4 (covers full sRGB gamut in OKLCH)

export function generatePalette(options: PaletteOptions): ColorShade[] {
  const {
    colorMode, useBaseColor, baseColor, manualHue, manualChroma,
    shadeCount, hueShift, chromaScale, lightnessRange, curve,
    lightContrastColor, darkContrastColor,
  } = options

  let baseH: number
  let baseC: number  // native chroma for the current mode

  if (useBaseColor) {
    const lch = hexToColorLCH(baseColor, colorMode)
    baseH = lch.h
    baseC = lch.c
  } else {
    baseH = manualHue
    baseC = colorMode === 'lch' ? manualChroma : manualChroma * OKLCH_C_SCALE
  }

  const [minL, maxL] = lightnessRange
  const steps = shadeSteps(shadeCount)

  return Array.from({ length: shadeCount }, (_, i) => {
    const t = shadeCount === 1 ? 0.5 : i / (shadeCount - 1)
    const tCurved = applyCurve(t, curve)

    const lNorm = maxL - tCurved * (maxL - minL)

    const hueOffset = hueShift * (0.5 - t)
    const h = ((baseH + hueOffset) % 360 + 360) % 360

    // Chroma dims slightly at very light and dark extremes
    const chromaDim = 1 - Math.pow(Math.abs(t - 0.5) * 1.4, 2) * 0.35
    const c = Math.max(0, baseC * chromaScale * chromaDim)

    const hex = gamutMap(lNorm, c, h, colorMode)

    return {
      index: steps[i],
      hex,
      contrastLight: contrastRatio(hex, lightContrastColor),
      contrastDark: contrastRatio(hex, darkContrastColor),
    }
  })
}
