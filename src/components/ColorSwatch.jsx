import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Copy, Lock, LockOpen, Pipette } from 'lucide-react';
import {
  formatColor,
  getContrastColor,
  normalizeHex,
  withAlpha,
} from '../lib/color';
import { cx } from './ui';

function HexField({ value, onCommit, contrast, className = '' }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const normalized = normalizeHex(draft);
    if (normalized) {
      onCommit(normalized);
    } else {
      setDraft(value);
    }
  };

  return (
    <input
      type="text"
      aria-label="Edit hex color"
      value={draft}
      spellCheck="false"
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      style={{
        color: contrast,
        backgroundColor: withAlpha(contrast, 0.16),
        borderColor: withAlpha(contrast, 0.32),
        fontSize: '17px',
      }}
      className={cx(
        'h-8 min-w-0 rounded-lg border px-2 font-mono text-[13px] font-bold uppercase tracking-wide outline-none backdrop-blur-sm transition-colors focus:border-current',
        className,
      )}
    />
  );
}

function PickerButton({ color, onUpdate, contrast }) {
  return (
    <label
      className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-transform duration-200 hover:scale-105"
      style={{
        color: contrast,
        backgroundColor: withAlpha(contrast, 0.16),
        borderColor: withAlpha(contrast, 0.32),
      }}
      title="Open color picker"
      onClick={(event) => event.stopPropagation()}
    >
      <Pipette size={13} />
      <input
        type="color"
        value={color.hex}
        aria-label={`Choose a custom color for swatch ${color.hex}`}
        onChange={(event) => onUpdate(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function LockButton({ color, onToggleLock, contrast }) {
  return (
    <button
      type="button"
      aria-label={color.isLocked ? 'Unlock color' : 'Lock color'}
      title={color.isLocked ? 'Unlock color' : 'Lock color'}
      onClick={(event) => {
        event.stopPropagation();
        onToggleLock();
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105"
      style={{
        color: contrast,
        backgroundColor: withAlpha(contrast, color.isLocked ? 0.26 : 0.16),
        borderColor: withAlpha(contrast, color.isLocked ? 0.48 : 0.32),
      }}
    >
      {color.isLocked ? <Lock size={13} /> : <LockOpen size={13} />}
    </button>
  );
}

function SaveButton({ isSaved, onToggleSave, contrast }) {
  return (
    <button
      type="button"
      aria-label={isSaved ? 'Remove saved swatch' : 'Save swatch'}
      title={isSaved ? 'Remove saved swatch' : 'Save swatch'}
      onClick={(event) => {
        event.stopPropagation();
        onToggleSave();
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105"
      style={{
        color: contrast,
        backgroundColor: withAlpha(contrast, isSaved ? 0.26 : 0.16),
        borderColor: withAlpha(contrast, isSaved ? 0.48 : 0.32),
      }}
    >
      {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
    </button>
  );
}

function CodeButton({ color, format, onCopy, contrast, className = '' }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onCopy();
      }}
      title="Copy color value"
      className={cx(
        'group/code inline-flex min-w-0 items-center gap-1.5 rounded-lg text-left transition-opacity hover:opacity-75',
        className,
      )}
      style={{ color: contrast }}
    >
      <span className="truncate font-mono text-[15px] font-bold tracking-wide">
        {formatColor(color, format)}
      </span>
      <Copy size={11} className="shrink-0 opacity-0 transition-opacity group-hover/code:opacity-70" />
    </button>
  );
}

function SwatchIndex({ index, contrast }) {
  return (
    <span
      className="font-mono text-[12px] font-bold tracking-[0.18em]"
      style={{ color: withAlpha(contrast, 0.8) }}
    >
      {String(index + 1).padStart(2, '0')}
    </span>
  );
}

function ColorTopBar({ color, index, contrast, onToggleLock, onToggleSave, isSaved, className = '' }) {
  return (
    <div className={cx('flex items-center justify-between gap-2', className)}>
      <SwatchIndex index={index} contrast={contrast} />
      <div className="flex items-center gap-1.5">
        <SaveButton isSaved={isSaved} onToggleSave={onToggleSave} contrast={contrast} />
        <LockButton color={color} onToggleLock={onToggleLock} contrast={contrast} />
      </div>
    </div>
  );
}

export default function ColorSwatch({
  color,
  index,
  format,
  viewMode,
  region,
  gridSpan,
  isSaved,
  onToggleLock,
  onUpdate,
  onCopy,
  onOpenShades,
  onToggleSave,
}) {
  const contrast = getContrastColor(color.hex);
  const handleOpen = () => onOpenShades(index);

  if (viewMode === 'random' && region) {
    const micro = region.w < 12 || region.h < 14;
    const compact = region.w < 24 || region.h < 26;

    return (
      <article
        onClick={handleOpen}
        className="group absolute flex cursor-pointer flex-col overflow-hidden p-2.5 text-left transition-all duration-300 ease-out hover:z-10 hover:brightness-105 sm:p-3.5"
        style={{
          left: `${region.x}%`,
          top: `${region.y}%`,
          width: `calc(${region.w}% + 0.6px)`,
          height: `calc(${region.h}% + 0.6px)`,
          backgroundColor: color.hex,
          color: contrast,
        }}
      >
        {micro ? (
          <SwatchIndex index={index} contrast={contrast} />
        ) : (
          <ColorTopBar
            color={color}
            index={index}
            contrast={contrast}
            onToggleLock={onToggleLock}
            onToggleSave={onToggleSave}
            isSaved={isSaved}
          />
        )}

        <div
          className="mt-auto"
          onClick={(event) => event.stopPropagation()}
        >
          <CodeButton color={color} format={format} onCopy={onCopy} contrast={contrast} />
          {!compact ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <HexField value={color.hex} onCommit={onUpdate} contrast={contrast} className="flex-1" />
              <PickerButton color={color} onUpdate={onUpdate} contrast={contrast} />
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  if (viewMode === 'strips') {
    return (
      <article
        onClick={handleOpen}
        className="group flex min-h-[82px] cursor-pointer items-center gap-3 overflow-hidden border-0 px-4 py-3 transition-all duration-200 hover:brightness-105 sm:gap-4 sm:px-5"
        style={{ backgroundColor: color.hex, color: contrast }}
      >
        <div className="flex shrink-0 items-center gap-3">
          <SwatchIndex index={index} contrast={contrast} />
          <span
            className="hidden h-8 w-8 rounded-full border sm:block"
            style={{ borderColor: withAlpha(contrast, 0.28), backgroundColor: withAlpha(contrast, 0.08) }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <CodeButton color={color} format={format} onCopy={onCopy} contrast={contrast} />
          <p className="mt-0.5 hidden text-[12px] font-medium opacity-80 sm:block">
            Click the swatch for its 50–900 scale
          </p>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          <HexField
            value={color.hex}
            onCommit={onUpdate}
            contrast={contrast}
            className="hidden w-[104px] sm:block"
          />
          <PickerButton color={color} onUpdate={onUpdate} contrast={contrast} />
          <SaveButton isSaved={isSaved} onToggleSave={onToggleSave} contrast={contrast} />
          <LockButton color={color} onToggleLock={onToggleLock} contrast={contrast} />
        </div>
      </article>
    );
  }

  if (viewMode === 'grid') {
    return (
      <article
        onClick={handleOpen}
        className="group relative min-h-[200px] cursor-pointer overflow-hidden p-4 transition-all duration-200 hover:brightness-105"
        style={{
          backgroundColor: color.hex,
          color: contrast,
          ...(gridSpan ? { gridColumn: `span ${gridSpan}` } : null),
        }}
      >
        <ColorTopBar
          color={color}
          index={index}
          contrast={contrast}
          onToggleLock={onToggleLock}
          onToggleSave={onToggleSave}
          isSaved={isSaved}
        />
        <div className="absolute inset-x-4 bottom-4">
          <CodeButton
            color={color}
            format={format}
            onCopy={onCopy}
            contrast={contrast}
            className="mb-2"
          />
          <div
            className="flex items-center gap-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            <HexField value={color.hex} onCommit={onUpdate} contrast={contrast} className="flex-1" />
            <PickerButton color={color} onUpdate={onUpdate} contrast={contrast} />
          </div>
        </div>
      </article>
    );
  }

  if (viewMode === 'cards') {
    return (
      <article
        onClick={handleOpen}
        className="group relative flex min-h-[280px] cursor-pointer flex-col overflow-hidden p-4 text-left transition-all duration-200 hover:brightness-105 sm:min-h-[320px]"
        style={{
          backgroundColor: color.hex,
          color: contrast,
          ...(gridSpan ? { gridColumn: `span ${gridSpan}` } : null),
        }}
      >
        <ColorTopBar
          color={color}
          index={index}
          contrast={contrast}
          onToggleLock={onToggleLock}
          onToggleSave={onToggleSave}
          isSaved={isSaved}
        />
        <div className="mt-auto" onClick={(event) => event.stopPropagation()}>
          <CodeButton color={color} format={format} onCopy={onCopy} contrast={contrast} className="mb-2" />
          <div className="flex items-center gap-1.5">
            <HexField value={color.hex} onCommit={onUpdate} contrast={contrast} className="flex-1" />
            <PickerButton color={color} onUpdate={onUpdate} contrast={contrast} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={handleOpen}
      className="group relative flex min-h-[390px] min-w-[150px] flex-1 basis-[150px] cursor-pointer flex-col overflow-hidden border border-white/[0.05] first:rounded-l-[1.6rem] last:rounded-r-[1.6rem] md:min-h-[460px]"
      style={{ backgroundColor: color.hex, color: contrast }}
    >
      <div className="p-4 sm:p-5">
        <ColorTopBar
          color={color}
          index={index}
          contrast={contrast}
          onToggleLock={onToggleLock}
          onToggleSave={onToggleSave}
          isSaved={isSaved}
        />
      </div>

      <div className="mt-auto p-3 sm:p-4">
        <div
          className="rounded-2xl border p-2.5 backdrop-blur-md"
          style={{
            backgroundColor: withAlpha(contrast, 0.16),
            borderColor: withAlpha(contrast, 0.3),
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <CodeButton
            color={color}
            format={format}
            onCopy={onCopy}
            contrast={contrast}
            className="mb-2 px-0.5"
          />
          <div className="flex items-center gap-1.5">
            <HexField value={color.hex} onCommit={onUpdate} contrast={contrast} className="flex-1" />
            <PickerButton color={color} onUpdate={onUpdate} contrast={contrast} />
          </div>
        </div>
        <p
          className="mt-2 text-center text-[12px] font-bold uppercase tracking-[0.18em] opacity-80"
        >
          Tap for shades
        </p>
      </div>
    </article>
  );
}
