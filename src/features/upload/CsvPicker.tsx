import { useRef, useState } from 'react';
import { Button, type ButtonVariant } from '../../components/ui';
import { UploadGlyph } from '../../components/icons';
import { importCsvFile, type CsvImport } from '../../lib/csv/importFile';

/** A button that opens the file picker and hands back the parsed import. */
export function CsvPicker({
  label = 'Choose CSV file',
  variant = 'primary',
  onImport,
}: {
  label?: string;
  variant?: ButtonVariant;
  onImport: (imp: CsvImport) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="csv-input"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setBusy(true);
          try {
            onImport(await importCsvFile(file));
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button
        block
        variant={variant}
        icon={<UploadGlyph size={22} />}
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? 'Reading…' : label}
      </Button>
    </>
  );
}
