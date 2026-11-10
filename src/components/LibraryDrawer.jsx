import { useMemo, useState } from 'react';
import { ArrowUpRight, Calendar, Copy, FolderHeart, Search, Tag, Trash2 } from 'lucide-react';
import { matchesSavedFilter } from '../lib/palette';
import { getContrastColor } from '../lib/color';
import { Button, Drawer, EmptyState, FilterChip, IconButton, cx } from './ui';

function formatDate(timestamp) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return '';
  }
}

export default function LibraryDrawer({
  open,
  onClose,
  savedPalettes,
  activePaletteId,
  onLoad,
  onRemove,
  onCopyText,
  onShare,
}) {
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState('All');
  const [tag, setTag] = useState('All');

  const moods = useMemo(
    () => ['All', ...new Set(savedPalettes.map((palette) => palette.mood).filter(Boolean))],
    [savedPalettes],
  );
  const tags = useMemo(
    () => ['All', ...new Set(savedPalettes.flatMap((palette) => palette.tags || []))].slice(0, 18),
    [savedPalettes],
  );

  const filtered = useMemo(
    () =>
      savedPalettes
        .filter((palette) => matchesSavedFilter(palette, { query, mood, tag }))
        .sort((a, b) => b.createdAt - a.createdAt),
    [mood, query, savedPalettes, tag],
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Palette library"
      description={`${savedPalettes.length} saved palette${savedPalettes.length === 1 ? '' : 's'} · stored on this device`}
      width="max-w-xl"
    >
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, tag, or hex…"
          aria-label="Search saved palettes"
          className="h-10 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] pl-9 pr-3 text-xs text-white/75 outline-none placeholder:text-white/40 focus:border-white/25"
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
          Mood
        </p>
        <div className="flex flex-wrap gap-1.5">
          {moods.map((item) => (
            <FilterChip key={item} active={mood === item} onClick={() => setMood(item)}>
              {item}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
          <Tag size={10} />
          Collections & tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((item) => (
            <FilterChip key={item} active={tag === item} onClick={() => setTag(item)}>
              {item === 'All' ? 'All collections' : item}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length ? (
          filtered.map((palette) => {
            const isActive = palette.id === activePaletteId;
            return (
              <article
                key={palette.id}
                className={cx(
                  'overflow-hidden rounded-2xl border transition-colors',
                  isActive
                    ? 'border-white/25 bg-white/[0.055]'
                    : 'border-white/[0.08] bg-white/[0.025] hover:border-white/15',
                )}
              >
                <div className="flex h-14">
                  {palette.colors.map((color, index) => (
                    <button
                      key={`${palette.id}-${color.hex}-${index}`}
                      type="button"
                      onClick={() => onCopyText(color.hex, `${color.hex} copied`)}
                      className="group relative flex-1 transition-opacity hover:opacity-80"
                      style={{ backgroundColor: color.hex }}
                      title={`Copy ${color.hex}`}
                    >
                      <Copy
                        size={11}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-60"
                        style={{ color: getContrastColor(color.hex) }}
                      />
                    </button>
                  ))}
                </div>
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">{palette.name}</h3>
                        {isActive ? (
                          <span className="shrink-0 rounded-full bg-emerald-300/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200/70">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-semibold text-white/60">
                          {palette.mood || 'Unclassified'}
                        </span>
                        {(palette.tags || []).slice(0, 4).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[11px] text-white/45"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton
                        label={`Copy share link for ${palette.name}`}
                        size="sm"
                        onClick={() => onShare(palette)}
                      >
                        <Copy size={13} />
                      </IconButton>
                      <IconButton
                        label={`Remove ${palette.name}`}
                        size="sm"
                        variant="danger"
                        onClick={() => onRemove(palette)}
                      >
                        <Trash2 size={13} />
                      </IconButton>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-white/40">
                      <Calendar size={10} />
                      {formatDate(palette.createdAt)}
                    </span>
                    <Button
                      variant={isActive ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => onLoad(palette)}
                    >
                      {isActive ? 'Reload' : 'Open palette'}
                      <ArrowUpRight size={12} />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            icon={<FolderHeart size={22} />}
            title={savedPalettes.length ? 'No palettes match' : 'Your library is waiting'}
            description={
              savedPalettes.length
                ? 'Try a different mood, collection, or search term.'
                : 'Save a palette from the studio and it will appear here, ready for your next project.'
            }
            action={
              savedPalettes.length ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setMood('All');
                    setTag('All');
                  }}
                >
                  Clear filters
                </Button>
              ) : null
            }
          />
        )}
      </div>
    </Drawer>
  );
}
