import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Blend, Clipboard, ImageDown, Shuffle } from 'lucide-react';
import { getContrastColor, mixHex, withAlpha } from '../lib/color';
import { downloadCanvasPng, renderGradientCanvas } from '../lib/imageExport';
import { Button, IconButton, SectionHeading, cx } from './ui';

const IMAGE_SIZES = [
  { id: 'landscape', label: 'Landscape', width: 1920, height: 1080 },
  { id: 'square', label: 'Square', width: 1440, height: 1440 },
  { id: 'portrait', label: 'Portrait', width: 1080, height: 1920 },
];

const TYPES = [
  { id: 'linear', label: 'Linear' },
  { id: 'radial', label: 'Radial' },
  { id: 'conic', label: 'Conic' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'checker', label: 'Checker' },
  { id: 'dots', label: 'Dots' },
  { id: 'mesh', label: 'Mesh' },
];

const EFFECTS = [
  { id: 'blur', label: 'Blur' },
  { id: 'grain', label: 'Grain' },
  { id: 'glow', label: 'Glow' },
  { id: 'vignette', label: 'Vignette' },
];

const EFFECT_LABELS = Object.fromEntries(EFFECTS.map((item) => [item.id, item.label]));

const ANGLE_TYPES = new Set(['linear', 'radial', 'conic', 'stripes']);
const TILE_TYPES = new Set(['checker', 'dots']);

const HINTS = {
  linear: 'Angle sets the direction of the blend.',
  radial: 'Angle positions the center of the light.',
  conic: 'Angle rotates the sweep around the center.',
  stripes: 'Angle sets the stripe direction.',
  checker: 'Tile size sets how large the checks appear.',
  dots: 'Tile size sets the spacing between dots.',
  mesh: 'Corner glows blend over the deepest selected color.',
};

const softStops = (hexes) => {
  const count = hexes.length;
  return hexes
    .map((hex, index) => `${hex} ${count === 1 ? 100 : Math.round((index / (count - 1)) * 100)}%`)
    .join(', ');
};

function buildGradient(type, hexes, angle, scale) {
  const count = hexes.length;
  const first = hexes[0] || '#111827';
  const last = hexes[hexes.length - 1] || first;

  switch (type) {
    case 'radial': {
      const radians = (angle * Math.PI) / 180;
      const x = Math.round(50 + Math.cos(radians) * 30);
      const y = Math.round(50 + Math.sin(radians) * 30);
      return { backgroundImage: `radial-gradient(circle at ${x}% ${y}%, ${softStops(hexes)})` };
    }
    case 'conic':
      return {
        backgroundImage: `conic-gradient(from ${angle}deg at 50% 50%, ${softStops(hexes)})`,
      };
    case 'stripes': {
      const band = 100 / count;
      const hard = hexes
        .flatMap((hex, index) => [
          `${hex} ${(index * band).toFixed(2)}%`,
          `${hex} ${((index + 1) * band).toFixed(2)}%`,
        ])
        .join(', ');
      return { backgroundImage: `repeating-linear-gradient(${angle}deg, ${hard})` };
    }
    case 'checker':
      return {
        backgroundImage: `repeating-conic-gradient(${first} 0% 25%, ${last} 0% 50%)`,
        backgroundSize: `${scale}px ${scale}px`,
      };
    case 'dots':
      return {
        backgroundColor: count > 2 ? last : mixHex(first, last, 0.82),
        backgroundImage: `radial-gradient(circle, ${first} 30%, transparent 32%), radial-gradient(circle, ${
          hexes[1] || first
        } 30%, transparent 32%)`,
        backgroundSize: `${scale}px ${scale}px, ${scale}px ${scale}px`,
        backgroundPosition: `0 0, ${Math.round(scale / 2)}px ${Math.round(scale / 2)}px`,
      };
    case 'mesh': {
      const corners = ['12% 18%', '85% 12%', '22% 88%', '88% 80%'];
      const layers = [0, 1, 2, 3]
        .map(
          (corner) =>
            `radial-gradient(at ${corners[corner]}, ${hexes[corner % count]} 0%, transparent 55%)`,
        )
        .join(', ');
      return { backgroundColor: last, backgroundImage: layers };
    }
    default:
      return { backgroundImage: `linear-gradient(${angle}deg, ${softStops(hexes)})` };
  }
}

