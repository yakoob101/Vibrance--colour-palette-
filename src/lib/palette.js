import {
  detectMood,
  getShadeScale,
  hexToRgb,
  hslToHex,
  makeColor,
  normalizeHex,
  rgbToHsl,
  SHADE_STEPS,
} from './color';

export const MOODS = [
  'Warm',
  'Cool',
  'Pastel',
  'Neon',
  'Earthy',
  'Dark',
  'Bright',
  'Vintage',
];

export const DESIGN_ELEMENTS = [
  'High Contrast',
  'Low Contrast',
  'Monochromatic',
  'Analogous',
  'Complementary',
  'Soft',
  'Vibrant',
];

const MOOD_CONFIG = {
  Warm: {
    hueRanges: [
      [0, 52],
      [335, 360],
    ],
    saturation: [58, 94],
    lightness: [40, 74],
  },
  Cool: {
    hueRanges: [[180, 268]],
    saturation: [46, 90],
    lightness: [34, 72],
  },
  Pastel: {
    hueRanges: [[0, 360]],
    saturation: [42, 70],
    lightness: [73, 88],
  },
  Neon: {
    hueRanges: [[0, 360]],
    saturation: [88, 100],
    lightness: [47, 62],
  },
  Earthy: {
    hueRanges: [
      [18, 58],
      [72, 148],
    ],
    saturation: [20, 54],
    lightness: [28, 64],
  },
  Dark: {
    hueRanges: [[0, 360]],
    saturation: [26, 78],
    lightness: [10, 34],
  },
  Bright: {
    hueRanges: [[0, 360]],
    saturation: [72, 100],
    lightness: [50, 72],
  },
  Vintage: {
    hueRanges: [
      [18, 68],
      [145, 208],
    ],
    saturation: [24, 58],
    lightness: [36, 66],
  },
};

const NAME_BANK = {
  Warm: {
    adjectives: ['Sunlit', 'Amber', 'Golden', 'Copper', 'Saffron', 'Honeyed'],
    nouns: ['Ember', 'Dusk', 'Marmalade', 'Hearth', 'Sundial', 'Apricot'],
  },
  Cool: {
    adjectives: ['Arctic', 'Cobalt', 'Silver', 'Tidal', 'Glacial', 'Midnight'],
    nouns: ['Drift', 'Current', 'Haze', 'Signal', 'Frost', 'Horizon'],
  },
  Pastel: {
    adjectives: ['Powder', 'Sugar', 'Soft', 'Cotton', 'Peach', 'Cloud'],
    nouns: ['Daydream', 'Ribbon', 'Sorbet', 'Marshmallow', 'Bloom', 'Whisper'],
  },
  Neon: {
    adjectives: ['Electric', 'Ultraviolet', 'Laser', 'Hyper', 'Acid', 'Chrome'],
    nouns: ['Pulse', 'Circuit', 'Rave', 'Afterglow', 'Static', 'Flare'],
  },
  Earthy: {
    adjectives: ['Clay', 'Moss', 'Raw', 'Terra', 'Olive', 'Dune'],
    nouns: ['Grove', 'Ceramic', 'Harvest', 'Canyon', 'Botanica', 'Field'],
  },
  Dark: {
    adjectives: ['Velvet', 'Obsidian', 'Smoked', 'Nocturnal', 'Ink', 'Shadow'],
    nouns: ['Vault', 'Nightfall', 'Ember', 'Orbit', 'Noir', 'Sanctum'],
  },
  Bright: {
    adjectives: ['Citrus', 'Solar', 'Vivid', 'Daylight', 'Prism', 'Lucid'],
    nouns: ['Pop', 'Spectrum', 'Bloom', 'Spark', 'Carnival', 'Burst'],
  },
  Vintage: {
    adjectives: ['Faded', 'Retro', 'Aged', 'Analog', 'Sepia', 'Worn'],
    nouns: ['Postcard', 'Reel', 'Archive', 'Motel', 'Vinyl', 'Parade'],
  },
};

