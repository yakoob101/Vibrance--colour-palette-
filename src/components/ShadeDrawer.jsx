import { Bookmark, BookmarkCheck, Check, Clipboard, Copy } from 'lucide-react';
import { getContrastColor, getShadeScale, withAlpha } from '../lib/color';
import { buildShadeExport } from '../lib/palette';
import { Button, Drawer, IconButton } from './ui';

export default function ShadeDrawer({
  open,
  color,
  format,
  isSaved,
  onClose,
  onCopyText,
  onToggleSave,
  onNotify,
}) {
  if (!color) return null;

  const shades = getShadeScale(color.hex);
  const contrast = getContrastColor(color.hex);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Shade scale"
      description="A Tailwind-ready 50–900 spectrum built with HSL lightness steps."
      width="max-w-lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              onCopyText(buildShadeExport(color.hex), 'Shade scale copied as JSON');
            }}
          >
            <Clipboard size={15} />
            Copy scale JSON
          </Button>
          <Button
            variant={isSaved ? 'primary' : 'secondary'}
            className="flex-1"
            onClick={onToggleSave}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {isSaved ? 'Remove swatch' : 'Save swatch'}
          </Button>
        </div>
      }
    >
      <div
        className="overflow-hidden rounded-[1.5rem] border border-white/10 p-5"
        style={{ backgroundColor: color.hex, color: contrast }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-45">
              Base color
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight">{color.hex}</p>
          </div>
          <IconButton
            label="Copy base color"
            variant="glass"
            size="sm"
            style={{ color: contrast }}
            onClick={() => onCopyText(color.hex, `${color.hex} copied`)}
          >
            <Copy size={14} />
          </IconButton>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2 text-[11px]">
          {[
            ['HEX', color.hex],
            ['RGB', color.rgb],
            ['HSL', color.hsl],
          ].map(([label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() => onCopyText(value, `${label} copied`)}
              className="rounded-xl border px-2.5 py-2 text-left transition-colors hover:bg-black/10"
              style={{
                borderColor: withAlpha(contrast, 0.18),
                backgroundColor: withAlpha(contrast, 0.06),
              }}
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] opacity-40">
                {label}
              </span>
              <span className="mt-1 block truncate font-mono text-[11px] font-semibold">
                {value}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] font-medium opacity-45">
          <Check size={11} />
          Auto-contrast text · {format.toUpperCase()} active
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">50 → 900</h3>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
          Click to copy
        </span>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {shades.map((shade) => {
          const shadeContrast = getContrastColor(shade.hex);
          return (
            <button
              key={shade.shade}
              type="button"
              onClick={() => onCopyText(shade.hex, `${shade.shade} · ${shade.hex} copied`)}
              className="group flex aspect-[0.9] flex-col justify-between rounded-xl border border-black/5 p-2 text-left transition-transform duration-200 hover:scale-[1.04]"
              style={{ backgroundColor: shade.hex, color: shadeContrast }}
            >
              <span className="text-[11px] font-bold tracking-wide opacity-55">{shade.shade}</span>
              <span className="font-mono text-[11px] font-semibold leading-tight opacity-80">
                {shade.hex}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
          How it works
        </p>
        <p className="mt-2 text-xs leading-5 text-white/60">
          The scale keeps the hue of your swatch and steps lightness from 97% down to 23%,
          with a gentle saturation falloff at the light end. Drop the values into any
          Tailwind theme, design token file, or CSS variable set.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {shades.map((shade) => (
            <span
              key={shade.shade}
              className="h-4 w-4 rounded-[4px] border border-white/10"
              style={{ backgroundColor: shade.hex }}
              title={`${shade.shade}: ${shade.hex}`}
            />
          ))}
        </div>
      </div>
      {onNotify ? (
        <div className="mt-4 text-center text-[11px] text-white/35">
          Tip: every shade copies instantly to your clipboard.
        </div>
      ) : null}
    </Drawer>
  );
}
