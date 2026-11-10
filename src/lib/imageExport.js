import { getContrastColor, mixHex, withAlpha } from './color';

/**
 * Canvas renderers that mirror the CSS produced by GradientStudio / ExportModal
 * so downloaded images match the on-screen preview and the copied CSS.
 */

const rad = (deg) => (deg * Math.PI) / 180;

const farthestCorner = (x, y, w, h) =>
  Math.max(
    Math.hypot(x, y),
    Math.hypot(w - x, y),
    Math.hypot(x, h - y),
    Math.hypot(w - x, h - y),
  );

/** CSS `linear-gradient(<angle>deg, …)`: 0deg points up, clockwise. */
function paintLinear(ctx, w, h, angleDeg, colorStops) {
  const a = rad(angleDeg);
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const length = Math.abs(w * dx) + Math.abs(h * dy);
  const cx = w / 2;
  const cy = h / 2;
  const gradient = ctx.createLinearGradient(
    cx - (dx * length) / 2,
    cy - (dy * length) / 2,
    cx + (dx * length) / 2,
    cy + (dy * length) / 2,
  );
  colorStops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function createGrainPattern(ctx, slope) {
  const size = 180;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tileCtx = tile.getContext('2d');
  const image = tileCtx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.round(Math.random() * 255);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = Math.round(255 * slope * Math.random());
  }
  tileCtx.putImageData(image, 0, 0);
  return ctx.createPattern(tile, 'repeat');
}

function paintBase(ctx, config, w, h) {
  const { type, hexes, angle, scale } = config;
  const count = hexes.length;
  const first = hexes[0] || '#111827';
  const last = hexes[hexes.length - 1] || first;

  if (count < 2) {
    ctx.fillStyle = first;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  const stops = hexes.map((hex, index) => [index / (count - 1), hex]);

  switch (type) {
    case 'radial': {
      const a = rad(angle);
      const cx = ((50 + Math.cos(a) * 30) / 100) * w;
      const cy = ((50 + Math.sin(a) * 30) / 100) * h;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, farthestCorner(cx, cy, w, h));
      stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    case 'conic': {
      const gradient = ctx.createConicGradient(rad(angle - 90), w / 2, h / 2);
      stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    case 'stripes': {
      const hard = hexes.flatMap((hex, index) => [
        [index / count, hex],
        [(index + 1) / count, hex],
      ]);
      paintLinear(ctx, w, h, angle, hard);
      return;
    }
    case 'checker': {
      const cell = Math.max(2, scale / 2);
      for (let row = 0; row * cell < h; row += 1) {
        for (let col = 0; col * cell < w; col += 1) {
          ctx.fillStyle = (row + col) % 2 === 0 ? last : first;
          ctx.fillRect(Math.round(col * cell), Math.round(row * cell), Math.ceil(cell), Math.ceil(cell));
        }
      }
      return;
    }
    case 'dots': {
      ctx.fillStyle = count > 2 ? last : mixHex(first, last, 0.82);
      ctx.fillRect(0, 0, w, h);
      const tile = Math.max(8, scale);
      const dotLayers = [
        { color: first, offset: 0 },
        { color: hexes[1] || first, offset: tile / 2 },
      ];
      dotLayers.forEach(({ color, offset }) => {
        for (let y = -tile; y < h + tile; y += tile) {
          for (let x = -tile; x < w + tile; x += tile) {
            const cx = x + offset + tile / 2;
            const cy = y + offset + tile / 2;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, (tile / 2) * Math.SQRT2);
            gradient.addColorStop(0.3, color);
            gradient.addColorStop(0.32, withAlpha(color, 0));
            ctx.fillStyle = gradient;
            ctx.fillRect(x + offset, y + offset, tile, tile);
          }
        }
      });
      return;
    }
    case 'mesh': {
      ctx.fillStyle = last;
      ctx.fillRect(0, 0, w, h);
      const corners = [
        [0.12, 0.18],
        [0.85, 0.12],
        [0.22, 0.88],
        [0.88, 0.8],
      ];
      corners.forEach(([px, py], index) => {
        const cx = px * w;
        const cy = py * h;
        const color = hexes[index % count];
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, farthestCorner(cx, cy, w, h));
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.55, withAlpha(color, 0));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });
      return;
    }
    default:
      paintLinear(ctx, w, h, angle, stops);
  }
}

function paintEffectLayers(ctx, config, w, h) {
  const { hexes, effects = {}, amounts = {} } = config;
  const first = hexes[0] || '#111827';
  const last = hexes[hexes.length - 1] || first;

  if (effects.vignette) {
    const strength = (0.25 + ((amounts.vignette ?? 45) / 100) * 0.6).toFixed(2);
    const cx = w * 0.5;
    const cy = h * 0.42;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, farthestCorner(cx, cy, w, h));
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  if (effects.glow) {
    const light = mixHex(mixHex(first, last, 0.5), '#ffffff', 0.6);
    const alpha = (0.12 + ((amounts.glow ?? 45) / 100) * 0.45).toFixed(2);
    const cx = w * 0.5;
    const cy = h * 0.06;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, farthestCorner(cx, cy, w, h));
    gradient.addColorStop(0, withAlpha(light, alpha));
    gradient.addColorStop(0.62, withAlpha(light, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  if (effects.grain) {
    const slope = 0.08 + ((amounts.grain ?? 45) / 100) * 0.45;
    ctx.fillStyle = createGrainPattern(ctx, slope);
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Render the configured gradient (pattern + stacked effects) onto a canvas.
 * Config: { type, hexes, angle, scale, effects: {blur,grain,glow,vignette}, amounts: {…} }
 */
export function renderGradientCanvas(config, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const render = config.effects?.blur
    ? (() => {
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        return offscreen;
      })()
    : canvas;
  const renderCtx = render.getContext('2d');

  paintBase(renderCtx, config, width, height);
  paintEffectLayers(renderCtx, config, width, height);

  if (render !== canvas) {
    const px = Math.round(4 + ((config.amounts?.blur ?? 45) / 100) * 40);
    const overscan = 1.18;
    ctx.save();
    ctx.filter = `blur(${px}px)`;
    ctx.drawImage(
      render,
      -(width * (overscan - 1)) / 2,
      -(height * (overscan - 1)) / 2,
      width * overscan,
      height * overscan,
    );
    ctx.restore();
  }

  return canvas;
}

/** Vertical swatch bands with hex labels, for the palette image export. */
export function renderPaletteCanvas(colors, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const bandHeight = height / colors.length;

  colors.forEach((color, index) => {
    const top = index * bandHeight;
    ctx.fillStyle = color.hex;
    ctx.fillRect(0, top, width, bandHeight + 1);

    const fontSize = Math.max(16, Math.round(bandHeight * 0.14));
    ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = getContrastColor(color.hex);
    ctx.fillText(color.hex.toUpperCase(), fontSize * 1.4, top + bandHeight / 2);
  });

  return canvas;
}

export function downloadCanvasPng(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
