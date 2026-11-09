// Ikon stroke 24-grid yang sama persis dengan prototipe (inline SVG, tanpa dependency tambahan)

function Svg({ size = 24, children, stroke = 'currentColor', fill = 'none', strokeWidth = 2, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function Logo({ size = 32, inverted = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill={inverted ? '#fff' : 'var(--sl-primary)'} />
      <path
        d="M8 23h5v-5h5v-5h5"
        stroke={inverted ? 'var(--sl-primary)' : '#fff'}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.5" cy="8.5" r="2.6" fill="var(--sl-accent)" />
    </svg>
  );
}

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const SearchMinusIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5M8 11h6" />
  </Svg>
);

export const BookmarkIcon = ({ filled = false, ...p }) => (
  <Svg fill={filled ? 'currentColor' : 'none'} strokeLinejoin="miter" strokeLinecap="butt" {...p}>
    <path d="M6 3h12v18l-6-4-6 4z" />
  </Svg>
);

export const PlayIcon = (p) => (
  <Svg fill="currentColor" stroke="none" {...p}>
    <path d="M7 4v16l13-8z" />
  </Svg>
);

export const MailIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

export const AlertIcon = (p) => (
  <Svg {...p}>
    <path d="M12 8v5M12 16.5v.5M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </Svg>
);

export const FrownIcon = (p) => (
  <Svg {...p}>
    <path d="M9 9h.01M15 9h.01M8 16c1.2-1 2.5-1.5 4-1.5s2.8.5 4 1.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
  </Svg>
);

export const ClockIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </Svg>
);

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12.5 10 17l9-10" />
  </Svg>
);

export const XIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const KeyIcon = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9M17 6l3 3M14 9l2 2" />
  </Svg>
);
