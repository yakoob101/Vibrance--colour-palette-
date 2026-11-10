import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Sparkles } from 'lucide-react';
import Header from './components/Header';
import PaletteToolbar from './components/PaletteToolbar';
import PaletteHeader from './components/PaletteHeader';
import PaletteStage from './components/PaletteStage';
import PaletteInsights from './components/PaletteInsights';
import GradientStudio from './components/GradientStudio';
import ImageExtractor from './components/ImageExtractor';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import BuildPaletteModal from './components/BuildPaletteModal';
import LibraryDrawer from './components/LibraryDrawer';
import SwatchesDrawer from './components/SwatchesDrawer';
import ShadeDrawer from './components/ShadeDrawer';
import { ToastViewport } from './components/ui';
import { usePaletteHistory } from './hooks/usePaletteHistory';
import { useToast } from './hooks/useToast';
import {
  applyTuning,
  createId,
  createPaletteSnapshot,
  DEFAULT_TUNING,
  generatePalette,
  generatePaletteName,
  MOODS,
  buildShareUrl,
  readPaletteFromUrl,
} from './lib/palette';
import {
  detectMood,
  formatColor,
  getDesignTraits,
  makeColor,
} from './lib/color';
import { copyToClipboard, readStorage, STORAGE_KEYS, writeStorage } from './lib/storage';

/** Every generated palette always holds the full set; the slider only changes how many are shown. */
const FULL_PALETTE_SIZE = 8;

function createInitialWorkspace() {
  const sharedColors = readPaletteFromUrl();
  if (sharedColors?.length) {
    const mood = detectMood(sharedColors);
    return createPaletteSnapshot(sharedColors, {
      name: 'Shared palette',
      tags: ['Shared', mood],
      mood,
    });
  }

  const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)];
  const colors = generatePalette(FULL_PALETTE_SIZE, { mood: randomMood });
  const mood = detectMood(colors);
  return createPaletteSnapshot(colors, {
    tags: [mood, 'Fresh'],
    mood,
  });
}

function AmbientBackground({ colors }) {
  const first = colors[0]?.hex || '#ff4d9d';
  const second = colors[1]?.hex || '#7c6cff';
  const third = colors[2]?.hex || '#ff7a59';

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-[18%] -top-[28%] h-[620px] w-[620px] rounded-full opacity-[0.17] blur-[150px] transition-colors duration-700"
        style={{ backgroundColor: first }}
      />
      <div
        className="absolute -right-[16%] top-[18%] h-[540px] w-[540px] rounded-full opacity-[0.12] blur-[150px] transition-colors duration-700"
        style={{ backgroundColor: second }}
      />
      <div
        className="absolute bottom-[-28%] left-[34%] h-[520px] w-[520px] rounded-full opacity-[0.1] blur-[160px] transition-colors duration-700"
        style={{ backgroundColor: third }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.05),transparent_38%)]" />
    </div>
  );
}

