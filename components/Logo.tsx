import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/lib/theme';

type Props = {
  size?: number;
  /** 'icon' = blue rounded-square app icon · 'mark' = transparent logo mark */
  variant?: 'icon' | 'mark';
};

// "R + Door" — an R monogram whose left stem opens like a door.
export default function Logo({ size = 96, variant = 'icon' }: Props) {
  const isIcon = variant === 'icon';
  const rFill    = isIcon ? Colors.white : Colors.primary;
  const doorFill = isIcon ? Colors.soft  : Colors.soft;
  const dotFill  = isIcon ? Colors.primary : Colors.white;

  // The R letterform (with an evenodd counter punched out of the bowl)
  const R_PATH =
    'M30 22 H52 C66 22 74 30 74 41 C74 50 68 57 58 59 L74 82 H58 L44 60 V82 H30 Z ' +
    'M44 35 V49 H52 C58 49 61 46 61 41 C61 36 58 35 52 35 Z';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {isIcon && (
        <>
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={Colors.sky} />
              <Stop offset="1" stopColor={Colors.primary} />
            </LinearGradient>
          </Defs>
          <Rect x="2" y="2" width="96" height="96" rx="24" fill="url(#bg)" />
        </>
      )}

      {/* R monogram */}
      <Path d={R_PATH} fill={rFill} fillRule="evenodd" />

      {/* Open door slab (perspective parallelogram) */}
      <Path d="M35 33 L49 37 L49 79 L35 75 Z" fill={doorFill} opacity={0.95} />

      {/* Door handle dot */}
      <Circle cx="45" cy="58" r="2.4" fill={dotFill} />
    </Svg>
  );
}