const TYPOGRAPHY_MOOD_FALLBACK = 'Bright';

const randomBetween = (min, max) => Math.random() * (max - min) + min;
const pick = (values) => values[Math.floor(Math.random() * values.length)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function randomHueFromRanges(ranges) {
  if (!ranges?.length) return randomBetween(0, 360);
  const total = ranges.reduce((sum, [start, end]) => sum + (end - start), 0);
  let cursor = Math.random() * total;
  for (const [start, end] of ranges) {
    const span = end - start;
    if (cursor <= span) return randomBetween(start, end);
    cursor -= span;
  }
  return randomBetween(0, 360);
}

function makeHueOffsets(count, design) {
  if (design === 'Monochromatic') {
    return Array.from({ length: count }, () => randomBetween(-3.5, 3.5));
  }

  if (design === 'Complementary') {
    return Array.from({ length: count }, (_, index) =>
      index % 2 === 0 ? randomBetween(-7, 7) : 180 + randomBetween(-10, 10),
    );
  }

  if (design === 'Analogous') {
    return Array.from({ length: count }, (_, index) => {
      const position = count === 1 ? 0 : index / (count - 1);
      return -30 + position * 60 + randomBetween(-4, 4);
    });
  }

  return Array.from({ length: count }, (_, index) => {
    const position = count === 1 ? 0 : index / (count - 1);
    return -36 + position * 72 + randomBetween(-5, 5);
  });
}

function getLightnessPair(moodConfig, design, index, count) {
  const [moodMin, moodMax] = moodConfig.lightness;
  const midpoint = (moodMin + moodMax) / 2;

  if (design === 'High Contrast') {
    const isDark = index % 2 === 0;
    return isDark ? randomBetween(13, 29) : randomBetween(80, 92);
  }

  if (design === 'Low Contrast') {
    return clamp(midpoint + randomBetween(-7, 7), 38, 72);
  }

  if (design === 'Soft') {
    return randomBetween(Math.max(60, moodMin), Math.min(88, Math.max(72, moodMax)));
  }

  if (design === 'Vibrant') {
    return randomBetween(45, 66);
  }

  if (design === 'Monochromatic') {
    const position = count === 1 ? 0.5 : index / (count - 1);
    return moodMin + (moodMax - moodMin) * position;
  }

  return randomBetween(moodMin, moodMax);
}

function getSaturation(moodConfig, design, index, count) {
  const [moodMin, moodMax] = moodConfig.saturation;

  if (design === 'Soft') return randomBetween(30, 58);
  if (design === 'Vibrant') return randomBetween(80, 100);
  if (design === 'Low Contrast') return randomBetween(34, 66);
  if (design === 'Monochromatic') {
    const position = count === 1 ? 0.5 : index / (count - 1);
    return moodMin + (moodMax - moodMin) * (0.45 + position * 0.55);
  }
  if (design === 'High Contrast') return randomBetween(Math.max(38, moodMin), moodMax);

  return randomBetween(moodMin, moodMax);
}

export function generateColors(count = 5, options = {}) {
  const paletteSize = clamp(Math.round(Number(count) || 5), 2, 8);
  const moodKey = MOODS.includes(options.mood) ? options.mood : null;
  const moodConfig = MOOD_CONFIG[moodKey] || {
    hueRanges: [[0, 360]],
    saturation: [42, 92],
    lightness: [34, 76],
  };
  const design = DESIGN_ELEMENTS.includes(options.design) ? options.design : null;
  const baseHue = randomHueFromRanges(moodConfig.hueRanges);
  const offsets = makeHueOffsets(paletteSize, design);
  const generated = [];

  for (let index = 0; index < paletteSize; index += 1) {
    let attempt = 0;
    let hex = '#000000';

    do {
      const hue = (baseHue + offsets[index] + (attempt > 0 ? randomBetween(-7, 7) : 0)) % 360;
      const saturation = clamp(
        getSaturation(moodConfig, design, index, paletteSize) + (attempt > 0 ? attempt * 1.5 : 0),
        0,
        100,
      );
      let lightness = getLightnessPair(moodConfig, design, index, paletteSize);
      if (attempt > 0) {
        lightness = clamp(lightness + (index % 2 === 0 ? -attempt * 2.2 : attempt * 2.2), 8, 94);
      }
      hex = hslToHex(hue, saturation, lightness);
      attempt += 1;
    } while (generated.some((color) => color.hex === hex) && attempt < 14);

    generated.push(makeColor(hex));
  }

  return generated;
}

export const DEFAULT_TUNING = {
  contrast: 50,
  hueSpread: 50,
  saturation: 50,
  lightness: 50,
  warmth: 50,
  variation: 50,
};

const shortestHueDelta = (from, to) => ((to - from + 540) % 360) - 180;

/**
 * Non-destructive display transform driven by the Palette Intelligence
 * sliders. Locked colors are left untouched.
 */
export function applyTuning(colors, tuning = DEFAULT_TUNING) {
  const settings = { ...DEFAULT_TUNING, ...tuning };
  const isNeutral = Object.keys(DEFAULT_TUNING).every(
    (key) => settings[key] === DEFAULT_TUNING[key],
  );
  if (isNeutral || !colors.length) return colors;

  const hsl = colors.map((color) => rgbToHsl(...Object.values(hexToRgb(color.hex))));
  const meanLightness = hsl.reduce((sum, color) => sum + color.l, 0) / hsl.length;
  const meanSaturation = hsl.reduce((sum, color) => sum + color.s, 0) / hsl.length;

  const contrastFactor = 0.4 + (settings.contrast / 100) * 1.2;
  const spreadFactor = 0.2 + (settings.hueSpread / 100) * 1.6;
  const saturationFactor = 0.4 + (settings.saturation / 100) * 1.2;
  const lightnessOffset = ((settings.lightness - 50) / 50) * 22;
  const variationFactor = 0.45 + (settings.variation / 100) * 1.1;
  const warmth = (settings.warmth - 50) / 50;
  const baseHue = hsl[0].h;

  return colors.map((color, index) => {
    if (color.isLocked) return color;

    const { h, s, l } = hsl[index];
    let hue = (baseHue + shortestHueDelta(baseHue, h) * spreadFactor + 360) % 360;

    if (warmth !== 0) {
      const target = warmth > 0 ? 30 : 210;
      hue = (hue + shortestHueDelta(hue, target) * Math.abs(warmth) * 0.4 + 360) % 360;
    }

    const lightness =
      meanLightness +
      (l - meanLightness) * contrastFactor * variationFactor +
      lightnessOffset;
    const saturation = (meanSaturation + (s - meanSaturation) * variationFactor) * saturationFactor;

    return makeColor(
      hslToHex(hue, clamp(saturation, 0, 100), clamp(lightness, 5, 97)),
    );
  });
}

const HARMONY_FOR_DESIGN = new Set(['Analogous', 'Complementary', 'Monochromatic']);

/**
 * Generate a fresh palette. Locked colors are preserved exactly, and when any
 * color is locked every new color is derived from the locked family (harmony
 * based) instead of being fully random, so the palette keeps its character.
 */
export function generatePalette(count = 5, options = {}, currentColors = []) {
  const paletteSize = clamp(Math.round(Number(count) || 5), 2, 8);
  const generated = generateColors(paletteSize, options);
  const result = generated.map((color, index) => {
    const existing = currentColors[index];
    if (existing?.isLocked) return { ...existing, isLocked: true };
    return color;
  });

  const lockedHexes = currentColors
    .slice(0, paletteSize)
    .filter((color) => color?.isLocked)
    .map((color) => color.hex);

  if (lockedHexes.length) {
    const harmony = HARMONY_FOR_DESIGN.has(options.design)
      ? options.design
      : pick(HARMONIES.filter((item) => item !== 'Random'));
    const seen = new Set(result.filter((color) => color.isLocked).map((color) => color.hex));
    let slot = 0;

    result.forEach((color, index) => {
      if (color.isLocked) return;
      const seedHex = lockedHexes[slot % lockedHexes.length];
      let hex = seedHex;
      let attempt = 0;
      do {
        hex = relatedColor(seedHex, harmony, slot, attempt);
        attempt += 1;
      } while (seen.has(hex) && attempt < 20);
      seen.add(hex);
      result[index] = makeColor(hex);
      slot += 1;
    });
  }

  const seen = new Set();
  return result.map((color, index) => {
    if (!seen.has(color.hex)) {
      seen.add(color.hex);
      return color;
    }

    const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(color.hex)));
    let adjusted = color.hex;
    let attempt = 0;
    while (seen.has(adjusted) && attempt < 16) {
      adjusted = hslToHex(h, s, clamp(l + (index % 2 === 0 ? 4 : -4) * (attempt + 1), 8, 94));
      attempt += 1;
    }
    const nextColor = makeColor(adjusted, color.isLocked);
    seen.add(nextColor.hex);
    return nextColor;
  });
}

