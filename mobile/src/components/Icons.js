import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Ikon stroke 24-grid, sama persis dengan path SVG di prototipe desain
const base = (size, color, width = 2) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const HomeIcon = ({ size = 22, color = colors.inkMuted }) => (
  <Svg {...base(size, color)}>
    <Path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
  </Svg>
);

export const SearchIcon = ({ size = 22, color = colors.inkMuted }) => (
  <Svg {...base(size, color)}>
    <Circle cx="11" cy="11" r="7" />
    <Path d="m20 20-3.5-3.5" />
  </Svg>
);

export const SearchMinusIcon = ({ size = 24, color = colors.inkMuted }) => (
  <Svg {...base(size, color)}>
    <Circle cx="11" cy="11" r="7" />
    <Path d="m20 20-3.5-3.5M8 11h6" />
  </Svg>
);

export const UserIcon = ({ size = 22, color = colors.inkMuted }) => (
  <Svg {...base(size, color)}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </Svg>
);

export const BookmarkIcon = ({ size = 18, filled = false, color }) => {
  const c = color || (filled ? colors.primary : colors.inkMuted);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth={2} strokeLinejoin="round">
      <Path d="M6 3h12v18l-6-4-6 4z" />
    </Svg>
  );
};

export const PlayIcon = ({ size = 22, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M7 4v16l13-8z" />
  </Svg>
);

export const MailIcon = ({ size = 28, color = colors.primary, strokeWidth = 2 }) => (
  <Svg {...base(size, color, strokeWidth)}>
    <Rect x="3" y="5" width="18" height="14" rx="2" />
    <Path d="m3 7 9 6 9-6" />
  </Svg>
);

export const ClockIcon = ({ size = 22, color = colors.inkMuted }) => (
  <Svg {...base(size, color)}>
    <Circle cx="12" cy="12" r="8" />
    <Path d="M12 8v4l3 2" />
  </Svg>
);

export const AlertIcon = ({ size = 26, color = colors.danger }) => (
  <Svg {...base(size, color)}>
    <Path d="M12 8v5M12 16.5v.5M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </Svg>
);

export const SadIcon = ({ size = 26, color = colors.inkMuted }) => (
  <Svg {...base(size, color)}>
    <Path d="M9 9h.01M15 9h.01M8 16c1.2-1 2.5-1.5 4-1.5s2.8.5 4 1.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
  </Svg>
);

export const ArrowLeftIcon = ({ size = 22, color = colors.ink }) => (
  <Svg {...base(size, color, 1.8)}>
    <Path d="M20 12H4M10 6l-6 6 6 6" />
  </Svg>
);

export const CloseIcon = ({ size = 18, color = colors.ink, strokeWidth = 1.8 }) => (
  <Svg {...base(size, color, strokeWidth)}>
    <Path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const CheckIcon = ({ size = 14, color = colors.white, strokeWidth = 3 }) => (
  <Svg {...base(size, color, strokeWidth)}>
    <Path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const BookIcon = ({ size = 22, color = colors.primary }) => (
  <Svg {...base(size, color)}>
    <Path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <Path d="M4 19V5M8 7h7" />
  </Svg>
);
