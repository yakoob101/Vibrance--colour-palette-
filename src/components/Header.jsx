import {
  Blend,
  Download,
  Image,
  Library,
  Palette,
  SwatchBook,
  Upload,
} from 'lucide-react';
import { Button, IconButton, cx } from './ui';

const TABS = [
  { id: 'studio', label: 'Studio', icon: Palette },
  { id: 'gradients', label: 'Gradients', icon: Blend },
  { id: 'extract', label: 'Extract', icon: Image },
];

export default function Header({
  activeTab,
  onTabChange,
  savedPaletteCount,
  savedSwatchCount,
  onOpenLibrary,
  onOpenSwatches,
  onOpenImport,
  onOpenExport,
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090d]/78 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onTabChange('studio')}
          className="flex shrink-0 items-center gap-3 text-left"
          aria-label="Vibrance home"
        >
          <span className="relative flex h-11 w-11 items-center justify-center">
            <span className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-[#ff7a59] opacity-90 mix-blend-screen" />
            <span className="absolute bottom-1.5 right-0 h-6 w-6 rounded-full bg-[#ff4d9d] opacity-90 mix-blend-screen" />
            <span className="absolute bottom-0 left-2.5 h-5 w-5 rounded-full bg-[#7c6cff] opacity-90 mix-blend-screen" />
            <span className="absolute left-[16px] top-[15px] h-3 w-3 rounded-full bg-[#ffd166]" />
          </span>
          <span className="hidden sm:block">
            <span className="block bg-gradient-to-r from-white via-white to-white/65 bg-clip-text text-[26px] font-extrabold leading-none tracking-[-0.05em] text-transparent">
              Vibrance
            </span>
          </span>
        </button>

        <nav className="ml-2 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 [scrollbar-width:none] sm:ml-5 [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cx(
                  'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-all duration-200 sm:px-3',
                  active
                    ? 'bg-white text-[#0a0a0f] shadow-sm'
                    : 'text-white/55 hover:bg-white/[0.05] hover:text-white/80',
                )}
              >
                <Icon size={13} />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpenLibrary}
            className="relative flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 text-[11px] font-semibold text-white/70 transition-colors hover:border-white/15 hover:text-white"
          >
            <Library size={14} />
            <span className="hidden lg:inline">Library</span>
            {savedPaletteCount ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#0a0a0f]">
                {savedPaletteCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={onOpenSwatches}
            className="relative flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 text-[11px] font-semibold text-white/70 transition-colors hover:border-white/15 hover:text-white"
          >
            <SwatchBook size={14} />
            <span className="hidden xl:inline">Swatches</span>
            {savedSwatchCount ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#0a0a0f]">
                {savedSwatchCount}
              </span>
            ) : null}
          </button>
          <IconButton label="Import palette" variant="solid" size="md" onClick={onOpenImport}>
            <Upload size={15} />
          </IconButton>
          <Button variant="secondary" size="md" onClick={onOpenExport} className="px-3">
            <Download size={15} />
            <span className="hidden lg:inline">Export</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