function StudioView({
  palette,
  colors,
  detectedMood,
  traits,
  format,
  viewMode,
  filters,
  tuning,
  savedSwatchHexes,
  isSaved,
  history,
  onGenerate,
  onPrevious,
  onNext,
  onSizeChange,
  onFormatChange,
  onFiltersChange,
  onTuningChange,
  onResetTuning,
  onOpenBuild,
  onViewModeChange,
  onToggleLock,
  onUpdateColor,
  onCopyColor,
  onOpenShades,
  onToggleSaveSwatch,
  onToggleSaved,
  onUpdateMeta,
  onExport,
  onShare,
  onReset,
  onNotify,
}) {
  return (
    <div className="space-y-5">
      <PaletteHeader
        palette={palette}
        detectedMood={detectedMood}
        traits={traits}
        isSaved={isSaved}
        onToggleSaved={onToggleSaved}
        onUpdateMeta={onUpdateMeta}
        onExport={onExport}
        onShare={() => onShare(palette)}
        onReset={onReset}
      />

      <PaletteToolbar
        onGenerate={onGenerate}
        onPrevious={onPrevious}
        onNext={onNext}
        canGoPrevious={history.canGoPrevious}
        canGoNext={history.canGoNext}
        historyIndex={history.index}
        historyCount={history.entries.length}
        size={colors.length}
        onSizeChange={onSizeChange}
        format={format}
        onFormatChange={onFormatChange}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onOpenBuild={onOpenBuild}
        accentColor={colors[1]?.hex || colors[0]?.hex}
        paletteColors={colors.map((color) => color.hex)}
      />

      <PaletteStage
        colors={colors}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        format={format}
        savedSwatchHexes={savedSwatchHexes}
        onToggleLock={onToggleLock}
        onUpdateColor={onUpdateColor}
        onCopyColor={onCopyColor}
        onOpenShades={onOpenShades}
        onToggleSaveSwatch={onToggleSaveSwatch}
        onNotify={onNotify}
      />

      <PaletteInsights
        colors={colors}
        mood={detectedMood}
        traits={traits}
        tuning={tuning}
        onTuningChange={onTuningChange}
        onResetTuning={onResetTuning}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] font-medium text-white/45">
          <Keyboard size={13} />
          <span>
            Press <span className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-white/70">Space</span> anywhere outside a field to regenerate.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-white/40">
          <Sparkles size={12} />
          Locked colors survive every generation.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [initialSnapshot] = useState(createInitialWorkspace);
  const history = usePaletteHistory(initialSnapshot);
  const palette = history.current;

  const [tuning, setTuning] = useState(DEFAULT_TUNING);
  const [visibleCount, setVisibleCount] = useState(FULL_PALETTE_SIZE);
  const colors = useMemo(
    () => applyTuning(palette.colors.slice(0, visibleCount), tuning),
    [palette.colors, visibleCount, tuning],
  );

  const [activeTab, setActiveTab] = useState('studio');
  const [format, setFormat] = useState('HEX');
  const [viewMode, setViewMode] = useState('columns');
  const [filters, setFilters] = useState({ mood: '', design: '' });
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [swatchesOpen, setSwatchesOpen] = useState(false);
  const [shadeIndex, setShadeIndex] = useState(null);

  const [savedPalettes, setSavedPalettes] = useState(() => {
    const stored = readStorage(STORAGE_KEYS.palettes, []);
    return Array.isArray(stored) ? stored : [];
  });
  const [savedSwatches, setSavedSwatches] = useState(() => {
    const stored = readStorage(STORAGE_KEYS.swatches, []);
    return Array.isArray(stored) ? stored : [];
  });

  const { toasts, toast, dismissToast } = useToast();

  const detectedMood = useMemo(() => detectMood(colors), [colors]);
  const traits = useMemo(() => getDesignTraits(colors), [colors]);
  const savedSwatchHexes = useMemo(
    () => new Set(savedSwatches.map((swatch) => swatch.hex)),
    [savedSwatches],
  );
  const isActiveSaved = savedPalettes.some((item) => item.id === palette.id);
  const shadeColor = shadeIndex !== null ? colors[shadeIndex] : null;
  const anyOverlayOpen =
    exportOpen ||
    importOpen ||
    buildOpen ||
    libraryOpen ||
    swatchesOpen ||
    Boolean(shadeColor);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.palettes, savedPalettes);
  }, [savedPalettes]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.swatches, savedSwatches);
  }, [savedSwatches]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set(
      'palette',
      palette.colors.map((color) => color.hex.slice(1).toLowerCase()).join('-'),
    );
    window.history.replaceState({}, '', url);
  }, [palette.colors]);

  const copyText = useCallback(
    async (text, message = 'Copied to clipboard') => {
      const success = await copyToClipboard(text);
      toast(success ? message : 'Clipboard access is unavailable in this browser.', success ? 'success' : 'error');
      return success;
    },
    [toast],
  );

  const copyColor = useCallback(
    (color) => {
      copyText(formatColor(color, format), `${format} copied · ${color.hex}`);
    },
    [copyText, format],
  );

  const generateNew = useCallback(() => {
    if (palette.colors.every((color) => color.isLocked)) {
      toast('Every color is locked. Unlock one to generate a fresh palette.', 'info');
      return;
    }

    const nextColors = generatePalette(FULL_PALETTE_SIZE, filters, palette.colors);
    const mood = detectMood(nextColors);
    const tagSet = new Set([mood, 'Fresh']);
    if (filters.mood && filters.mood !== mood) tagSet.add(filters.mood);
    if (filters.design) tagSet.add(filters.design);

    history.push(
      createPaletteSnapshot(nextColors, {
        name: generatePaletteName(mood),
        tags: [...tagSet],
        mood,
      }),
    );
  }, [palette.colors, filters, history, toast]);

  const resetStudio = useCallback(() => {
    const nextColors = generatePalette(FULL_PALETTE_SIZE, {});
    const mood = detectMood(nextColors);
    history.push(
      createPaletteSnapshot(nextColors, {
        name: generatePaletteName(mood),
        tags: [mood, 'Fresh'],
        mood,
      }),
    );
    setFilters({ mood: '', design: '' });
    setTuning(DEFAULT_TUNING);
    setVisibleCount(FULL_PALETTE_SIZE);
    setViewMode('columns');
    setFormat('HEX');
  }, [history]);

  const goPrevious = useCallback(() => {
    if (history.canGoPrevious) history.navigate(history.index - 1);
  }, [history]);

  const goNext = useCallback(() => {
    if (history.canGoNext) history.navigate(history.index + 1);
  }, [history]);

  const handleToggleLock = useCallback(
    (index) => {
      const nextColors = palette.colors.map((color, colorIndex) =>
        colorIndex === index ? { ...color, isLocked: !color.isLocked } : color,
      );
      history.updateColors(nextColors);
      toast(nextColors[index].isLocked ? 'Color locked' : 'Color unlocked', 'info');
    },
    [palette.colors, history, toast],
  );

  const handleUpdateColor = useCallback(
    (index, hex) => {
      const nextColors = palette.colors.map((color, colorIndex) =>
        colorIndex === index ? makeColor(hex, true) : color,
      );
      history.updateColors(nextColors);
      toast(`${hex.toUpperCase()} applied and locked`);
    },
    [palette.colors, history, toast],
  );

  const handleTuningChange = useCallback((key, value) => {
    setTuning((current) => ({ ...current, [key]: value }));
  }, []);

  const resetTuning = useCallback(() => {
    setTuning(DEFAULT_TUNING);
  }, []);

  const updateMeta = useCallback(
    (patch) => {
      history.updateMeta(patch);
    },
    [history],
  );

  const toggleSavedPalette = useCallback(() => {
    const existing = savedPalettes.find((item) => item.id === palette.id);
    if (existing) {
      setSavedPalettes((current) => current.filter((item) => item.id !== palette.id));
      toast('Palette removed from library', 'info');
      return;
    }

    const name = palette.name.trim() || generatePaletteName(detectedMood);
    const tags = [...new Set([...(palette.tags || []), detectedMood, filters.design].filter(Boolean))];
    const snapshot = {
      ...palette,
      name,
      tags,
      colors: colors.map((color) => makeColor(color.hex, color.isLocked)),
      mood: detectedMood,
      createdAt: palette.createdAt || Date.now(),
    };

    setSavedPalettes((current) => [snapshot, ...current.filter((item) => item.id !== palette.id)]);
    if (name !== palette.name) history.updateMeta({ name });
    toast('Palette saved to library');
  }, [colors, detectedMood, filters.design, history, palette, savedPalettes, toast]);

  const removeSavedPalette = useCallback(
    (target) => {
      setSavedPalettes((current) => current.filter((item) => item.id !== target.id));
      toast(`${target.name} removed from library`, 'info');
    },
    [toast],
  );

  const loadSavedPalette = useCallback(
    (saved) => {
      const normalized = {
        ...saved,
        colors: (saved.colors || []).map((color) => makeColor(color.hex, color.isLocked)),
        tags: saved.tags || [],
        createdAt: saved.createdAt || Date.now(),
      };
      history.push(normalized);
      setLibraryOpen(false);
      setSwatchesOpen(false);
      setActiveTab('studio');
      toast(`Loaded ${saved.name}`);
    },
    [history, toast],
  );

  const sharePalette = useCallback(
    (target) => {
      copyText(buildShareUrl(target.colors), 'Share link copied to clipboard');
    },
    [copyText],
  );

  const toggleSavedSwatch = useCallback(
    (color) => {
      const existing = savedSwatches.find((swatch) => swatch.hex === color.hex);
      if (existing) {
        setSavedSwatches((current) => current.filter((swatch) => swatch.id !== existing.id));
        toast(`${color.hex} removed from saved swatches`, 'info');
        return;
      }

      setSavedSwatches((current) => [
        {
          ...makeColor(color.hex),
          id: createId('swatch'),
          savedAt: Date.now(),
        },
        ...current,
      ]);
      toast(`${color.hex} pinned to saved swatches`);
    },
    [savedSwatches, toast],
  );

  const removeSavedSwatch = useCallback(
    (target) => {
      setSavedSwatches((current) => current.filter((swatch) => swatch.id !== target.id));
      toast(`${target.hex} removed from saved swatches`, 'info');
    },
    [toast],
  );

  const addSwatchToPalette = useCallback(
    (swatch) => {
      const index = palette.colors.findIndex((color) => !color.isLocked);
      if (index === -1) {
        toast('Every color is locked. Unlock one to add this swatch.', 'error');
        return;
      }
      const nextColors = palette.colors.map((color, colorIndex) =>
        colorIndex === index ? makeColor(swatch.hex, true) : color,
      );
      history.updateColors(nextColors);
      toast(`${swatch.hex} replaced color ${index + 1} and locked`);
    },
    [palette.colors, history, toast],
  );

  const handleImport = useCallback(
    ({ colors: importedColors, name, tags, mood }) => {
      const nextColors = importedColors.map((color) => makeColor(color.hex));
      const nextMood = detectMood(nextColors);
      const nextTags = [
        ...new Set([...(tags || []), nextMood, 'Imported'].filter(Boolean)),
      ].slice(0, 10);
      const snapshot = createPaletteSnapshot(nextColors, {
        name: name?.trim() || 'Imported palette',
        tags: nextTags,
        mood: mood || nextMood,
      });
      history.push(snapshot);
      setActiveTab('studio');
    },
    [history],
  );

  const handleBuildPalette = useCallback(
    ({ colors: builtColors, harmony }) => {
      const nextColors = builtColors.map((color) => makeColor(color.hex));
      const mood = detectMood(nextColors);
      const tags = [...new Set(['Custom Build', harmony, mood].filter(Boolean))];
      history.push(
        createPaletteSnapshot(nextColors, {
          name: generatePaletteName(mood),
          tags,
          mood,
        }),
      );
      setActiveTab('studio');
      toast(`Built a ${nextColors.length}-color palette from scratch`);
    },
    [history, toast],
  );

  const applyExtractedPalette = useCallback(
    (extracted) => {
      const nextColors = extracted.map((color) => makeColor(color.hex));
      const mood = detectMood(nextColors);
      history.push(
        createPaletteSnapshot(nextColors, {
          name: generatePaletteName(mood),
          tags: ['Image Extract', mood],
          mood,
        }),
      );
      setActiveTab('studio');
      toast('Extracted palette applied to the studio');
    },
    [history, toast],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (anyOverlayOpen) return;

      const target = event.target;
      if (
        target?.closest?.(
          'input, textarea, select, button, a, [contenteditable="true"], [role="textbox"], [role="dialog"]',
        )
      ) {
        return;
      }

      event.preventDefault();
      generateNew();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [anyOverlayOpen, generateNew]);

  const openLibrary = () => {
    setSwatchesOpen(false);
    setLibraryOpen(true);
  };

  const openSwatches = () => {
    setLibraryOpen(false);
    setSwatchesOpen(true);
  };

  const openExport = () => {
    setLibraryOpen(false);
    setSwatchesOpen(false);
    setExportOpen(true);
  };

  const openImport = () => {
    setLibraryOpen(false);
    setSwatchesOpen(false);
    setImportOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#09090d] text-white">
      <AmbientBackground colors={colors} />
      <div className="vibrance-grain pointer-events-none fixed inset-0 z-[1] opacity-[0.18]" />

      <div className="relative z-10">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          savedPaletteCount={savedPalettes.length}
          savedSwatchCount={savedSwatches.length}
          onOpenLibrary={openLibrary}
          onOpenSwatches={openSwatches}
          onOpenImport={openImport}
          onOpenExport={openExport}
        />

        <main className="mx-auto max-w-[1600px] px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div key={activeTab} className="animate-fade-up">
            {activeTab === 'studio' ? (
              <StudioView
                palette={palette}
                colors={colors}
                detectedMood={detectedMood}
                traits={traits}
                format={format}
                viewMode={viewMode}
                filters={filters}
                tuning={tuning}
                savedSwatchHexes={savedSwatchHexes}
                isSaved={isActiveSaved}
                history={history}
                onGenerate={generateNew}
                onPrevious={goPrevious}
                onNext={goNext}
                onSizeChange={setVisibleCount}
                onFormatChange={setFormat}
                onFiltersChange={setFilters}
                onTuningChange={handleTuningChange}
                onResetTuning={resetTuning}
                onOpenBuild={() => setBuildOpen(true)}
                onViewModeChange={setViewMode}
                onToggleLock={handleToggleLock}
                onUpdateColor={handleUpdateColor}
                onCopyColor={copyColor}
                onOpenShades={setShadeIndex}
                onToggleSaveSwatch={toggleSavedSwatch}
                onToggleSaved={toggleSavedPalette}
                onUpdateMeta={updateMeta}
                onExport={openExport}
                onShare={sharePalette}
                onReset={resetStudio}
                onNotify={toast}
              />
            ) : null}

            {activeTab === 'gradients' ? (
              <GradientStudio colors={colors} onCopyText={copyText} onNotify={toast} />
            ) : null}

            {activeTab === 'extract' ? (
              <ImageExtractor
                onApply={applyExtractedPalette}
                onCopyText={copyText}
                onNotify={toast}
              />
            ) : null}
          </div>
        </main>

        <footer className="relative mx-auto max-w-[1600px] px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-white/38 sm:flex-row sm:items-center sm:justify-between">
            <p>Vibrance — a browser-native color studio. Nothing leaves this device.</p>
            <p className="font-mono">
              {colors.length} colors · {detectedMood} · {format} · localStorage synced
            </p>
          </div>
        </footer>
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        palette={{ ...palette, colors }}
        onCopyText={copyText}
        onNotify={toast}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        onNotify={toast}
      />

      <BuildPaletteModal
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        onBuild={handleBuildPalette}
        defaultSize={colors.length}
      />

      <LibraryDrawer
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        savedPalettes={savedPalettes}
        activePaletteId={palette.id}
        onLoad={loadSavedPalette}
        onRemove={removeSavedPalette}
        onCopyText={copyText}
        onShare={sharePalette}
      />

      <SwatchesDrawer
        open={swatchesOpen}
        onClose={() => setSwatchesOpen(false)}
        swatches={savedSwatches}
        onRemove={removeSavedSwatch}
        onAddToPalette={addSwatchToPalette}
        onCopyText={copyText}
        paletteSize={colors.length}
      />

      <ShadeDrawer
        open={Boolean(shadeColor)}
        color={shadeColor}
        format={format}
        isSaved={shadeColor ? savedSwatchHexes.has(shadeColor.hex) : false}
        onClose={() => setShadeIndex(null)}
        onCopyText={copyText}
        onToggleSave={() => shadeColor && toggleSavedSwatch(shadeColor)}
        onNotify={toast}
      />

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
