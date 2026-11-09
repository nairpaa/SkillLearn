import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

let counter = 0;

// Placeholder bergaris 135° seperti CSS repeating-linear-gradient di desain.
// band = lebar satu garis putih (px); periode = band × 2.
export default function Stripes({ tint, stripe = 'rgba(255,255,255,0.4)', band = 8, style, children, ...rest }) {
  // id pattern harus unik (di web semua SVG berbagi namespace id yang sama)
  const id = useRef(`slStripes${++counter}`).current;
  return (
    <View style={[{ backgroundColor: tint, overflow: 'hidden' }, style]} {...rest}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={band * 2} height={band * 2} patternTransform="rotate(45)">
            <Rect x="0" y="0" width={band} height={band * 2} fill={stripe} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}
