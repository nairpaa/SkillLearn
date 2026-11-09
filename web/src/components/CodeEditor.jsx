import { useMemo, useRef } from 'react';
import { highlight } from '../lib/highlight';
import { HighlightedLines } from './CodeBlock';

// Editor ringan: <textarea> transparan ditumpuk di atas <pre> yang di-highlight.
// Ukuran textarea = ukuran teks (nggak scroll sendiri), yang scroll wadah luarnya,
// jadi posisi caret dan highlight selalu sejajar.
export function CodeEditor({ value, onChange, label, fileName }) {
  const lines = useMemo(() => highlight(value + (value.endsWith('\n') ? ' ' : '')), [value]);
  const escapeTab = useRef(false);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      // Esc lalu Tab = keluar dari editor (supaya keyboard user nggak "terjebak")
      escapeTab.current = true;
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (escapeTab.current) {
        escapeTab.current = false;
        return;
      }
      e.preventDefault();
      const ta = e.currentTarget;
      // execCommand menjaga riwayat undo (Ctrl+Z); fallback manual kalau browser menolak
      const ok = document.execCommand && document.execCommand('insertText', false, '  ');
      if (!ok) {
        const { selectionStart: s, selectionEnd: en } = ta;
        const next = value.slice(0, s) + '  ' + value.slice(en);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = s + 2;
        });
      }
      return;
    }
    escapeTab.current = false;
  };

  return (
    <div className="editor-scroll">
      <div className="editor">
        <div className="editor-gutter" aria-hidden="true">
          {lines.map((l) => (
            <span key={l.n}>{l.n}</span>
          ))}
        </div>
        <div className="editor-code">
          <pre className="editor-pre" aria-hidden="true">
            <HighlightedLines lines={lines} />
          </pre>
          <textarea
            className="editor-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            aria-label={label || `Code editor, ${fileName}`}
            aria-describedby="editor-help"
          />
        </div>
      </div>
      <span id="editor-help" className="sr-only">
        Tab inserts two spaces. Press Escape, then Tab, to move focus out of the editor.
      </span>
    </div>
  );
}