const noiseUrl = (slope) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='${slope}'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function effectLayers(hexes, effects, amounts) {
  const layers = [];
  if (effects.grain) {
    layers.push(noiseUrl((0.08 + (amounts.grain / 100) * 0.45).toFixed(2)));
  }
  if (effects.glow) {
    const light = mixHex(
      mixHex(hexes[0] || '#ffffff', hexes[hexes.length - 1] || '#ffffff', 0.5),
      '#ffffff',
      0.6,
    );
    const alpha = (0.12 + (amounts.glow / 100) * 0.45).toFixed(2);
    layers.push(`radial-gradient(circle at 50% 6%, ${withAlpha(light, alpha)}, transparent 62%)`);
  }
  if (effects.vignette) {
    const strength = (0.25 + (amounts.vignette / 100) * 0.6).toFixed(2);
    layers.push(
      `radial-gradient(circle at 50% 42%, transparent 50%, rgba(0, 0, 0, ${strength}) 100%)`,
    );
  }
  return layers;
}

/** Merge effect layers onto the base gradient so the preview and the CSS export match exactly. */
function composeBackground(base, layers) {
  const tileCount = base.backgroundSize ? base.backgroundSize.split(', ').length : 0;
  const sizes =
    layers.length && tileCount
      ? [...layers.map(() => '100% 100%'), ...base.backgroundSize.split(', ')].join(', ')
      : base.backgroundSize;
  const positions =
    layers.length && base.backgroundPosition
      ? [...layers.map(() => '0 0'), ...base.backgroundPosition.split(', ')].join(', ')
      : base.backgroundPosition;

  return {
    backgroundColor: base.backgroundColor,
    backgroundImage: layers.length
      ? [...layers, base.backgroundImage].join(', ')
      : base.backgroundImage,
    backgroundSize: sizes,
    backgroundPosition: positions,
  };
}

function composeCss(background, filter) {
  const parts = [];
  if (background.backgroundColor) parts.push(`background-color: ${background.backgroundColor};`);
  parts.push(`background-image: ${background.backgroundImage};`);
  if (background.backgroundSize) parts.push(`background-size: ${background.backgroundSize};`);
  if (background.backgroundPosition) parts.push(`background-position: ${background.backgroundPosition};`);
  if (filter) parts.push(`filter: ${filter};`);
  return parts.join(' ');
}

