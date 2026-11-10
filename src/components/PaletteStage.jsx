import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Columns3, Grid2X2, LayoutGrid, Rows3, Shuffle } from 'lucide-react';
import ColorSwatch from './ColorSwatch';
import { cx } from './ui';

export const VIEW_MODES = [
  { id: 'columns', label: 'Columns', icon: Columns3 },
  { id: 'strips', label: 'Strips', icon: Rows3 },
  { id: 'grid', label: 'Grid', icon: Grid2X2 },
  { id: 'cards', label: 'Cards', icon: LayoutGrid },
  { id: 'random', label: 'Random', icon: Shuffle },
];

const MIN_GRID_CELL = 170;

/**
 * Pick a column count that tiles the palette evenly: prefer a divisor of the
 * color count so every row is full and all cells are the same size. When the
 * count is prime (no usable divisor) fall back to the widest fit and spread
 * the final row's items across the leftover columns.
 */
function computeGridLayout(width, count) {
  if (!count) return { columns: 1, spans: [] };
  const measured = Math.max(1, Math.floor(width / MIN_GRID_CELL));

  if (count <= measured) {
    return { columns: count, spans: Array(count).fill(1) };
  }

  let columns = 1;
  for (let divisor = measured; divisor >= 2; divisor -= 1) {
    if (count % divisor === 0) {
      columns = divisor;
      break;
    }
  }

  const spans = Array(count).fill(1);
  if (columns === 1) {
    columns = measured;
    const lastCount = count % columns;
    if (lastCount > 0) {
      const base = Math.floor(columns / lastCount);
      const remainder = columns % lastCount;
      const start = count - lastCount;
      for (let offset = 0; offset < lastCount; offset += 1) {
        spans[start + offset] = base + (offset < remainder ? 1 : 0);
      }
    }
  }

  return { columns, spans };
}

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

/**
 * Recursively splits the box into `count` rectangles that tile it exactly.
 * Every region gets a random position and size, but the union always fills
 * the whole container with no gaps.
 */
export function buildRandomLayout(count) {
  const total = Math.max(2, Math.min(8, count));

  const split = (region, parts) => {
    if (parts <= 1) return [region];

    const canSplitX = region.w > 11;
    const canSplitY = region.h > 11;
    let splitX;
    if (canSplitX && canSplitY) {
      splitX = region.w >= region.h ? Math.random() < 0.72 : Math.random() < 0.28;
    } else {
      splitX = canSplitX;
    }

    const ratio = 0.32 + Math.random() * 0.36;
    const firstParts = Math.min(parts - 1, Math.max(1, Math.round(parts * ratio)));
    const secondParts = parts - firstParts;

    if (splitX) {
      const firstWidth = region.w * ratio;
      return [
        ...split({ x: region.x, y: region.y, w: firstWidth, h: region.h }, firstParts),
        ...split(
          { x: region.x + firstWidth, y: region.y, w: region.w - firstWidth, h: region.h },
          secondParts,
        ),
      ];
    }

    const firstHeight = region.h * ratio;
    return [
      ...split({ x: region.x, y: region.y, w: region.w, h: firstHeight }, firstParts),
      ...split(
        { x: region.x, y: region.y + firstHeight, w: region.w, h: region.h - firstHeight },
        secondParts,
      ),
    ];
  };

  return shuffleArray(split({ x: 0, y: 0, w: 100, h: 100 }, total));
}

