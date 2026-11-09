import { colors } from '../theme';

// Port dari fungsi hl() di design_handoff/design/sl-data.js.
// Sederhana tapi cukup untuk JS/JSX: komentar, string, tag, keyword, fungsi, atribut, tanda baca.
const C = colors.code;
const COLOR = { com: C.comment, str: C.string, tag: C.tag, kw: C.keyword, fn: C.fn, attr: C.attr, pun: C.punct, txt: C.text };
const KEYWORDS =
  'import|from|export|default|function|const|let|var|return|null|undefined|true|false|if|else|for|while|new|async|await|class|extends|this|typeof';

export function highlight(code) {
  return String(code ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line, i) => {
      const toks = [];
      const re = new RegExp(
        `(\\/\\/.*|^\\s*#\\s.*$)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|(<\\/?)([A-Za-z][\\w.]*)|\\b(${KEYWORDS})\\b|\\b([A-Za-z_]\\w*)(?=\\()|\\b([a-z][A-Za-z-]*)(?==[^=>])|(=>|\\/?>|[{}()[\\];,.=])`,
        'g'
      );
      let last = 0;
      let m;
      const push = (t, k) => {
        if (t) toks.push({ t, c: COLOR[k], italic: k === 'com' });
      };
      while ((m = re.exec(line))) {
        if (m[0] === '') {
          re.lastIndex += 1;
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
        last = re.lastIndex;
      }
      push(line.slice(last), 'txt');
      return { n: i + 1, toks };
    });
}
