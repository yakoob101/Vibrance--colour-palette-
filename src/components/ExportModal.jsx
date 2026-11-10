import { useMemo, useState } from 'react';
import { Check, Clipboard, Download, FileCode2, FileJson, ImageDown, Link2, Share2 } from 'lucide-react';
import { buildCssExport, buildJsonExport, buildShareUrl, buildTailwindExport } from '../lib/palette';
import { downloadCanvasPng, renderPaletteCanvas } from '../lib/imageExport';
import { downloadTextFile } from '../lib/storage';
import { Button, Modal, cx } from './ui';

const TABS = [
  { id: 'json', label: 'JSON', icon: FileJson, language: 'json' },
  { id: 'css', label: 'CSS variables', icon: FileCode2, language: 'css' },
  { id: 'tailwind', label: 'Tailwind config', icon: FileCode2, language: 'js' },
  { id: 'png', label: 'PNG image', icon: ImageDown, language: 'image' },
  { id: 'url', label: 'Share URL', icon: Link2, language: 'url' },
];

export default function ExportModal({ open, onClose, palette, onCopyText, onNotify }) {
  const [tab, setTab] = useState('json');

  const shareUrl = useMemo(
    () => buildShareUrl(palette?.colors || []),
    [palette?.colors],
  );

  const content = useMemo(() => {
    if (!palette) return '';
    if (tab === 'json') return buildJsonExport(palette);
    if (tab === 'css') return buildCssExport(palette.colors);
    if (tab === 'tailwind') return buildTailwindExport(palette.colors);
    return shareUrl;
  }, [palette, shareUrl, tab]);

  const pngPreview = useMemo(() => {
    if (!open || tab !== 'png' || !palette?.colors?.length) return null;
    return renderPaletteCanvas(palette.colors, 900, 1200).toDataURL('image/png');
  }, [open, tab, palette]);

  const activeTab = TABS.find((item) => item.id === tab) || TABS[0];
  const slug = (palette?.name || 'vibrance-palette')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const filename = `${slug || 'vibrance-palette'}.${
    tab === 'json' ? 'json' : tab === 'css' ? 'css' : tab === 'tailwind' ? 'js' : tab === 'png' ? 'png' : 'txt'
  }`;

  const downloadImage = () => {
    if (!palette?.colors?.length) return;
    downloadCanvasPng(renderPaletteCanvas(palette.colors, 1600, 2000), filename);
    onNotify?.('Image download started');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export palette"
      description="Take the active palette into your next project — as data, CSS, a Tailwind theme, an image, or a shareable link."
      size="lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">
            {palette?.colors.length || 0} colors · {palette?.mood || 'unclassified'} mood
          </p>
          <div className="flex gap-2">
            {tab === 'url' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
              >
                <Share2 size={14} />
                Open link
              </Button>
            ) : tab === 'png' ? (
              <Button variant="primary" size="sm" onClick={downloadImage}>
                <ImageDown size={14} />
                Download image
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadTextFile(filename, content, activeTab.language === 'json' ? 'application/json' : 'text/plain');
                  onNotify?.('Download started');
                }}
              >
                <Download size={14} />
                Download
              </Button>
            )}
            {tab !== 'png' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onCopyText(content, `${activeTab.label} copied to clipboard`)}
              >
                <Clipboard size={14} />
                Copy
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cx(
                'inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all duration-200',
                tab === item.id
                  ? 'border-white/20 bg-white text-[#0a0a0f]'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/15 hover:text-white',
              )}
            >
              <Icon size={13} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#09090e]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ff6b6b]/70" />
            <span className="h-2 w-2 rounded-full bg-[#ffd166]/70" />
            <span className="h-2 w-2 rounded-full bg-[#8ef0c0]/70" />
            <span className="ml-2 font-mono text-[11px] text-white/40">{filename}</span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
            {activeTab.language}
          </span>
        </div>
        {tab === 'url' ? (
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <Link2 size={14} className="shrink-0 text-white/45" />
              <input
                readOnly
                value={shareUrl}
                aria-label="Shareable palette URL"
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white/78 outline-none"
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/50">
              The palette is encoded in the <span className="font-mono text-white/70">?palette=</span>{' '}
              query parameter. Opening the link restores this exact set of hex values.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {palette?.colors.map((color) => (
                <span
                  key={color.hex}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-white/65"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
                  {color.hex}
                </span>
              ))}
            </div>
          </div>
        ) : tab === 'png' ? (
          <div className="p-4">
            {pngPreview ? (
              <img
                src={pngPreview}
                alt="Palette image preview"
                className="mx-auto max-h-[48vh] rounded-xl border border-white/[0.08]"
              />
            ) : null}
            <p className="mt-3 text-center text-xs leading-5 text-white/50">
              A 1600×2000 PNG with one band per color and its hex value.
            </p>
          </div>
        ) : (
          <pre className="max-h-[48vh] overflow-auto p-4 font-mono text-xs leading-6 text-emerald-100/70 selection:bg-white/20">
            <code>{content}</code>
          </pre>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] px-3.5 py-3 text-xs leading-5 text-emerald-100/50">
        <Check size={14} className="mt-0.5 shrink-0" />
        Everything is generated locally in your browser. No palette data leaves this device.
      </div>
    </Modal>
  );
}
