// ─── Roomiee.app brand system ───────────────────────────────────────────────
// "R + Door" — welcome, opportunity, the start of better shared living.
// Brand vibe: Trustworthy · Inclusive · Organized · Friendly — and cute.

export const Colors = {
  // Brand blues (from the official palette)
  primary:     '#4DA3FF', // Azure Blue — primary brand
  primaryDark: '#2D8FEF', // pressed / emphasis
  sky:         '#6CB8FF', // Sky Blue
  ice:         '#8ED0FF', // Ice Blue
  soft:        '#BFE6FF', // Soft Blue
  mist:        '#EAF3FF', // lightest tint

  secondary:   '#6CB8FF',

  // Semantic (kept distinct for financial clarity)
  success:     '#2BB673', // owed / positive
  warning:     '#FFB347', // due soon
  danger:      '#FF6B81', // owe / overdue (soft rose instead of harsh red)

  // Neutrals
  bg:          '#F6F8FF', // app background — airy blue-white
  card:        '#FFFFFF',
  border:      '#EAF0FB',
  text:        '#1B2A4A', // deep navy (wordmark color)
  textSub:     '#8A97B4', // muted slate-blue
  white:       '#FFFFFF',
};

// Soft pastel accents: tile/chip backgrounds with a matching deeper "ink".
export const Pastel = {
  sky:      { bg: '#E6F2FF', ink: '#3D8FEA' },
  mint:     { bg: '#E3F8EE', ink: '#23A365' },
  peach:    { bg: '#FFEDE3', ink: '#E8834F' },
  lavender: { bg: '#F0EAFF', ink: '#8A6CE0' },
  butter:   { bg: '#FFF6DC', ink: '#D9A21B' },
  rose:     { bg: '#FFE8EE', ink: '#E5577A' },
};
export type PastelName = keyof typeof Pastel;

// Distinct, on-brand avatar colors for roommates
export const AvatarColors = ['#4DA3FF', '#2BB673', '#FF8FA3', '#9B7EDE', '#FFB347'];

export const Radius = { sm: 10, md: 16, lg: 22, xl: 30, full: 999 };

export const Shadow = {
  sm: { shadowColor: '#4D6FA8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  md: { shadowColor: '#4D6FA8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 5 },
};

// Font weights tuned for Inter (the brand typeface)
export const Font = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  extra:    '800' as const,
};
