/* ------------------------------------------------------------------
   Vibrance color engine
   Pure, dependency-free color math used throughout the application.
------------------------------------------------------------------- */

export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value, precision = 0) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  let value = input.trim().replace(/['"]/g, '');
  if (!value) return null;
  if (!value.startsWith('#')) value = `#${value}`;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  if (/^#[0-9a-f]{8}$/i.test(value)) value = value.slice(0, 7);
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toUpperCase();
  return null;
}

export function hexToRgb(hex) {
  const normalized = normalizeHex(hex) || '#000000';
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex(r, g, b) {
  const channel = (value) =>
    Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

export function rgbToHsl(r, g, b) {
  const red = clamp(r, 0, 255) / 255;
  const green = clamp(g, 0, 255) / 255;
  const blue = clamp(b, 0, 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case red:
        hue = ((green - blue) / delta) % 6;
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return {
    h: round(hue, 2),
    s: round(saturation * 100, 2),
    l: round(lightness * 100, 2),
  };
}

export function rgbToHsv(r, g, b) {
  const red = clamp(r, 0, 255) / 255;
  const green = clamp(g, 0, 255) / 255;
  const blue = clamp(b, 0, 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    switch (max) {
      case red:
        hue = ((green - blue) / delta) % 6;
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return {
    h: round(hue, 2),
    s: round((max === 0 ? 0 : delta / max) * 100, 2),
    v: round(max * 100, 2),
  };
}

export function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s) / 100;
  const lightness = clamp(l) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) [red, green, blue] = [chroma, x, 0];
  else if (hue < 120) [red, green, blue] = [x, chroma, 0];
  else if (hue < 180) [red, green, blue] = [0, chroma, x];
  else if (hue < 240) [red, green, blue] = [0, x, chroma];
  else if (hue < 300) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  return {
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255),
  };
}

export function hsvToRgb(h, s, v) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s) / 100;
  const value = clamp(v) / 100;
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = value - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) [red, green, blue] = [chroma, x, 0];
  else if (hue < 120) [red, green, blue] = [x, chroma, 0];
  else if (hue < 180) [red, green, blue] = [0, chroma, x];
  else if (hue < 240) [red, green, blue] = [0, x, chroma];
  else if (hue < 300) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  return {
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255),
  };
}

export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function makeColor(hex, isLocked = false) {
  const normalized = normalizeHex(hex) || '#000000';
  const { r, g, b } = hexToRgb(normalized);
  const hsl = rgbToHsl(r, g, b);
  const hsv = rgbToHsv(r, g, b);

  return {
    hex: normalized,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
    hsv: `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`,
    isLocked: Boolean(isLocked),
  };
}

export function formatColor(color, format = 'hex') {
  if (!color) return '';
  const key = String(format).toLowerCase();
  if (key === 'rgb') return color.rgb;
  if (key === 'hsl') return color.hsl;
  if (key === 'hsv') return color.hsv;
  return color.hex;
}

export function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function getContrastRatio(a, b) {
  const luminanceA = getLuminance(a);
  const luminanceB = getLuminance(b);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastColor(hex) {
  const whiteRatio = getContrastRatio(hex, '#FFFFFF');
  const inkRatio = getContrastRatio(hex, '#111827');
  return whiteRatio >= inkRatio ? '#FFFFFF' : '#111827';
}

export function isDarkColor(hex) {
  return getLuminance(hex) < 0.36;
}

export function withAlpha(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixHex(a, b, weight = 0.5) {
  const colorA = hexToRgb(a);
  const colorB = hexToRgb(b);
  const mix = clamp(weight, 0, 1);
  return rgbToHex(
    colorA.r + (colorB.r - colorA.r) * mix,
    colorA.g + (colorB.g - colorA.g) * mix,
    colorA.b + (colorB.b - colorA.b) * mix,
  );
}

export function adjustLightness(hex, delta) {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)));
  return hslToHex(h, s, clamp(l + delta));
}

export function getShadeScale(hex) {
  const { h, s } = rgbToHsl(...Object.values(hexToRgb(hex)));
  const targets = [97, 93, 87, 78, 68, 58, 49, 40, 31, 23];

  return SHADE_STEPS.map((shade, index) => {
    const lightness = targets[index];
    const saturationFactor = shade <= 200 ? 0.78 : shade <= 500 ? 0.9 : 1;
    const saturation = clamp(s * saturationFactor, 4, 100);
    const shadeHex = hslToHex(h, saturation, lightness);
    return {
      shade,
      hex: shadeHex,
      rgb: `rgb(${hexToRgb(shadeHex).r}, ${hexToRgb(shadeHex).g}, ${hexToRgb(shadeHex).b})`,
    };
  });
}