/**
 * Resize without touching existing swatches. When growing, the new colors are
 * derived from the current family (hue/lightness variations of existing
 * colors) so the palette keeps its character instead of turning random.
 */
export function resizePalette(colors, nextSize) {
  const target = clamp(Math.round(Number(nextSize) || colors.length), 2, 8);
  if (target === colors.length) return colors;
  if (target < colors.length) return colors.slice(0, target);

  const seen = new Set(colors.map((color) => color.hex));
  const extras = [];
  const lightSteps = [18, -18, 34, -34];

  while (colors.length + extras.length < target) {
    const slot = extras.length;
    const anchor = colors[slot % colors.length];
    const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(anchor.hex)));
    const hue =
      (h + (slot % 2 === 0 ? 1 : -1) * (14 + Math.floor(slot / colors.length) * 14) + 360) % 360;
    const saturation = clamp(s + ((slot % 3) - 1) * 7, 14, 96);
    const lightness = clamp(
      l + lightSteps[slot % 4] + Math.floor(slot / colors.length) * 6,
      8,
      94,
    );

    let hex = hslToHex(hue, saturation, lightness);
    let attempt = 0;
    while (seen.has(hex) && attempt < 24) {
      const nudge = attempt + 1;
      hex = hslToHex(
        (hue + (attempt % 3 === 2 ? nudge * 7 : 0) + 360) % 360,
        clamp(saturation + (attempt % 3 === 1 ? nudge * 4 : 0), 6, 98),
        clamp(lightness + (attempt % 3 === 0 ? nudge * 5 : 0), 6, 95),
      );
      attempt += 1;
    }
    seen.add(hex);
    extras.push(makeColor(hex));
  }

  return [...colors, ...extras];
}

