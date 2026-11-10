import { Download, Heart, RotateCcw, Share2, Sparkles } from 'lucide-react';
import { Button, IconButton, cx } from './ui';

export default function PaletteHeader({
  palette,
  detectedMood,
  traits,
  isSaved,
  onToggleSaved,
  onUpdateMeta,
  onExport,
  onShare,
  onReset,
}) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
          <Sparkles size={11} />
          Active palette
        </div>
        <input
          value={palette.name}
          onChange={(event) => onUpdateMeta({ name: event.target.value })}
          aria-label="Palette name"
          spellCheck="false"
          className="mt-2 w-full max-w-2xl truncate border-0 bg-transparent p-0 text-3xl font-semibold tracking-[-0.055em] text-white outline-none placeholder:text-white/35 sm:text-4xl"
          placeholder="Name this palette"
        />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-1 text-[11px] font-bold text-emerald-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {detectedMood}
          </span>
          {traits.slice(0, 4).map((trait) => (
            <span
              key={trait}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/58"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          variant={isSaved ? 'primary' : 'secondary'}
          size="md"
          onClick={onToggleSaved}
          className={cx(isSaved && 'bg-rose-100 text-rose-950 hover:bg-rose-50')}
        >
          <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} />
          {isSaved ? 'Saved' : 'Save palette'}
        </Button>
        <IconButton label="Share palette link" variant="solid" onClick={onShare}>
          <Share2 size={15} />
        </IconButton>
        <Button variant="secondary" size="md" onClick={onExport}>
          <Download size={15} />
          Export
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={onReset}
          title="Start over: fresh palette, cleared filters and tuning"
        >
          <RotateCcw size={15} />
          Reset
        </Button>
      </div>
    </div>
  );
}