export function circularHueDistance(a, b) {
  const distance = Math.abs(((a - b) % 360) + 360) % 360;
  return Math.min(distance, 360 - distance);
}

export function getPaletteMetrics(colors) {
  if (!colors?.length) {
    return {
      averageSaturation: 0,
      averageLightness: 0,
      averageHue: 0,
      warmRatio: 0,
      coolRatio: 0,
      contrastRatio: 1,
      hueSpread: 0,
      maxHueGap: 0,
    };
  }

  const hslValues = colors.map((color) => {
    const rgb = hexToRgb(color.hex);
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  });

  const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const averageSaturation = average(hslValues.map((value) => value.s));
  const averageLightness = average(hslValues.map((value) => value.l));
  const averageHue = average(hslValues.map((value) => value.h));

  const warmRatio =
    hslValues.filter(
      ({ h, s }) => s > 12 && (h <= 55 || h >= 340),
    ).length / hslValues.length;
  const coolRatio =
    hslValues.filter(({ h, s }) => s > 12 && h >= 165 && h <= 285).length /
    hslValues.length;

  const luminances = colors.map((color) => getLuminance(color.hex));
  const contrastRatio =
    (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);

  let maxHueGap = 0;
  for (let i = 0; i < hslValues.length; i += 1) {
    for (let j = i + 1; j < hslValues.length; j += 1) {
      maxHueGap = Math.max(
        maxHueGap,
        circularHueDistance(hslValues[i].h, hslValues[j].h),
      );
    }
  }

  const sortedHues = hslValues.map((value) => value.h).sort((a, b) => a - b);
  let hueSpread = 0;
  for (let index = 0; index < sortedHues.length; index += 1) {
    const next = sortedHues[(index + 1) % sortedHues.length] + (index === sortedHues.length - 1 ? 360 : 0);
    hueSpread = Math.max(hueSpread, next - sortedHues[index]);
  }
  hueSpread = 360 - hueSpread;

  return {
    averageSaturation,
    averageLightness,
    averageHue,
    warmRatio,
    coolRatio,
    contrastRatio,
    hueSpread,
    maxHueGap,
  };
}

export function detectMood(colors) {
  if (!colors?.length) return 'Bright';
  const metrics = getPaletteMetrics(colors);

  if (metrics.averageLightness < 38) return 'Dark';
  if (metrics.averageSaturation > 82 && metrics.averageLightness >= 44) return 'Neon';
  if (metrics.averageLightness > 72 && metrics.averageSaturation < 72) return 'Pastel';
  if (
    metrics.averageSaturation < 44 &&
    (metrics.warmRatio > 0.35 || metrics.averageHue > 65) &&
    metrics.averageLightness < 72
  ) {
    return 'Earthy';
  }
  if (metrics.warmRatio > 0.58) return 'Warm';
  if (metrics.coolRatio > 0.58) return 'Cool';
  if (metrics.averageSaturation < 52 && metrics.averageLightness < 68) return 'Vintage';
  return 'Bright';
}

export function getDesignTraits(colors) {
  if (!colors?.length) return [];
  const metrics = getPaletteMetrics(colors);
  const traits = [];

  if (metrics.contrastRatio >= 7) traits.push('High Contrast');
  if (metrics.contrastRatio <= 2.4) traits.push('Low Contrast');
  if (metrics.hueSpread <= 24) traits.push('Monochromatic');
  else if (metrics.hueSpread <= 72) traits.push('Analogous');
  if (metrics.maxHueGap >= 145 && metrics.maxHueGap <= 215) traits.push('Complementary');
  if (metrics.averageSaturation >= 72) traits.push('Vibrant');
  if (metrics.averageSaturation <= 42) traits.push('Soft');

  return [...new Set(traits)];
}

export function relativeHueLabel(hue) {
  if (hue < 20 || hue >= 345) return 'Rose';
  if (hue < 45) return 'Amber';
  if (hue < 70) return 'Citrus';
  if (hue < 155) return 'Botanical';
  if (hue < 195) return 'Aqua';
  if (hue < 255) return 'Sky';
  if (hue < 290) return 'Violet';
  if (hue < 330) return 'Magenta';
  return 'Rose';
}