export const HARMONIES = [
  'Analogous',
  'Complementary',
  'Monochromatic',
  'Triadic',
  'Split Complementary',
  'Tetradic',
  'Random',
];

const HARMONY_OFFSETS = {
  Analogous: [-30, -15, 15, 30],
  Complementary: [180],
  Monochromatic: [0],
  Triadic: [120, 240],
  'Split Complementary': [150, 210],
  Tetradic: [90, 180, 270],
};

const harmonyOffsetFor = (harmony, index) => {
  if (harmony === 'Random') return randomBetween(-165, 165);
  const anchors =
    HARMONY_OFFSETS[HARMONIES.includes(harmony) ? harmony : 'Analogous'] ||
    HARMONY_OFFSETS.Analogous;
  const anchor = anchors[index % anchors.length];
  const cycle = Math.floor(index / anchors.length);
  if (cycle === 0) return anchor;
  // Keep later slots inside the same harmonic family instead of drifting away.
  return anchor + Math.min(cycle, 2) * 3 * (index % 2 === 0 ? 1 : -1);
};

function relatedColor(seedHex, harmony, index, attempt) {
  const { h: baseHue, s: baseSat, l: baseLight } = rgbToHsl(
    ...Object.values(hexToRgb(seedHex)),
  );
  const hue =
    (baseHue + harmonyOffsetFor(harmony, index) + (attempt > 0 ? randomBetween(-6, 6) : 0) + 360) %
    360;

  if (harmony === 'Monochromatic') {
    const saturation = clamp(baseSat * (0.62 + ((index % 3) + 1) * 0.13), 10, 96);
    const lightness = clamp(16 + ((index * 23) % 66) + (attempt > 0 ? attempt * 3 : 0), 10, 92);
    return hslToHex(hue, saturation, lightness);
  }

  const direction = index % 2 === 0 ? 1 : -1;
  const saturation = clamp(baseSat + (index % 2 === 0 ? 7 : -9) + attempt * 2, 12, 97);
  const lightness = clamp(
    baseLight + direction * (18 + (index % 4) * 6) + attempt * direction * 3,
    10,
    92,
  );
  return hslToHex(hue, saturation, lightness);
}