export default function GradientStudio({ colors, onCopyText, onNotify }) {
  const [type, setType] = useState('linear');
  const [angle, setAngle] = useState(135);
  const [scale, setScale] = useState(48);
  const [effects, setEffects] = useState({ blur: false, grain: false, glow: false, vignette: false });
  const [amounts, setAmounts] = useState({ blur: 45, grain: 45, glow: 45, vignette: 45 });
  const [imageSize, setImageSize] = useState('landscape');
  const [selected, setSelected] = useState([0, 1]);
  const dragFrom = useRef(null);

  useEffect(() => {
    setSelected((current) => {
      const valid = current.filter((index) => index < colors.length);
      if (valid.length >= 2) return valid.slice(0, colors.length);
      return [0, Math.min(1, colors.length - 1)];
    });
  }, [colors.length]);

  const hexes = selected.map((index) => colors[index]?.hex).filter(Boolean);
  // Show the selected swatches in blend order (so reordering moves the colours),
  // with any unselected palette colours trailing after them.
  const selectedSet = new Set(selected);
  const orderedIndexes = [
    ...selected,
    ...colors.map((_, index) => index).filter((index) => !selectedSet.has(index)),
  ];
  const gradient = useMemo(
    () => buildGradient(type, hexes, angle, scale),
    [type, hexes.join(','), angle, scale],
  );
  const activeEffects = EFFECTS.filter((item) => effects[item.id]).map((item) => item.id);
  const layers = effectLayers(hexes, effects, amounts);
  const blurFilter = effects.blur ? `blur(${Math.round(4 + (amounts.blur / 100) * 40)}px)` : null;
  const background = composeBackground(gradient, layers);
  const css = composeCss(background, blurFilter);
  const previewContrast = getContrastColor(
    mixHex(hexes[0] || '#111827', hexes[hexes.length - 1] || '#111827', 0.5),
  );

  const downloadImage = () => {
    const size = IMAGE_SIZES.find((item) => item.id === imageSize) || IMAGE_SIZES[0];
    const canvas = renderGradientCanvas(
      { type, hexes, angle, scale, effects, amounts },
      size.width,
      size.height,
    );
    downloadCanvasPng(canvas, `vibrance-gradient-${size.width}x${size.height}.png`);
    onNotify?.('Gradient image download started');
  };

  const toggleColor = (index) => {
    setSelected((current) => {
      if (current.includes(index)) {
        if (current.length <= 2) return current;
        return current.filter((item) => item !== index);
      }
      return [...current, index];
    });
  };

  const toggleEffect = (id) => {
    setEffects((current) => ({ ...current, [id]: !current[id] }));
  };

  const setEffectAmount = (id, value) => {
    setAmounts((current) => ({ ...current, [id]: value }));
  };

  const moveColor = (from, to) => {
    setSelected((current) => {
      if (from === to || from === null || to === null) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const useAllColors = () => {
    setSelected(colors.map((_, index) => index));
  };

  const reverseOrder = () => {
    setSelected((current) => [...current].reverse());
  };

  const shuffleOrder = () => {
    setSelected((current) => {
      const next = [...current];
      for (let index = next.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [next[index], next[swap]] = [next[swap], next[index]];
      }
      return next;
    });
  };

  const randomize = () => {
    const order = colors.map((_, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [order[index], order[swap]] = [order[swap], order[index]];
    }
    const take = Math.max(2, Math.floor(Math.random() * order.length) + 1);
    setSelected(order.slice(0, take));
    setAngle(Math.floor(Math.random() * 361));
    setScale(32 + Math.floor(Math.random() * 5) * 12);
    const picked = EFFECTS.filter(() => Math.random() < 0.45).slice(0, 2);
    setEffects({
      blur: false,
      grain: false,
      glow: false,
      vignette: false,
      ...Object.fromEntries(picked.map((item) => [item.id, true])),
    });
    setAmounts({
      blur: 25 + Math.floor(Math.random() * 6) * 10,
      grain: 25 + Math.floor(Math.random() * 6) * 10,
      glow: 25 + Math.floor(Math.random() * 6) * 10,
      vignette: 25 + Math.floor(Math.random() * 6) * 10,
    });
    setType(TYPES[Math.floor(Math.random() * TYPES.length)].id);
  };

  return (
    <section>
      <SectionHeading
        eyebrow="Gradient studio"
        title="Blend the palette into light."
        description="Pick any of your swatches — up to all eight — drag to reorder them, stack effects on top of each other, and copy production-ready CSS."
        action={
          <div className="flex gap-2">
            <IconButton label="Reverse gradient order" variant="solid" onClick={reverseOrder}>
              <ArrowLeftRight size={15} />
            </IconButton>
            <Button variant="secondary" size="md" onClick={randomize}>
              <Shuffle size={14} />
              Surprise me
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded-[1.8rem] border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-black/15 p-1 sm:grid-cols-4">
            {TYPES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setType(mode.id)}
                className={cx(
                  'flex h-8 items-center justify-center rounded-lg text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-200',
                  type === mode.id
                    ? 'bg-white text-[#0a0a0f]'
                    : 'text-white/55 hover:bg-white/[0.06] hover:text-white/70',
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {ANGLE_TYPES.has(type) ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  {type === 'radial' ? 'Light position' : 'Angle'}
                </p>
                <span className="font-mono text-xs font-semibold text-white/72">{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={(event) => setAngle(Number(event.target.value))}
                className="vibrance-range w-full"
                style={{ '--range-accent': hexes[0] }}
                aria-label="Gradient angle"
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] text-white/35">
                <span>0°</span>
                <span>180°</span>
                <span>360°</span>
              </div>
            </div>
          ) : null}

          {TILE_TYPES.has(type) ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Tile size
                </p>
                <span className="font-mono text-xs font-semibold text-white/72">{scale}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="4"
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                className="vibrance-range w-full"
                style={{ '--range-accent': hexes[0] }}
                aria-label="Pattern tile size"
              />
            </div>
          ) : null}

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Effects
              </p>
              {activeEffects.length ? (
                <span className="font-mono text-xs font-semibold text-white/72">
                  {activeEffects.length} active
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/[0.08] bg-black/15 p-1">
              {EFFECTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleEffect(item.id)}
                  aria-pressed={effects[item.id]}
                  className={cx(
                    'flex h-8 items-center justify-center rounded-lg text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-200',
                    effects[item.id]
                      ? 'bg-white text-[#0a0a0f]'
                      : 'text-white/55 hover:bg-white/[0.06] hover:text-white/70',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {activeEffects.length ? (
              <div className="mt-3 space-y-3">
                {activeEffects.map((id) => (
                  <div key={id}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                        {EFFECT_LABELS[id]} intensity
                      </span>
                      <span className="font-mono text-xs font-semibold text-white/72">
                        {amounts[id]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={amounts[id]}
                      onChange={(event) => setEffectAmount(id, Number(event.target.value))}
                      className="vibrance-range w-full"
                      style={{ '--range-accent': hexes[hexes.length - 1] }}
                      aria-label={`${EFFECT_LABELS[id]} intensity`}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Colors · {hexes.length} of {colors.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={useAllColors}
                  className="inline-flex h-10 items-center rounded-xl border border-white/[0.1] px-3 text-[11px] font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={shuffleOrder}
                  className="inline-flex h-10 items-center rounded-xl border border-white/[0.1] px-3 text-[11px] font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
                >
                  Shuffle
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {orderedIndexes.map((index) => {
                const color = colors[index];
                const order = selected.indexOf(index);
                const active = order >= 0;
                return (
                  <button
                    key={`${color.hex}-${index}`}
                    type="button"
                    draggable={active}
                    onDragStart={(event) => {
                      dragFrom.current = order;
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      if (dragFrom.current !== null) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const from = dragFrom.current;
                      dragFrom.current = null;
                      if (order < 0) return;
                      moveColor(from, order);
                    }}
                    onDragEnd={() => {
                      dragFrom.current = null;
                    }}
                    onClick={() => toggleColor(index)}
                    aria-label={
                      active
                        ? `Position ${order + 1}: ${color.hex}. Drag to reorder or click to remove.`
                        : `Add ${color.hex} to gradient`
                    }
                    title={active ? `Position ${order + 1} — drag to reorder` : 'Add to the blend'}
                    className={cx(
                      'relative h-10 w-10 rounded-xl border-2 transition-all duration-200 hover:scale-105',
                      active
                        ? 'cursor-grab border-white shadow-[0_0_0_3px_rgba(255,255,255,.12)] active:cursor-grabbing'
                        : 'border-white/10',
                    )}
                    style={{ backgroundColor: color.hex }}
                  >
                    {active ? (
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[12px] font-black"
                        style={{ color: getContrastColor(color.hex) }}
                      >
                        {order + 1}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
            <Blend size={14} className="shrink-0 text-white/45" />
            <p className="text-[11px] leading-4 text-white/50">{HINTS[type]}</p>
          </div>
        </div>

        <div className="flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/[0.08] bg-white/[0.025]">
          <div
            className="relative flex min-h-[360px] flex-1 items-end overflow-hidden p-6 sm:min-h-[440px]"
            style={{ backgroundColor: gradient.backgroundColor, color: previewContrast }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: background.backgroundColor,
                backgroundImage: background.backgroundImage,
                backgroundSize: background.backgroundSize,
                backgroundPosition: background.backgroundPosition,
                filter: blurFilter,
                transform: blurFilter ? 'scale(1.18)' : undefined,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,.28), transparent 42%), linear-gradient(to bottom, rgba(255,255,255,.08), transparent 30%)',
              }}
            />
            <div className="relative">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{
                  borderColor: withAlpha(previewContrast, 0.22),
                  backgroundColor: withAlpha(previewContrast, 0.1),
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hexes[hexes.length - 1] }} />
                {type} · {hexes.length} color{hexes.length === 1 ? '' : 's'}
                {activeEffects.length
                  ? ` · ${activeEffects.map((id) => EFFECT_LABELS[id]).join(' + ')}`
                  : ''}
              </span>
              <p className="mt-3 font-mono text-xs font-semibold opacity-70">
                {hexes[0]} → {hexes[hexes.length - 1]}
              </p>
            </div>
            {ANGLE_TYPES.has(type) ? (
              <span className="absolute right-5 top-5 font-mono text-4xl font-bold opacity-20">
                {angle}°
              </span>
            ) : null}
          </div>
          <div className="border-t border-white/[0.06] bg-[#09090e] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                CSS
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={imageSize}
                  onChange={(event) => setImageSize(event.target.value)}
                  aria-label="Image size"
                  className="h-10 rounded-xl border border-white/[0.1] bg-black/40 px-2 text-[11px] font-semibold text-white/70 outline-none transition-colors hover:border-white/25"
                >
                  {IMAGE_SIZES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} · {item.width}×{item.height}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={downloadImage}>
                  <ImageDown size={13} />
                  PNG
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onCopyText(css, 'Gradient CSS copied')}>
                  <Clipboard size={13} />
                  Copy
                </Button>
              </div>
            </div>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-[11px] leading-5 text-emerald-100/65">
              <code>{css}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
