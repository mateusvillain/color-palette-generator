# Color System — How Palette Generation Works

## Overview

Palettes are generated in **perceptual color spaces** (LCH or OKLCH) rather than HSL/HSB. The core idea is that equal numerical steps in these spaces produce equal *perceived* differences — something HSL cannot guarantee.

A yellow at L=50 in HSL looks far brighter than a blue at L=50. In LCH/OKLCH, L=50 always means the same perceived lightness, regardless of hue.

---

## Color Spaces

Two modes are available, both based on perceptual uniformity:

### LCH (CIE)
The CIE standard. Each unit change in L, C, or H produces the same perceptual difference.

**Pipeline:** `sRGB → Linear RGB → XYZ D65 → CIE Lab → LCH`

### OKLCH
An improved version by Björn Ottosson (2020). More stable hue perception at high chromas, especially for blues and purples.

**Pipeline:** `sRGB → Linear RGB → OKLab → OKLCH`

### Axes (both modes)

| Axis | Meaning | Range |
|------|---------|-------|
| **L** | Perceptual lightness | 0–100 |
| **C** | Chroma (saturation/vividness) | 0–150 (LCH) · 0–0.4 (OKLCH) |
| **H** | Hue angle | 0–360° |

The chroma slider uses a normalized 0–100 scale for both modes. Internally: LCH `×1.0`, OKLCH `×0.004`.

---

## Palette Generation

Defined in `src/utils/color.ts` → `generatePalette()`.

### 1. Color anchor

If a base color is provided, its H and C are extracted via `hexToColorLCH()`. The original L is discarded — the palette will sweep the full configured lightness range. If no base color is used, H and C come from the manual sliders.

### 2. Lightness distribution with easing curve

Shades are distributed from `lightnessMax` down to `lightnessMin` using an easing curve:

```
t         = i / (shadeCount - 1)        // linear position 0 → 1
tCurved   = applyCurve(t, curve)        // redistributed by curve
L         = lightnessMax - tCurved × (lightnessMax - lightnessMin)
```

Available curves: `linear`, `ease-in`, `ease-out`, `ease-in-out` (default), `sine`.

`ease-in-out` concentrates shades in the mid-range, preventing compressed extremes and giving the palette a natural feel.

### 3. Hue shift

The hue rotates slightly across the scale:

```
H = baseH + hueShift × (0.5 - t)
```

Light shades shift one direction, dark shades the other. This mimics professional palettes where color "warms" or "cools" at the extremes.

### 4. Chroma dimming at extremes

Chroma is reduced near the very light and very dark ends to avoid impossible colors and replicate how real pigments behave:

```
chromaDim = 1 - (|t - 0.5| × 1.4)² × 0.35
C         = baseC × chromaScale × chromaDim
```

---

## Gamut Mapping

LCH and OKLCH describe colors that don't exist in sRGB. A highly saturated blue may be mathematically valid in OKLCH but impossible to display on a standard monitor.

When a color falls outside the sRGB gamut, the system performs a **binary search** that reduces C until the color is in-gamut — 25 iterations, accurate to ~0.003 units:

```
lo = 0, hi = C
repeat 25×: mid = (lo + hi) / 2
            in-gamut? → lo = mid
            out-of-gamut? → hi = mid
```

L and H are preserved exactly. Only the minimum necessary saturation is sacrificed.

---

## Shade Indices

Shade indices follow the **Tailwind CSS** convention, widely adopted in design systems. Optimized presets are defined for common shade counts:

| Count | Indices |
|-------|---------|
| 6 | 50, 200, 400, 600, 800, 950 |
| 9 | 100, 200, 300, 400, 500, 600, 700, 800, 900 |
| 11 | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 |

Other counts generate evenly spaced indices between 50 and 950.

---

## Contrast & Accessibility (WCAG 2.1)

Each shade computes a contrast ratio against two reference colors (light and dark) using the official WCAG formula:

```
ratio = (L1 + 0.05) / (L2 + 0.05)    // L1 > L2
```

Where L is the relative luminance of each color, calculated from linearized sRGB.

| Level | Ratio | Use case |
|-------|-------|----------|
| **AAA** | ≥ 7 : 1 | Enhanced — small body text |
| **AA** | ≥ 4.5 : 1 | Normal — small text, UI components |
| **AA Large** | ≥ 3 : 1 | Large text (18pt+), graphical elements |
| **Fail** | < 3 : 1 | Do not use for text |

Badges in each shade cell show the ratio and WCAG level against both contrast reference colors simultaneously.

### APCA (Advanced Perceptual Contrast Algorithm)

WCAG 2.1 has documented failures — it overestimates contrast for large text and underestimates it for small text at similar luminance. APCA is the proposed replacement in WCAG 3.0.

The tool supports both formulas, selectable in the sidebar. APCA returns a signed **Lc value**: positive = dark text on light background, negative = light text on dark background.

**Implemented formula:** APCA-W3 0.0.98G (Myndex Research)

```
yText = softClamp(relativeLuminance(text))
yBg   = softClamp(relativeLuminance(bg))

Lc = (yBg >= yText)
  ? (yBg^0.56 − yText^0.57) × 1.14     // dark-on-light
  : (yBg^0.65 − yText^0.62) × 1.14     // light-on-dark
```

**APCA level thresholds:**

| Lc | Use case |
|----|----------|
| 90+ | Body text, small text (< 14px) |
| 75+ | Large text, subheadings |
| 60+ | UI components, placeholders, disabled states |
| 45+ | Non-text elements, decorative |
| < 45 | Fail — insufficient for any purpose |

---

## Architecture

```
GlobalSettings          — shared across all palettes
  colorMode             LCH or OKLCH
  contrastMode          wcag or apca (default: wcag)
  shadeCount            number of shades (default: 6)
  lightnessMin/Max      lightness range (default: 8–97)
  hueShift              hue rotation across scale (default: 10°)
  chromaScale           global chroma multiplier (default: 1.0)
  curve                 easing curve (default: ease-in-out)
  lightContrastColor    reference for light backgrounds (default: #ffffff)
  darkContrastColor     reference for dark backgrounds (default: #000000)

PaletteConfig           — per palette
  baseColor             hex color to extract H and C from (optional)
  manualHue             H when base color is off (0–360)
  manualChroma          C when base color is off (0–100 normalized)
```