/**
 * Build a full palette from one or more seed colors. Seeds are kept as the
 * first swatches and the remaining slots are filled from a chosen harmony.
 */
export function buildPaletteFromSeeds(seedHexes, count = 5, harmony = 'Analogous') {
  const seeds = (Array.isArray(seedHexes) ? seedHexes : [seedHexes])
    .map((hex) => normalizeHex(hex))
    .filter(Boolean)
    .slice(0, 8);

  if (!seeds.length) return buildPaletteFromSeeds(['#ff4d9d'], count, harmony);

  const paletteSize = clamp(
    Math.round(Number(count) || seeds.length),
    Math.max(2, seeds.length),
    8,
  );
  const built = seeds.slice(0, paletteSize).map((hex) => makeColor(hex));

  let seedCursor = 0;
  while (built.length < paletteSize) {
    const seedHex = seeds[seedCursor % seeds.length];
    let hex = seedHex;
    let attempt = 0;

    do {
      hex = relatedColor(seedHex, harmony, seedCursor, attempt);
      attempt += 1;
    } while (built.some((color) => color.hex === hex) && attempt < 18);

    built.push(makeColor(hex));
    seedCursor += 1;
  }

  return built;
}

/**
 * Convenience wrapper for a single seed color.
 */
export function buildPaletteFromBase(baseHex, count = 5, harmony = 'Analogous') {
  return buildPaletteFromSeeds([baseHex], count, harmony);
}

export function generatePaletteName(mood = TYPOGRAPHY_MOOD_FALLBACK) {
  const bank = NAME_BANK[mood] || NAME_BANK[TYPOGRAPHY_MOOD_FALLBACK];
  return `${pick(bank.adjectives)} ${pick(bank.nouns)}`;
}

export function createId(prefix = 'pal') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createPaletteSnapshot(colors, overrides = {}) {
  const mood = overrides.mood || detectMood(colors);
  return {
    id: overrides.id || createId(),
    name: overrides.name || generatePaletteName(mood),
    colors: colors.map((color) => makeColor(color.hex, color.isLocked)),
    tags: overrides.tags || [mood],
    mood,
    createdAt: overrides.createdAt || Date.now(),
  };
}

export function buildShareUrl(colors, baseUrl) {
  const url = new URL(baseUrl || (typeof window !== 'undefined' ? window.location.href : 'https://vibrance.app'));
  const value = colors.map((color) => color.hex.slice(1).toLowerCase()).join('-');
  url.searchParams.set('palette', value);
  return url.toString();
}

export function readPaletteFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get('palette') || params.get('colors');
  if (!value) return null;

  const matches = value.match(/#?[0-9a-f]{6}(?![0-9a-f])/gi) || [];
  const colors = matches
    .map((hex) => normalizeHex(hex))
    .filter(Boolean)
    .slice(0, 8)
    .map((hex) => makeColor(hex));

  return colors.length >= 2 ? colors : null;
}

