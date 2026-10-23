// Small line icons drawn for this site. All decorative: the buttons that use them carry their own labels.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export const ArrowIcon = ({ className = 'pill__arrow' }: { className?: string }) => (
  <svg {...base} className={className}>
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

export const WindIcon = () => (
  <svg {...base} className="wind-icon">
    <path d="M3 8h10.5a2.5 2.5 0 1 0-2.5-2.5" />
    <path d="M3 12h15.5a2.5 2.5 0 1 1-2.5 2.5" />
    <path d="M3 16h7" />
  </svg>
);

export const SoundIcon = ({ on }: { on: boolean }) => (
  <svg {...base}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    {on ? (
      <>
        <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
        <path d="M18 6.5a7.8 7.8 0 0 1 0 11" />
      </>
    ) : (
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    )}
  </svg>
);

export const CloseIcon = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const LockIcon = () => (
  <svg {...base} className="lock-icon">
    <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const ChevronUpIcon = () => (
  <svg {...base} className="hint__chevron">
    <path d="M6 15l6-6 6 6" />
  </svg>
);

/** A kite spool (firki): two flanges and a handle, with thread wound between them. */
export const SpoolIcon = () => (
  <svg {...base} viewBox="0 0 24 24" className="spool-icon">
    <path d="M7 6.5h10M7 17.5h10" strokeWidth={2} />
    <path d="M8.5 8.5h7M8.5 10.5h7M8.5 12.5h7M8.5 14.5h7" strokeWidth={1.2} opacity={0.8} />
    <path d="M12 17.5v3" />
  </svg>
);

/** The patang, for the loader. */
export const KiteGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 56" className={className} aria-hidden="true" focusable="false">
    <path d="M20 2 36 20 20 42 4 20Z" fill="#D6336C" />
    <path d="M20 8 25.5 14.5 20 21 14.5 14.5Z" fill="#F2C230" />
    <path d="M20 33 24.5 38 20 42 15.5 38Z" fill="#F2C230" />
    <path d="M4 20Q20 11 36 20M20 2V42" stroke="#6b4a2e" strokeWidth="0.8" fill="none" opacity="0.7" />
    <path d="M20 42 16 52h8Z" fill="#F2C230" />
  </svg>
);

export const HomeIcon = () => (
  <svg {...base} className="pill__icon">
    <path d="M4 11l8-6.5 8 6.5" />
    <path d="M6.5 9.5V19h11V9.5" />
  </svg>
);

export const MailIcon = () => (
  <svg {...base} className="pill__icon">
    <rect x="3.5" y="6" width="17" height="12" rx="2" />
    <path d="M4.5 7.5l7.5 5.5 7.5-5.5" />
  </svg>
);

export const LinkIcon = () => (
  <svg {...base} className="pill__icon">
    <path d="M9 7H6.5A2.5 2.5 0 0 0 4 9.5v8A2.5 2.5 0 0 0 6.5 20h8a2.5 2.5 0 0 0 2.5-2.5V15" />
    <path d="M13 4h7v7M20 4l-9 9" />
  </svg>
);
