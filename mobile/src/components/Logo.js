import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Logo SkillLearn: kotak rounded + tangga + titik accent. inverted = versi putih untuk latar teal.
export default function Logo({ size = 32, inverted = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityLabel="SkillLearn logo">
      <Rect width="32" height="32" rx="9" fill={inverted ? colors.white : colors.primary} />
      <Path
        d="M8 23h5v-5h5v-5h5"
        stroke={inverted ? colors.primary : colors.white}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="23.5" cy="8.5" r="2.6" fill={colors.accent} />
    </Svg>
  );
}
