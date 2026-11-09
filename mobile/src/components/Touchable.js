import { Pressable } from 'react-native';

// Pressable dengan efek tekan standar desain mobile: opacity .7
export default function Touchable({ style, pressedOpacity = 0.7, disabled, children, ...rest }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [typeof style === 'function' ? style({ pressed }) : style, pressed && !disabled && { opacity: pressedOpacity }]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
