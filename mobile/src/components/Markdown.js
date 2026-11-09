import { memo, useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, NO_LIGATURES, radius } from '../theme';
import { hasInlineCode, isSafeLink, parseBlocks, parseInline, plainText } from '../utils/markdown';
import CodeBlock from './CodeBlock';

const openLink = (href) => {
  // Cuma http(s) yang dibuka; skema lain (javascript:, intent:, dll) diabaikan
  if (isSafeLink(href)) Linking.openURL(href.trim()).catch(() => {});
};

// Render inline sebagai nested <Text> (dipakai kalau paragraf nggak ada inline code)
function renderNested(tokens, keyPrefix = 'n') {
  return tokens.map((tk, i) => {
    const key = `${keyPrefix}${i}`;
    switch (tk.t) {
      case 'bold':
        return (
          <Text key={key} style={styles.bold}>
            {renderNested(tk.children, key)}
          </Text>
        );
      case 'italic':
        return (
          <Text key={key} style={styles.italic}>
            {renderNested(tk.children, key)}
          </Text>
        );
      case 'link':
        return (
          <Text key={key} style={styles.link} accessibilityRole="link" onPress={() => openLink(tk.href)}>
            {renderNested(tk.children, key)}
          </Text>
        );
      case 'code':
        return (
          <Text key={key} style={styles.codeInline}>
            {tk.v}
          </Text>
        );
      default:
        return tk.v;
    }
  });
}

// Pecah token jadi "atom" kata + chip kode, supaya inline code bisa punya border & radius
// (nested Text di RN nggak bisa diberi border/padding)
function toAtoms(tokens, style = {}, atoms = []) {
  tokens.forEach((tk) => {
    if (tk.t === 'code') atoms.push({ code: tk.v });
    else if (tk.t === 'text') {
      tk.v.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) atoms.push({ space: true });
        else atoms.push({ word: part, style });
      });
    } else {
      const next = { ...style };
      if (tk.t === 'bold') next.bold = true;
      if (tk.t === 'italic') next.italic = true;
      if (tk.t === 'link') next.href = tk.href;
      toAtoms(tk.children, next, atoms);
    }
  });
  return atoms;
}

function Flow({ tokens, textStyle, chipFont }) {
  const atoms = toAtoms(tokens);
  const out = [];
  atoms.forEach((a, i) => {
    const spaceAfter = atoms[i + 1]?.space;
    if (a.space) return;
    if (a.code) {
      out.push(
        <View key={i} style={[styles.chip, spaceAfter && { marginRight: 4 }]}>
          <Text style={[styles.chipText, { fontSize: chipFont }]}>{a.code}</Text>
        </View>
      );
    } else {
      out.push(
        <Text
          key={i}
          style={[textStyle, a.style.bold && styles.bold, a.style.italic && styles.italic, a.style.href && styles.link]}
          onPress={a.style.href ? () => openLink(a.style.href) : undefined}
        >
          {spaceAfter ? `${a.word} ` : a.word}
        </Text>
      );
    }
  });
  return (
    <View style={styles.flow} accessible accessibilityRole="text" accessibilityLabel={plainText(tokens)}>
      {out}
    </View>
  );
}

function Inline({ text, style, chipFont = 14 }) {
  const tokens = useMemo(() => parseInline(text), [text]);
  if (hasInlineCode(tokens)) return <Flow tokens={tokens} textStyle={style} chipFont={chipFont} />;
  return <Text style={style}>{renderNested(tokens)}</Text>;
}

/**
 * Markdown → komponen RN: heading, paragraf, list, blok kode (dengan highlight + Copy),
 * inline code, bold, italic, link, blockquote (kotak "Tip").
 * size 'lg' = artikel (16/1.7), 'md' = instruksi practice (15/1.65)
 */
function Markdown({ content, size = 'lg', gap = 16 }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  const para = size === 'lg' ? styles.paraLg : styles.paraMd;
  const chipFont = size === 'lg' ? 14 : 13;
  return (
    <View style={{ gap }}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return (
              <Text key={i} accessibilityRole="header" style={b.level === 1 ? styles.h1 : b.level === 2 ? styles.h2 : styles.h3}>
                {plainText(parseInline(b.text))}
              </Text>
            );
          case 'code':
            return <CodeBlock key={i} code={b.code} language={b.lang} />;
          case 'quote':
            return (
              <View key={i} style={styles.tip}>
                <Inline text={b.text} style={styles.tipText} chipFont={12} />
              </View>
            );
          case 'list':
            return (
              <View key={i} style={styles.list}>
                {b.items.map((item, j) => (
                  <View key={j} style={styles.listRow}>
                    {b.ordered ? (
                      <Text style={styles.listNum}>{String(b.start + j).padStart(2, '0')}</Text>
                    ) : (
                      <Text style={[para, styles.bullet]}>•</Text>
                    )}
                    <View style={{ flex: 1 }}>
                      <Inline text={item} style={[para, styles.listText]} chipFont={chipFont} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'hr':
            return <View key={i} style={styles.hr} />;
          default:
            return <Inline key={i} text={b.text} style={para} chipFont={chipFont} />;
        }
      })}
    </View>
  );
}

export default memo(Markdown);

const styles = StyleSheet.create({
  paraLg: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 27, color: colors.inkBody },
  paraMd: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24.75, color: colors.inkBody },
  bold: { fontFamily: fonts.bold },
  italic: { fontStyle: 'italic' },
  link: { color: colors.primary, fontFamily: fonts.semibold, textDecorationLine: 'underline' },
  codeInline: { fontFamily: fonts.mono, fontSize: 14, color: colors.accentInk, backgroundColor: colors.accentTint, fontVariant: NO_LIGATURES },
  h1: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, letterSpacing: -0.44, color: colors.ink, marginTop: 4 },
  h2: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.ink, marginTop: 2 },
  h3: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.ink },
  flow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  chip: {
    backgroundColor: colors.accentTint,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginVertical: 2,
  },
  chipText: { fontFamily: fonts.mono, color: colors.accentInk, lineHeight: 19, fontVariant: NO_LIGATURES },
  tip: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: colors.primaryTint },
  tipText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22.4, color: colors.primaryHover },
  list: { gap: 10 },
  listRow: { flexDirection: 'row', gap: 12 },
  listNum: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 25.6, color: colors.primary },
  bullet: { color: colors.primary, width: 12 },
  listText: { lineHeight: 25.6 },
  hr: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
});
