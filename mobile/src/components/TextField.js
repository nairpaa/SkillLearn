import { forwardRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius, size } from '../theme';

const TextField = forwardRef(function TextField(
  { label, error, secureToggle = false, counter, multiline = false, editable = true, footer, style, inputStyle, onFocus, onBlur, ...inputProps },
  ref
) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.lineStrong;
  const backgroundColor = error ? colors.dangerField : editable ? colors.white : colors.page;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label} nativeID={inputProps.nativeID ? `${inputProps.nativeID}-label` : undefined}>
          {label}
        </Text>
        {counter ? <Text style={styles.counter}>{counter}</Text> : null}
      </View>
      <View style={[styles.box, multiline ? styles.boxMulti : null, { borderColor, backgroundColor }]}>
        <TextInput
          ref={ref}
          accessibilityLabel={error ? `${label}. Error: ${error}` : label}
          aria-invalid={error ? true : undefined}
          editable={editable}
          multiline={multiline}
          secureTextEntry={secureToggle ? !show : inputProps.secureTextEntry}
          placeholderTextColor={colors.inkSubtle}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            multiline && styles.inputMulti,
            secureToggle && { paddingRight: 64 },
            !editable && { color: colors.inkMuted },
            Platform.OS === 'web' && styles.webNoOutline,
            inputStyle,
          ]}
          {...inputProps}
        />
        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={show ? 'Hide password' : 'Show password'}
            onPress={() => setShow((s) => !s)}
            hitSlop={4}
            style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.toggleText}>{show ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {footer}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.ink },
  counter: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  box: { minHeight: size.input, borderWidth: 1, borderRadius: radius.lg, justifyContent: 'center' },
  boxMulti: { minHeight: 96 },
  input: {
    height: size.input - 2,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  inputMulti: { height: undefined, minHeight: 94, paddingTop: 12, paddingBottom: 12, lineHeight: 24, textAlignVertical: 'top' },
  webNoOutline: { outlineStyle: 'none' },
  toggle: { position: 'absolute', right: 6, top: 5, height: 40, paddingHorizontal: 10, justifyContent: 'center' },
  toggleText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
  error: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17, color: colors.danger },
});
