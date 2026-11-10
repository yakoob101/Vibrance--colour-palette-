import { useMemo, useState } from 'react';
import { BookmarkCheck, Copy, Plus, Search, SwatchBook, Trash2 } from 'lucide-react';
import { getContrastColor } from '../lib/color';
import { Button, Drawer, EmptyState, IconButton } from './ui';

export default function SwatchesDrawer({
  open,
  onClose,
  swatches,
  onRemove,
  onAddToPalette,
  onCopyText,
  paletteSize,
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return swatches
      .filter((swatch) => !search || swatch.hex.toLowerCase().includes(search))
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  }, [query, swatches]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Saved swatches"
      description={`${swatches.length} pinned color${swatches.length === 1 ? '' : 's'} · click any value to copy`}
      width="max-w-lg"
    >
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by hex…"
          aria-label="Search saved swatches"
          className="h-10 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] pl-9 pr-3 font-mono text-xs text-white/75 outline-none placeholder:font-sans placeholder:text-white/40 focus:border-white/25"
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {filtered.length ? (
          filtered.map((swatch) => {
            const contrast = getContrastColor(swatch.hex);
            const canAdd = paletteSize < 8;
            return (
              <article
                key={swatch.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]"
              >
                <button
                  type="button"
                  onClick={() => onCopyText(swatch.hex, `${swatch.hex} copied`)}
                  className="group relative flex h-24 w-full flex-col justify-between p-3 text-left"
                  style={{ backgroundColor: swatch.hex, color: contrast }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-45">
                    Pinned
                  </span>
                  <span className="font-mono text-sm font-bold">{swatch.hex}</span>
                  <Copy
                    size={12}
                    className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-55"
                  />
                </button>
                <div className="flex items-center justify-between p-2">
                  <span className="font-mono text-[11px] text-white/40">{swatch.hsl}</span>
                  <div className="flex items-center gap-0.5">
                    <IconButton
                      label={canAdd ? `Add ${swatch.hex} to palette` : 'Palette is full'}
                      size="sm"
                      disabled={!canAdd}
                      onClick={() => onAddToPalette(swatch)}
                    >
                      <Plus size={12} />
                    </IconButton>
                    <IconButton
                      label={`Remove ${swatch.hex}`}
                      size="sm"
                      variant="danger"
                      onClick={() => onRemove(swatch)}
                    >
                      <Trash2 size={12} />
                    </IconButton>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-2">
            <EmptyState
              icon={<SwatchBook size={22} />}
              title={swatches.length ? 'No swatches match' : 'No pinned swatches yet'}
              description={
                swatches.length
                  ? 'Try a different hex value.'
                  : 'Use the bookmark button on any color swatch to pin it here for quick access.'
              }
              action={
                swatches.length ? (
                  <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                ) : null
              }
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[11px] leading-5 text-white/45">
        <BookmarkCheck size={14} className="mt-0.5 shrink-0" />
        Saved swatches persist in localStorage under <span className="font-mono text-white/60">vibrance_swatches</span>.
        Add any swatch back into the active palette with the plus control.
      </div>
    </Drawer>
  );
}
