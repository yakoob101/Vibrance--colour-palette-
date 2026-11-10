export const FONT_PAIRS = {
  Warm: {
    heading: 'Fraunces',
    body: 'DM Sans',
    headingClass: 'font-[Fraunces]',
    bodyClass: 'font-["DM_Sans"]',
    note: 'A sun-warmed editorial voice with a relaxed modern body.',
    fallbackHeading: 'Georgia, serif',
    fallbackBody: 'system-ui, sans-serif',
  },
  Cool: {
    heading: 'Space Grotesk',
    body: 'Inter',
    headingClass: 'font-["Space_Grotesk"]',
    bodyClass: 'font-[Inter]',
    note: 'Crisp geometry and a calm, highly legible companion.',
    fallbackHeading: 'system-ui, sans-serif',
    fallbackBody: 'system-ui, sans-serif',
  },
  Pastel: {
    heading: 'Quicksand',
    body: 'Nunito',
    note: 'Rounded, buoyant letterforms with a soft landing.',
    fallbackHeading: 'system-ui, sans-serif',
    fallbackBody: 'system-ui, sans-serif',
  },
  Neon: {
    heading: 'Syne',
    body: 'Space Mono',
    note: 'A futuristic display face paired with a technical mono body.',
    fallbackHeading: 'system-ui, sans-serif',
    fallbackBody: 'monospace',
  },
  Earthy: {
    heading: 'Lora',
    body: 'Karla',
    note: 'A grounded serif with a quiet, humanist sans.',
    fallbackHeading: 'Georgia, serif',
    fallbackBody: 'system-ui, sans-serif',
  },
  Dark: {
    heading: 'Bebas Neue',
    body: 'Manrope',
    note: 'Cinematic scale and a low-key, modern companion.',
    fallbackHeading: 'Impact, sans-serif',
    fallbackBody: 'system-ui, sans-serif',
  },
  Bright: {
    heading: 'Outfit',
    body: 'Work Sans',
    note: 'Open, optimistic forms built for clear communication.',
    fallbackHeading: 'system-ui, sans-serif',
    fallbackBody: 'system-ui, sans-serif',
  },
  Vintage: {
    heading: 'Playfair Display',
    body: 'Libre Baskerville',
    note: 'A nostalgic editorial pairing with literary texture.',
    fallbackHeading: 'Georgia, serif',
    fallbackBody: 'Georgia, serif',
  },
};

export const DEFAULT_FONT_PAIR = FONT_PAIRS.Bright;

export function getFontPair(mood) {
  return FONT_PAIRS[mood] || DEFAULT_FONT_PAIR;
}

export function fontFamily(name, fallback = 'sans-serif') {
  if (!name) return fallback;
  return `"${name}", ${fallback}`;
}
