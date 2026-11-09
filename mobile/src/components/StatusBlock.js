import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';
import Button from './Button';
import { AlertIcon, SadIcon } from './Icons';
import { DetailSkeleton, ListSkeleton } from './Skeleton';

/**
 * Satu komponen untuk loading / error / not found di semua layar data.
 * kind: 'loading' | 'error' | 'notfound'; layout: 'list' | 'detail'
 */
export default function StatusBlock({ kind = 'loading', layout = 'list', error, onRetry, onBack, notFoundTitle = 'Course not found', retrying = false }) {
  if (kind === 'loading') {
    return <View style={styles.pad}>{layout === 'detail' ? <DetailSkeleton /> : <ListSkeleton />}</View>;
  }
  const isError = kind === 'error';
  const caption = isError ? error?.caption || 'ERR_NETWORK · GET /api/courses' : null;
  return (
    <View style={styles.pad}>
      <View style={styles.card} accessibilityRole="alert">
        <View style={[styles.iconTile, { backgroundColor: isError ? colors.dangerTint : colors.lineSoft }]}>
          {isError ? <AlertIcon /> : <SadIcon />}
        </View>
        <Text style={styles.title}>{isError ? "Couldn't load content" : notFoundTitle}</Text>
        <Text style={styles.body}>
          {isError
            ? 'Check your internet connection and try again. Your progress is saved.'
            : 'The link may be broken, or this item is no longer available.'}
        </Text>
        <View style={styles.actions}>
          {isError ? (
            <Button
              title="Try again"
              onPress={onRetry}
              busy={retrying}
              busyLabel="Try again"
              height={44}
              style={styles.btn}
              textStyle={styles.btnText}
            />
          ) : null}
          {onBack ? (
            <Button title="Back to Home" variant="secondary" onPress={onBack} height={44} style={styles.btn} textStyle={styles.btnTextSecondary} />
          ) : null}
        </View>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 28 },
  card: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xxl,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconTile: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: colors.ink, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21.7, color: colors.inkMuted, textAlign: 'center', maxWidth: 360 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
  btn: { borderRadius: radius.md, paddingHorizontal: 20 },
  btnText: { fontSize: 14 },
  btnTextSecondary: { fontSize: 14, fontFamily: fonts.semibold },
  caption: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkSubtle, marginTop: 4, textAlign: 'center' },
});
