import { useEffect, useMemo, useState } from 'react';
import { Dices, Plus, Sparkles, Wand2, X } from 'lucide-react';
import { buildPaletteFromSeeds, HARMONIES } from '../lib/palette';
import { getContrastColor, normalizeHex, withAlpha } from '../lib/color';
import { Button, FilterChip, Modal } from './ui';

const HARMONY_HINTS = {
  Analogous: 'Neighbors on the wheel — calm and cohesive.',
  Complementary: 'Opposites attract — bold contrast.',
  Monochromatic: 'One hue, many depths.',
  Triadic: 'Three evenly spaced hues — balanced and vivid.',
  'Split Complementary': 'A hue plus the two beside its opposite.',
  Tetradic: 'Four hues in two complementary pairs.',
  Random: 'A playful spread around your seed colors.',
};

const randomHex = () => {
  const value = Math.floor(Math.random() * 0xffffff);
  return `#${value.toString(16).padStart(6, '0').toUpperCase()}`;
};

function SeedInput({ value, index, onChange }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const normalized = normalizeHex(draft);
    if (normalized) {
      const next = normalized.toUpperCase();
      setDraft(next);
      onChange(next);
    } else {
      setDraft(value);
    }
  };

  return (
    <input
      type="text"
      value={draft}
      aria-label={`Seed color ${index + 1} hex`}
      spellCheck="false"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 font-mono text-sm font-semibold uppercase tracking-wide text-white/85 outline-none transition-colors focus:border-white/25"
    />
  );
}

export default function BuildPaletteModal({ open, onClose, onBuild, defaultSize = 5 }) {
  const [baseColors, setBaseColors] = useState(['#FF4D9D']);
  const [harmony, setHarmony] = useState('Analogous');
  const [size, setSize] = useState(defaultSize);

  useEffect(() => {
    if (open) {
      setBaseColors([randomHex()]);
      setHarmony('Analogous');
      setSize(Math.min(8, Math.max(2, defaultSize || 5)));
    }
  }, [open, defaultSize]);

  const minSize = Math.max(2, baseColors.length);

  const preview = useMemo(
    () => buildPaletteFromSeeds(baseColors, size, harmony),
    [baseColors, harmony, size],
  );

  const addSeed = () => {
    if (baseColors.length >= 8) return;
    const next = [...baseColors, randomHex()];
    setBaseColors(next);
    if (size < next.length) setSize(next.length);
  };

  const updateSeed = (index, value) => {
    setBaseColors((current) =>
      current.map((hex, seedIndex) => (seedIndex === index ? value : hex)),
    );
  };

  const removeSeed = (index) => {
    if (baseColors.length <= 1) return;
    setBaseColors((current) => current.filter((_, seedIndex) => seedIndex !== index));
  };

  const shuffleSeeds = () => {
    setBaseColors((current) => current.map(() => randomHex()));
  };

  const apply = () => {
    onBuild({ colors: preview, harmony });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Build from scratch"
      description="Start with one or more colors, choose how the rest should relate to them, and Vibrance fills in the remaining swatches."
      size="lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">
            {size} colors · {baseColors.length} seed{baseColors.length === 1 ? '' : 's'} ·{' '}
            {harmony} harmony
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="gradient" size="sm" onClick={apply} className="flex-1 sm:flex-none">
              <Sparkles size={14} />
              Use this palette
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              Seed colors
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={addSeed}
              disabled={baseColors.length >= 8}
            >
              <Plus size={14} />
              Add color
            </Button>
          </div>

          <div className="mt-2 space-y-2">
            {baseColors.map((hex, index) => (
              <div key={index} className="flex items-center gap-2">
                <label
                  className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/15 transition-transform duration-200 hover:scale-105"
                  style={{ backgroundColor: hex }}
                  title={`Pick seed color ${index + 1}`}
                >
                  <input
                    type="color"
                    value={hex}
                    aria-label={`Pick seed color ${index + 1}`}
                    onChange={(event) => updateSeed(index, event.target.value.toUpperCase())}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
                <SeedInput
                  value={hex}
                  index={index}
                  onChange={(value) => updateSeed(index, value)}
                />
                <button
                  type="button"
                  aria-label={`Remove seed color ${index + 1}`}
                  title="Remove color"
                  onClick={() => removeSeed(index)}
                  disabled={baseColors.length <= 1}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-25"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={shuffleSeeds}>
              <Dices size={14} />
              Shuffle seeds
            </Button>
            <span className="text-[11px] text-white/40">Up to 8 seeds</span>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                Palette size
              </p>
              <span className="font-mono text-xs font-bold text-white/75">{size}</span>
            </div>
            <input
              type="range"
              min={minSize}
              max="8"
              step="1"
              value={Math.max(size, minSize)}
              onChange={(event) => setSize(Number(event.target.value))}
              aria-label="Palette size"
              className="vibrance-range mt-3 w-full"
              style={{ '--range-accent': baseColors[0] }}
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
            Harmony
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {HARMONIES.map((item) => (
              <FilterChip
                key={item}
                active={harmony === item}
                onClick={() => setHarmony(item)}
              >
                {item}
              </FilterChip>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-white/50">{HARMONY_HINTS[harmony]}</p>

          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              Preview
            </p>
            <div className="mt-2 flex h-24 overflow-hidden rounded-2xl border border-white/[0.08]">
              {preview.map((color, index) => {
                const isSeed = index < baseColors.length;
                return (
                  <div
                    key={`${index}-${color.hex}`}
                    className="flex min-w-0 flex-1 items-end justify-center pb-2"
                    style={{ backgroundColor: color.hex }}
                    title={color.hex}
                  >
                    <span
                      className="font-mono text-[11px] font-bold tracking-wide"
                      style={{ color: withAlpha(getContrastColor(color.hex), 0.85) }}
                    >
                      {isSeed ? (index === 0 ? 'BASE' : 'SEED') : color.hex}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/45">
              <Wand2 size={12} />
              Seed colors stay first; the rest are generated around them.
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
