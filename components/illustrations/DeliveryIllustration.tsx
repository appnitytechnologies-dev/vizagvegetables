import Svg, {
  Circle, Rect, Path, G, Ellipse, Text as SvgText,
} from 'react-native-svg';

// viewBox: 260 × 240
// Bag is tall (114px body) and wide (76px) — centered at x=108
// "45m" chip floats right of bag via SVG Text
export default function DeliveryIllustration({ size = 260 }: { size?: number }) {
  const h = size * (240 / 260);
  return (
    <Svg width={size} height={h} viewBox="0 0 260 240">

      {/* ── Background glow ── */}
      <Circle cx="112" cy="118" r="104" fill="rgba(255,255,255,0.13)" />

      {/* ── Ground shadow ── */}
      <Ellipse cx="108" cy="228" rx="54" ry="9" fill="rgba(0,0,0,0.12)" />

      {/* ── Bag handle ── */}
      <Path
        d="M84 106 Q84 74 110 74 Q136 74 136 106"
        stroke="#A07840" strokeWidth="6" fill="none" strokeLinecap="round"
      />

      {/* ── Bag body (sides — darker) ── */}
      <Path d="M72 106 L68 220 L152 220 L148 106 Z" fill="#C4975A" />

      {/* ── Bag front panel (lighter) ── */}
      <Path d="M80 106 L77 213 L143 213 L140 106 Z" fill="#E8C685" />

      {/* ── Bag top fold ── */}
      <Rect x="72" y="97" width="76" height="12" rx="4" fill="#BE8E52" />

      {/* ── Carrot (left, large, pointing up-left) ── */}
      <G transform="translate(88, 97)">
        {/* Body — wide at base, tapers to tip */}
        <Path d="M6 0 L-6 -50 L8 -50 L14 0 Z" fill="#FF8F00" />
        {/* Highlight */}
        <Path d="M8 0 L4 -48 L8 -48" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Leaves */}
        <Path d="M-3 -48 Q-12 -62 -6 -68" stroke="#558B2F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M2 -50 Q2 -68 7 -72" stroke="#558B2F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M7 -47 Q16 -60 12 -66" stroke="#558B2F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </G>

      {/* ── Tomato (center) ── */}
      <G transform="translate(114, 76)">
        <Circle r="20" fill="#E53935" />
        {/* Stem */}
        <Rect x="-2" y="-23" width="4" height="10" rx="2" fill="#33691E" />
        {/* Leaves */}
        <Path d="M-3 -20 Q-12 -30 -5 -18" fill="#558B2F" />
        <Path d="M3 -20 Q12 -30 5 -18" fill="#558B2F" />
        {/* Shine */}
        <Ellipse cx="-7" cy="-5" rx="4.5" ry="6.5" fill="rgba(255,255,255,0.26)" />
      </G>

      {/* ── Green leaves (right) ── */}
      <G transform="translate(140, 80)">
        <Path d="M0 6 Q-4 -16 10 -24 Q22 -16 16 -1 Q10 10 0 6Z" fill="#66BB6A" />
        <Path d="M0 6 Q9 -12 10 -24" stroke="#43A047" strokeWidth="1.8" fill="none" />
        <Path d="M2 4 Q18 -8 24 -4 Q20 8 12 8 Q6 9 2 4Z" fill="#81C784" />
        <Path d="M2 4 Q16 -4 24 -4" stroke="#43A047" strokeWidth="1.8" fill="none" />
      </G>

      {/* ── Sparkle marks (both sides) ── */}
      <Path d="M56 102 L56 90 M50 96 L62 96"
        stroke="rgba(255,255,255,0.58)" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M172 98 L172 86 M166 92 L178 92"
        stroke="rgba(255,255,255,0.58)" strokeWidth="2.5" strokeLinecap="round" />

      {/* ── "45m" chip ── */}
      <Rect x="150" y="134" width="76" height="32" rx="16" fill="white" />
      {/* Clock */}
      <Circle cx="168" cy="150" r="9" stroke="#43A047" strokeWidth="2" fill="none" />
      <Path d="M168 145 L168 150 L172 153"
        stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* "45m" text — SVG Text scales with illustration */}
      <SvgText
        x="183" y="155"
        fontSize="13" fontWeight="bold" fill="#1B5E20"
      >45m</SvgText>

    </Svg>
  );
}
