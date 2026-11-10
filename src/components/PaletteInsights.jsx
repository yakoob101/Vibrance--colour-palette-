import {
  Activity,
  Contrast,
  Flame,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  Waves,
} from 'lucide-react';
import { getPaletteMetrics, withAlpha } from '../lib/color';
import { Button } from './ui';

const SLIDERS = [
  {
    key: 'contrast',
    label: 'Contrast',
    icon: Contrast,
    hint: 'Pushes lights and darks apart.',
  },
  {
    key: 'hueSpread',
    label: 'Hue spread',
    icon: Waves,
    hint: 'Widens or tightens the hue range.',
  },
  {
    key: 'saturation',
    label: 'Saturation',
    icon: Sparkles,
    hint: 'Boosts or mutes color intensity.',
  },
  {
    key: 'lightness',
    label: 'Lightness',
    icon: Sun,
    hint: 'Shifts the whole palette brighter or darker.',
  },
  {
    key: 'warmth',
    label: 'Warmth',
    icon: Flame,
    hint: 'Bends hues toward warm or cool.',
  },
  {
    key: 'variation',
    label: 'Variation',
    icon: Activity,
    hint: 'Adds separation between neighboring colors.',
  },
];

function TuningSlider({ slider, value, onChange, accent }) {
  const Icon = slider.icon;
  const neutral = value === 50;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
          <Icon size={11} />
          {slider.label}
        </span>
        <span
          className={
            neutral
              ? 'font-mono text-[11px] font-semibold text-white/35'
              : 'font-mono text-[11px] font-semibold text-white/80'
          }
        >
          {neutral ? 'Neutral' : value}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => onChange(slider.key, Number(event.target.value))}
        aria-label={`${slider.label} tuning`}
        className="vibrance-range mt-2.5 w-full"
        style={{ '--range-accent': accent }}
      />
      <p className="mt-1.5 text-[10px] leading-4 text-white/35">{slider.hint}</p>
    </div>
  );
}

export default function PaletteInsights({
  colors,
  mood,
  traits,
  tuning,
  onTuningChange,
  onResetTuning,
}) {
  const metrics = getPaletteMetrics(colors);
  const accent = colors[1]?.hex || colors[0]?.hex || '#ff4d9d';
  const tuned = SLIDERS.some((slider) => tuning[slider.key] !== 50);

  return (
    <div className="rounded-[1.8rem] border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10"
              style={{ backgroundColor: withAlpha(accent, 0.12), color: accent }}
            >
              <Activity size={14} />
            </span>
            Palette intelligence
          </p>
          <p className="mt-2 text-xs text-white/55">
            Tune the live palette with sliders. Locked colors stay fixed.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onResetTuning}
          disabled={!tuned}
          title="Reset all tuning sliders"
        >
          <RotateCcw size={13} />
          Reset
        </Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SLIDERS.map((slider) => (
          <TuningSlider
            key={slider.key}
            slider={slider}
            value={tuning[slider.key]}
            onChange={onTuningChange}
            accent={accent}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Palette size={12} className="text-white/45" />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
            Detected traits
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold text-white/70">
            {mood}
          </span>
          {traits.length ? (
            traits.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-white/52"
              >
                {trait}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-white/40">No strong design signal</span>
          )}
        </div>
        <span className="font-mono text-[11px] font-semibold text-white/40">
          {metrics.contrastRatio.toFixed(1)}:1 · {Math.round(metrics.hueSpread)}°
        </span>
      </div>
    </div>
  );
}
