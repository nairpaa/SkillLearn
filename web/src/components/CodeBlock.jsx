import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { highlight } from '../lib/highlight';

// Clipboard API cuma ada di secure context (https / localhost). Kalau app dibuka lewat
// http://IP-VM, fallback ke textarea + execCommand supaya tombol Copy tetap jalan.
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.className = 'sr-only';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if (!ok) throw new Error('copy failed');
}

// Baris di-render inline dan disambung "\n" (bukan div per baris), jadi isi <pre> persis sama
// dengan teks aslinya. Ini penting buat editor practice yang menumpuk textarea di atas <pre>.
export function HighlightedLines({ lines }) {
  return lines.map((ln, idx) => (
    <Fragment key={ln.n}>
      {ln.toks.map((tk, i) => (
        <span key={i} className={`tok-${tk.k}`}>
          {tk.t}
        </span>
      ))}
      {idx < lines.length - 1 ? '\n' : null}
    </Fragment>
  ));
}

export function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const lines = useMemo(() => highlight(code), [code]);
  const label = (language || 'code').toUpperCase();

  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = async () => {
    try {
      await copyText(code.replace(/\n$/, ''));
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <figure className="code-block">
      <figcaption className="code-head">
        <span className="code-lang">{label}</span>
        <button type="button" className="code-copy" onClick={onCopy} aria-live="polite">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="code-body" tabIndex={0} aria-label={`${label} code`}>
        <code>
          <HighlightedLines lines={lines} />
        </code>
      </pre>
    </figure>
  );
}
