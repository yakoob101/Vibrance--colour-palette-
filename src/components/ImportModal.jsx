import { useEffect, useRef, useState } from 'react';
import { AlertCircle, FileJson, Sparkles, Upload } from 'lucide-react';
import { parseImportInput } from '../lib/palette';
import { Button, Modal } from './ui';

const SAMPLE_JSON = `{
  "name": "Coastal Signal",
  "tags": ["Cool", "Editorial"],
  "colors": ["#0B3C5D", "#328CC1", "#D9B310", "#F4F1DE", "#1D2731"]
}`;

const SAMPLE_HEX = '#FF7A59, #FF4D9D, #7C6CFF, #8EF0C0, #FFD166';

export default function ImportModal({ open, onClose, onImport, onNotify }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setError('');
      setFileName('');
    }
  }, [open]);

  const importPalette = () => {
    try {
      const parsed = parseImportInput(value);
      onImport(parsed);
      onNotify?.(`Imported ${parsed.colors.length} colors`);
      setValue('');
      setError('');
      onClose();
    } catch (importError) {
      setError(importError.message || 'Could not import that palette.');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 512_000) {
      setError('That file is too large. Use a palette file under 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValue(String(reader.result || ''));
      setFileName(file.name);
      setError('');
    };
    reader.onerror = () => setError('That file could not be read.');
    reader.readAsText(file);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import a palette"
      description="Paste JSON, a saved Vibrance palette, or a raw list of hex colors. The import accepts 2–8 colors."
      size="md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-[11px] text-white/40 sm:block">JSON · hex strings · exported palettes</p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={importPalette} className="flex-1 sm:flex-none">
              <Sparkles size={14} />
              Import palette
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setValue(SAMPLE_JSON);
            setFileName('');
            setError('');
          }}
        >
          <FileJson size={14} />
          Use JSON example
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setValue(SAMPLE_HEX);
            setFileName('');
            setError('');
          }}
        >
          Use hex example
        </Button>
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} />
          Load file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt,text/plain,application/json"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      <div className="relative mt-3">
        <textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError('');
          }}
          spellCheck="false"
          placeholder={`Paste a palette here...\n\n${SAMPLE_HEX}`}
          className="min-h-[240px] w-full resize-y rounded-2xl border border-white/[0.09] bg-[#09090e] p-4 font-mono text-xs leading-6 text-white/70 outline-none transition-colors placeholder:text-white/35 focus:border-white/25"
        />
        {fileName ? (
          <span className="absolute right-3 top-3 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] font-semibold text-white/55">
            {fileName}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3 py-2.5 text-xs leading-5 text-red-200/80">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs leading-5 text-white/45">
          Colors beyond eight are trimmed. Names and tags from JSON are preserved when present.
        </div>
      )}
    </Modal>
  );
}
