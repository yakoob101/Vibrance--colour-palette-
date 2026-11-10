import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { DESIGN_ELEMENTS, MOODS } from '../lib/palette';
import { getContrastColor, withAlpha } from '../lib/color';
import { Button, FilterChip, IconButton, cx } from './ui';

const FORMATS = ['HEX', 'RGB', 'HSL', 'HSV'];

export default function PaletteToolbar({
  onGenerate,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  historyIndex,
  historyCount,
  size,
  onSizeChange,
  format,
  onFormatChange,
  filters,
  onFiltersChange,
  onOpenBuild,
  accentColor = '#ff4d9d',
  paletteColors = [],
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef(null);
  const hasFilters = Boolean(filters.mood || filters.design);
  const filterLabel = hasFilters
    ? [filters.mood, filters.design].filter(Boolean).join(' · ')
    : 'Style filters';

  const swatches = paletteColors.length ? paletteColors : [accentColor];
  const generateText = getContrastColor(swatches[0]);
  const generateGradient = `linear-gradient(110deg, ${swatches
    .map((hex, index) => {
      const stop = swatches.length === 1 ? 100 : Math.round((index / (swatches.length - 1)) * 100);
      return `${hex} ${stop}%`;
    })
    .join(', ')})`;

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const handlePointerDown = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFiltersOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filtersOpen]);

  const updateFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: filters[key] === value ? '' : value,
    });
  };

  return (
    <div
      className={cx(
        'relative z-30 rounded-[1.6rem] border border-white/[0.08] bg-white/[0.035] p-2.5 shadow-[0_20px_60px_-35px_rgba(0,0,0,.8)] backdrop-blur-xl',
        filtersOpen && 'z-40',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="gradient"
          size="lg"
          onClick={onGenerate}
          className="group px-4 sm:px-5"
          style={{ backgroundImage: generateGradient, color: generateText }}
        >
          <Sparkles size={16} className="transition-transform duration-300 group-hover:rotate-12" />
          <span>Generate new palette</span>
          <kbd
            className="rounded-md border px-1.5 py-0.5 font-sans text-[11px] font-semibold"
            style={{
              borderColor: withAlpha(generateText, 0.28),
              backgroundColor: withAlpha(generateText, 0.14),
              color: withAlpha(generateText, 0.82),
            }}
          >
            Space
          </kbd>
        </Button>

        <div className="flex items-center rounded-xl border border-white/[0.08] bg-black/15 p-1">
          <IconButton
            label="Previous palette"
            size="sm"
            onClick={onPrevious}
            disabled={!canGoPrevious}
          >
            <ChevronLeft size={15} />
          </IconButton>
          <span className="min-w-[48px] text-center font-mono text-[11px] font-semibold text-white/50">
            {historyIndex + 1} / {historyCount}
          </span>
          <IconButton label="Next palette" size="sm" onClick={onNext} disabled={!canGoNext}>
            <ChevronRight size={15} />
          </IconButton>
        </div>

        <div className="flex h-10 min-w-[190px] flex-1 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/15 px-3 sm:max-w-[260px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
            Colors
          </span>
          <input
            type="range"
            min="2"
            max="8"
            step="1"
            value={size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            aria-label="Palette size"
            className="vibrance-range min-w-0 flex-1"
            style={{ '--range-accent': accentColor }}
          />
          <span className="w-4 text-right font-mono text-xs font-bold text-white/75">{size}</span>
        </div>

        <div className="flex items-center rounded-xl border border-white/[0.08] bg-black/15 p-1">
          {FORMATS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onFormatChange(item)}
              className={cx(
                'h-8 rounded-lg px-2 text-[11px] font-bold tracking-wide transition-all duration-200',
                format === item
                  ? 'bg-white text-[#0a0a0f]'
                  : 'text-white/52 hover:bg-white/[0.06] hover:text-white/75',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-2.5">
        <div className="relative" ref={filterRef}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className={cx('max-w-[230px]', filtersOpen && 'border-white/25 bg-white/[0.1]')}
          >
            <SlidersHorizontal size={14} />
            <span className="truncate">{filterLabel}</span>
            {hasFilters ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
            ) : null}
          </Button>

          {filtersOpen ? (
            <div className="absolute left-0 top-[calc(100%+10px)] z-40 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#14141b]/98 p-4 shadow-[0_30px_90px_-20px_rgba(0,0,0,.95)] backdrop-blur-2xl animate-pop-in">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">Style engine</p>
                  <p className="mt-1 text-xs leading-4 text-white/52">
                    Mood and element shape the next generated palette.
                  </p>
                </div>
                <IconButton label="Close filters" size="sm" onClick={() => setFiltersOpen(false)}>
                  <X size={14} />
                </IconButton>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Mood
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((mood) => (
                    <FilterChip
                      key={mood}
                      active={filters.mood === mood}
                      onClick={() => updateFilter('mood', mood)}
                    >
                      {mood}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Design element
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DESIGN_ELEMENTS.map((element) => (
                    <FilterChip
                      key={element}
                      active={filters.design === element}
                      onClick={() => updateFilter('design', element)}
                    >
                      {element}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setFiltersOpen(false);
                    onGenerate();
                  }}
                >
                  <Sparkles size={13} />
                  Generate with style
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange({ mood: '', design: '' })}
                  disabled={!hasFilters}
                >
                  <RotateCcw size={13} />
                  Reset
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={onOpenBuild}
          className="border-dashed border-white/15"
        >
          <Wand2 size={14} />
          <span>Build from scratch</span>
        </Button>

        <p className="hidden items-center gap-1.5 text-[11px] font-medium text-white/40 sm:flex">
          Start with one color and fill the rest of the palette.
        </p>
      </div>
    </div>
  );
}
