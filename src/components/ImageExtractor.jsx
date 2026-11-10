import { useEffect, useRef, useState } from 'react';
import {
  Copy,
  ImagePlus,
  Loader2,
  RefreshCw,
  ScanLine,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { getContrastColor } from '../lib/color';
import { extractPaletteFromImage, loadImageFile } from '../lib/image';
import { Button, IconButton, SectionHeading, cx } from './ui';

export default function ImageExtractor({ onApply, onCopyText, onNotify }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [extracted, setExtracted] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef('');

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const updatePreview = (url) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  const processFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Drop an image file such as a JPG, PNG, WebP, or AVIF.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('That image is larger than 12 MB. Try a smaller file.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setExtracted([]);
    setMeta(null);

    try {
      const { image, url } = await loadImageFile(file);
      updatePreview(url);
      setFileName(file.name);
      const result = extractPaletteFromImage(image, 5);
      setExtracted(result.colors);
      setMeta({
        width: image.naturalWidth,
        height: image.naturalHeight,
        sampledPixels: result.sampledPixels,
      });
      onNotify?.(`Extracted ${result.colors.length} colors from ${file.name}`);
    } catch (processError) {
      setError(processError.message || 'Could not extract colors from that image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  const reset = () => {
    updatePreview('');
    setExtracted([]);
    setMeta(null);
    setFileName('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section>
      <SectionHeading
        eyebrow="Image extractor"
        title="Pull a palette from a photograph."
        description="Canvas reads the pixels locally, then median-cut quantization distills the image into five usable colors. Nothing is uploaded."
        action={
          previewUrl ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RefreshCw size={13} />
              New image
            </Button>
          ) : null
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          {!previewUrl ? (
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget === event.target) setDragActive(false);
              }}
              onDrop={handleDrop}
              className={cx(
                'flex min-h-[390px] flex-col items-center justify-center rounded-[1.8rem] border border-dashed p-8 text-center transition-all duration-200',
                dragActive
                  ? 'border-white/40 bg-white/[0.07]'
                  : 'border-white/12 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]',
              )}
            >
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(110deg,#ff7a59,#ff4d9d,#7c6cff)] opacity-40 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-white/12 bg-white/[0.07] text-white/70">
                  {isProcessing ? <Loader2 size={25} className="animate-spin" /> : <ImagePlus size={25} />}
                </div>
              </div>
              <h3 className="text-base font-semibold text-white">
                {isProcessing ? 'Reading the pixels…' : 'Drop an image here'}
              </h3>
              <p className="mt-2 max-w-xs text-xs leading-5 text-white/55">
                JPG, PNG, WebP, or AVIF up to 12 MB. The image stays in your browser.
              </p>
              <Button
                variant="secondary"
                size="md"
                className="mt-5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <UploadCloud size={15} />
                Choose an image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => processFile(event.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03]">
              <div className="relative h-[390px] overflow-hidden bg-[#08080c]">
                <img src={previewUrl} alt={fileName || 'Uploaded image'} className="h-full w-full object-contain" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.6),transparent_35%)]" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="truncate text-xs font-semibold text-white">{fileName}</p>
                    <p className="mt-1 font-mono text-[11px] text-white/55">
                      {meta ? `${meta.width}×${meta.height} · ${meta.sampledPixels.toLocaleString()} pixels sampled` : 'Analyzing…'}
                    </p>
                  </div>
                  {isProcessing ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-white/12 bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white/70 backdrop-blur-md">
                      <Loader2 size={11} className="animate-spin" />
                      Quantizing
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 backdrop-blur-md">
                      <ScanLine size={11} />
                      Local analysis
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {error ? (
            <div className="mt-3 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3 py-2.5 text-xs leading-5 text-red-200/80">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.8rem] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
                Extracted palette
              </p>
              <p className="mt-1 text-xs text-white/55">
                {extracted.length ? 'Five colors, sorted light to dark.' : 'Your five colors will appear here.'}
              </p>
            </div>
            {extracted.length ? (
              <IconButton
                label="Copy extracted palette"
                variant="solid"
                size="sm"
                onClick={() =>
                  onCopyText(extracted.map((color) => color.hex).join(', '), 'Extracted palette copied')
                }
              >
                <Copy size={14} />
              </IconButton>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            {extracted.length
              ? extracted.map((color, index) => {
                  const contrast = getContrastColor(color.hex);
                  return (
                    <button
                      key={`${color.hex}-${index}`}
                      type="button"
                      onClick={() => onCopyText(color.hex, `${color.hex} copied`)}
                      className="group flex h-14 w-full items-center justify-between rounded-xl border border-white/[0.06] px-4 text-left transition-transform duration-200 hover:scale-[1.01]"
                      style={{ backgroundColor: color.hex, color: contrast }}
                    >
                      <span className="font-mono text-xs font-bold">{color.hex}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-40">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </button>
                  );
                })
              : Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-14 items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.025] px-4"
                  >
                    <div className="h-2 w-20 rounded-full bg-white/[0.06]" />
                    <div className="h-2 w-8 rounded-full bg-white/[0.05]" />
                  </div>
                ))}
          </div>

          <Button
            variant="primary"
            className="mt-4 w-full"
            disabled={!extracted.length || isProcessing}
            onClick={() => onApply(extracted)}
          >
            <Sparkles size={15} />
            Use this palette
          </Button>
          <p className="mt-3 text-center text-[11px] leading-4 text-white/40">
            Applying this palette creates a new active workspace. Your current palette stays in history.
          </p>
        </div>
      </div>
    </section>
  );
}
