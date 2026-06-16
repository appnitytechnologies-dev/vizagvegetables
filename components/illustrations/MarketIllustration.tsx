import Svg, { Circle, Rect, Path, G } from 'react-native-svg';

// viewBox 240×230 — large location pin, clear map card, dashed route
export default function MarketIllustration({ size = 240 }: { size?: number }) {
  const h = size * (230 / 240);
  return (
    <Svg width={size} height={h} viewBox="0 0 240 230">

      {/* ── Background glow ── */}
      <Circle cx="118" cy="112" r="104" fill="rgba(255,255,255,0.13)" />

      {/* ── Map card ── */}
      <Rect x="14" y="90" width="200" height="118" rx="22" fill="white" opacity="0.92" />

      {/* ── Inner map surface ── */}
      <Rect x="26" y="102" width="176" height="94" rx="14" fill="#F1F8F1" />

      {/* ── Dashed route ── */}
      <Path
        d="M42 170 Q62 154 88 162 Q116 171 144 156 Q162 147 196 158"
        stroke="#B0BEC5" strokeWidth="2.8" strokeDasharray="7 5" fill="none"
      />

      {/* ── Start dot (amber) ── */}
      <Circle cx="42" cy="170" r="9" fill="#F59E0B" />
      <Circle cx="42" cy="170" r="5" fill="white" />

      {/* ── End dot (green) ── */}
      <Circle cx="196" cy="158" r="9" fill="#43A047" />
      <Circle cx="196" cy="158" r="5" fill="white" />

      {/* ── Location pin ── */}
      <G transform="translate(118, 62)">
        {/* Outer teardrop */}
        <Path
          d="M0 -54 C-28 -54 -46 -34 -46 -12 C-46 12 0 52 0 52 C0 52 46 12 46 -12 C46 -34 28 -54 0 -54Z"
          fill="#1B5E20"
        />
        {/* White inner circle */}
        <Circle cy="-12" r="28" fill="white" />
        {/* House — roof */}
        <Path
          d="M-13 -12 L0 -26 L13 -12"
          stroke="#2E7D32" strokeWidth="2.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* House — body */}
        <Rect
          x="-11" y="-12" width="22" height="16" rx="2"
          fill="none" stroke="#2E7D32" strokeWidth="2.5"
        />
        {/* House — door */}
        <Rect x="-4" y="-3" width="8" height="7" rx="1.5" fill="#2E7D32" />
      </G>

      {/* ── Sparkle marks ── */}
      <Path d="M44 104 L44 94 M38 99 L50 99"
        stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M192 98 L192 88 M186 93 L198 93"
        stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M26 134 L26 126 M22 130 L30 130"
        stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />

    </Svg>
  );
}