export function parseImportInput(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('Paste a palette or a list of hex colors first.');

  let payload = null;
  const looksLikeJson = raw.startsWith('{') || raw.startsWith('[');
  if (looksLikeJson) {
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error('That JSON could not be parsed. Check for missing commas or quotes.');
    }
  }

  let colorValues = [];
  let name = '';
  let tags = [];
  let mood = '';

  if (payload) {
    const source = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.colors)
        ? payload.colors
        : Array.isArray(payload.palette)
          ? payload.palette
          : null;

    if (!source) throw new Error('JSON must include a "colors" array or be an array of colors.');

    if (!Array.isArray(payload)) {
      name = typeof payload.name === 'string' ? payload.name : '';
      tags = Array.isArray(payload.tags) ? payload.tags.filter((tag) => typeof tag === 'string') : [];
      mood = typeof payload.mood === 'string' ? payload.mood : '';
    }

    colorValues = source.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return item.hex || item.value || item.color || '';
      return '';
    });
  } else {
    const sixDigit = raw.match(/#?[0-9a-f]{6}(?![0-9a-f])/gi);
    const threeDigit = raw.match(/#[0-9a-f]{3}(?![0-9a-f])/gi);
    colorValues = sixDigit?.length ? sixDigit : threeDigit || [];
  }

  const normalized = colorValues
    .map((value) => normalizeHex(value))
    .filter(Boolean)
    .slice(0, 8);

  if (normalized.length < 2) {
    throw new Error('A palette needs at least 2 valid hex colors.');
  }

  return {
    colors: normalized.map((hex) => makeColor(hex)),
    name,
    tags,
    mood,
  };
}

export function buildJsonExport(palette) {
  return JSON.stringify(
    {
      id: palette.id,
      name: palette.name,
      colors: palette.colors.map((color) => ({
        hex: color.hex,
        rgb: color.rgb,
        hsl: color.hsl,
        hsv: color.hsv,
        isLocked: color.isLocked,
      })),
      tags: palette.tags,
      mood: palette.mood,
      createdAt: palette.createdAt,
    },
    null,
    2,
  );
}

export function buildCssExport(colors) {
  const variables = colors.flatMap((color, index) => {
    const { r, g, b } = hexToRgb(color.hex);
    const hsl = rgbToHsl(r, g, b);
    return [
      `  --color-${index + 1}: ${color.hex};`,
      `  --color-${index + 1}-rgb: ${r} ${g} ${b};`,
      `  --color-${index + 1}-hsl: ${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%;`,
    ];
  });

  return `:root {\n${variables.join('\n')}\n}`;
}

export function buildTailwindExport(colors) {
  const roles = ['primary', 'secondary', 'accent', 'muted', 'highlight', 'support', 'neutral', 'detail'];
  const blocks = colors.map((color, index) => {
    const shades = getShadeScale(color.hex)
      .map((shade) => `          ${shade.shade}: '${shade.hex}',`)
      .join('\n');
    return `        ${roles[index]}: {\n${shades}\n        },`;
  });

  return `/** @type {import('tailwindcss').Config} */\nexport default {\n  theme: {\n    extend: {\n      colors: {\n${blocks.join('\n')}\n      },\n    },\n  },\n};`;
}

export function buildShadeExport(hex) {
  const shades = getShadeScale(hex);
  return JSON.stringify(
    Object.fromEntries(shades.map((shade) => [shade.shade, shade.hex])),
    null,
    2,
  );
}

export function matchesSavedFilter(palette, { query = '', mood = 'All', tag = 'All' } = {}) {
  const search = query.trim().toLowerCase();
  const matchesSearch =
    !search ||
    palette.name?.toLowerCase().includes(search) ||
    palette.tags?.some((item) => item.toLowerCase().includes(search)) ||
    palette.colors?.some((color) => color.hex.toLowerCase().includes(search));
  const matchesMood = mood === 'All' || palette.mood === mood;
  const matchesTag = tag === 'All' || palette.tags?.includes(tag);
  return matchesSearch && matchesMood && matchesTag;
}

export { SHADE_STEPS };
