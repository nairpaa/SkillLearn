import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts, NO_LIGATURES, radius } from '../theme';
import { highlight } from '../utils/highlight';

async function copyText(text) {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    // fallback untuk web lama tanpa clipboard API
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }
}

// Blok kode gelap dengan header label bahasa + tombol Copy (berubah jadi "Copied")
export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const lines = useMemo(() => highlight(code.replace(/\n$/, '')), [code]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = async () => {
    const ok = await copyText(code);
    if (!ok) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Text style={styles.lang}>{(language || 'code').toUpperCase()}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copied ? 'Code copied' : 'Copy code'}
          onPress={onCopy}
          hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
          style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.copy}>{copied ? 'Copied' : 'Copy'}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View accessible accessibilityLabel={code}>
          {lines.map((ln) => (
            <Text key={ln.n} style={styles.line}>
              {ln.toks.length === 0
                ? ' '
                : ln.toks.map((tk, i) => (
                    <Text key={i} style={{ color: tk.c, fontStyle: tk.italic ? 'italic' : 'normal' }}>
                      {tk.t}
                    </Text>
                  ))}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, backgroundColor: colors.code.bg, overflow: 'hidden' },
  header: {
    height: 36,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  lang: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.84, color: colors.code.punct },
  copyBtn: { height: 36, justifyContent: 'center', minWidth: 44, alignItems: 'flex-end' },
  copy: { fontFamily: fonts.semibold, fontSize: 12, color: colors.code.punct },
  body: { paddingVertical: 12, paddingHorizontal: 14 },
  line: { fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 19.5, color: colors.code.text, minHeight: 19.5, fontVariant: NO_LIGATURES },
});