export default function PaletteStage({
  colors,
  viewMode,
  onViewModeChange,
  format,
  savedSwatchHexes,
  onToggleLock,
  onUpdateColor,
  onCopyColor,
  onOpenShades,
  onToggleSaveSwatch,
  onNotify,
}) {
  const selectorRef = useRef(null);
  const canvasRef = useRef(null);
  const cooldownRef = useRef(false);
  const [gridLayout, setGridLayout] = useState(null);
  const [randomLayout, setRandomLayout] = useState(() => buildRandomLayout(colors.length));

  // Size Grid/Cards columns from the live container width so the palette tiles
  // the available space evenly instead of leaving a partial row.
  useLayoutEffect(() => {
    const node = canvasRef.current;
    if (!node || (viewMode !== 'grid' && viewMode !== 'cards')) return undefined;

    const measure = () => setGridLayout(computeGridLayout(node.clientWidth, colors.length));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [colors.length, viewMode]);

  const shuffleLayout = useCallback(() => {
    setRandomLayout(buildRandomLayout(colors.length));
  }, [colors.length]);

  useEffect(() => {
    if (viewMode === 'random') {
      setRandomLayout(buildRandomLayout(colors.length));
    }
  }, [colors.length, viewMode]);

  const handleModeClick = useCallback(
    (mode) => {
      if (mode === 'random' && viewMode === 'random') {
        shuffleLayout();
        return;
      }
      onViewModeChange(mode);
    },
    [onViewModeChange, shuffleLayout, viewMode],
  );

  const cycleView = useCallback(
    (direction) => {
      const currentIndex = VIEW_MODES.findIndex((mode) => mode.id === viewMode);
      const nextIndex = (currentIndex + direction + VIEW_MODES.length) % VIEW_MODES.length;
      const nextMode = VIEW_MODES[nextIndex];
      onViewModeChange(nextMode.id);
      onNotify?.(`Presentation: ${nextMode.label}`, 'info');
    },
    [onNotify, onViewModeChange, viewMode],
  );

  useEffect(() => {
    const node = selectorRef.current;
    if (!node) return undefined;

    const handleWheel = (event) => {
      if (Math.abs(event.deltaY) < 6) return;
      event.preventDefault();
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      cycleView(event.deltaY > 0 ? 1 : -1);
      window.setTimeout(() => {
        cooldownRef.current = false;
      }, 650);
    };

    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => node.removeEventListener('wheel', handleWheel);
  }, [cycleView]);

  const canvasClass = {
    columns:
      'flex w-full overflow-x-auto overflow-y-hidden rounded-[1.7rem] border border-white/[0.06] bg-white/[0.025] p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    strips:
      'flex flex-col overflow-hidden rounded-[1.7rem] border border-white/[0.06] bg-white/[0.025]',
    grid:
      'grid min-h-[470px] auto-rows-fr overflow-hidden rounded-[1.7rem] border border-white/[0.06] bg-white/[0.025]',
    cards:
      'grid min-h-[470px] auto-rows-fr overflow-hidden rounded-[1.7rem] border border-white/[0.06] bg-white/[0.025]',
    random:
      'relative h-[460px] w-full overflow-hidden rounded-[1.7rem] border border-white/[0.06] bg-white/[0.025] sm:h-[540px]',
  };

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
            Presentation
          </span>
          <div
            ref={selectorRef}
            className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.035] p-1"
            title="Scroll here to switch presentation"
          >
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              const active = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleModeClick(mode.id)}
                  aria-label={
                    mode.id === 'random' && viewMode === 'random'
                      ? 'Shuffle random layout'
                      : `Switch to ${mode.label} view`
                  }
                  title={mode.label}
                  className={cx(
                    'flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold transition-all duration-200',
                    active
                      ? 'bg-white text-[#0a0a0f] shadow-sm'
                      : 'text-white/60 hover:bg-white/[0.06] hover:text-white',
                  )}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'random' ? (
            <button
              type="button"
              onClick={shuffleLayout}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.05] px-2.5 text-[11px] font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              <Shuffle size={12} />
              Shuffle layout
            </button>
          ) : null}
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
            Scroll over the mode tabs to switch views
          </p>
        </div>
      </div>

      <div>
        <div
          ref={canvasRef}
          className={canvasClass[viewMode]}
          style={
            viewMode === 'grid' || viewMode === 'cards'
              ? {
                  gridTemplateColumns: `repeat(${
                    gridLayout?.columns || Math.min(colors.length, 6)
                  }, minmax(0, 1fr))`,
                }
              : undefined
          }
        >
          {colors.map((color, index) => (
            <ColorSwatch
              key={`${index}-${color.hex}`}
              color={color}
              index={index}
              format={format}
              viewMode={viewMode}
              region={viewMode === 'random' ? randomLayout[index] : undefined}
              gridSpan={gridLayout?.spans[index] > 1 ? gridLayout.spans[index] : undefined}
              isSaved={savedSwatchHexes.has(color.hex)}
              onToggleLock={() => onToggleLock(index)}
              onUpdate={(hex) => onUpdateColor(index, hex)}
              onCopy={() => onCopyColor(color)}
              onOpenShades={onOpenShades}
              onToggleSave={() => onToggleSaveSwatch(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
