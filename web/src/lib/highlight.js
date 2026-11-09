// Port dari hl() di prototipe (sl-data.js). Tokenizer regex sederhana untuk JS/JSX:
// cukup buat materi belajar, nggak perlu library highlight yang berat.
// Output: array baris, tiap baris berisi token { t: teks, k: jenis }.
// Jenis token dipetakan ke class CSS .tok-<k> (warnanya ada di styles/components.css).

const RE =
  /(\/\/.*|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?)([A-Za-z][\w.]*)|\b(import|from|export|default|function|const|let|var|return|null|true|false|if|else|for|while|new|await|async|class|extends|undefined)\b|\b([A-Za-z_$][\w$]*)(?=\()|\b([a-z][A-Za-z-]*)(?==[^=>])|(=>|\/?>|[{}()[\];,.=])/g;

export function highlight(code) {
  return String(code ?? '')
    .replace(/\n$/, '')
    .split('\n')
    .map((line, i) => {
      const toks = [];
      const push = (t, k) => {
        if (t) toks.push({ t, k });
      };
      let last = 0;
      let m;
      RE.lastIndex = 0;
      while ((m = RE.exec(line))) {
        if (m[0] === '') {
          RE.lastIndex++;
          continue;
        }
        push(line.slice(last, m.index), 'txt');
        if (m[1]) push(m[1], 'com');
        else if (m[2]) push(m[2], 'str');
        else if (m[3]) {
          push(m[3], 'pun');
          push(m[4], 'tag');
        } else if (m[5]) push(m[5], 'kw');
        else if (m[6]) push(m[6], 'fn');
        else if (m[7]) push(m[7], 'attr');
        else push(m[8], 'pun');
        last = RE.lastIndex;
      }
      push(line.slice(last), 'txt');
      return { n: i + 1, toks };
    });
}
