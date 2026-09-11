import Svg, { Circle, Rect, Path, G, Ellipse } from 'react-native-svg';

// viewBox 240×230 — card fills 75% of width, bars are tall and clear
export default function PricesIllustration({ size = 240 }: { size?: number }) {
  const h = size * (230 / 240);
  return (
    <Svg width={size} height={h} viewBox="0 0 240 230">

      {/* ── Background glow ── */}
      <Circle cx="118" cy="110" r="104" fill="rgba(255,255,255,0.13)" />

      {/* ── Card shadow ── */}
      <Ellipse cx="112" cy="182" rx="76" ry="9" fill="rgba(0,0,0,0.10)" />

      {/* ── White card ── */}
      <Rect x="16" y="34" width="182" height="134" rx="18" fill="white" />

      {/* ── Subtle chart grid ── */}
      <Path d="M38 144 L186 144" stroke="#E8F5E9" strokeWidth="1.5" />
      <Path d="M38 122 L186 122" stroke="#E8F5E9" strokeWidth="1.5" />
      <Path d="M38 100 L186 100" stroke="#E8F5E9" strokeWidth="1.5" />
      <Path d="M38 78  L186 78"  stroke="#E8F5E9" strokeWidth="1.5" />

      {/* ── Chart bars (4, ascending) ── */}
      {/* Bar 1 — shortest */}
      <Rect x="46"  y="130" width="26" height="14" rx="5" fill="#B2DFDB" />
      {/* Bar 2 */}
      <Rect x="80"  y="108" width="26" height="36" rx="5" fill="#80CBC4" />
      {/* Bar 3 */}
      <Rect x="114" y="82"  width="26" height="62" rx="5" fill="#4DB6AC" />
      {/* Bar 4 — tallest */}
      <Rect x="148" y="56"  width="26" height="88" rx="5" fill="#2E7D32" />

      {/* ── Up-arrow circle (overlapping card top-right) ── */}
      <Circle cx="184" cy="44" r="26" fill="#43A047" />
      <Path d="M184 56 L184 33"
        stroke="white" strokeWidth="3" strokeLinecap="round" />
      <Path d="M176 41 L184 33 L192 41"
        stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* ── Tomato (bottom-left) ── */}
      <G>
        <Circle cx="50" cy="192" r="20" fill="#E53935" />
        <Rect x="48.5" y="169" width="3" height="9" rx="1.5" fill="#33691E" />
        <Path d="M49 174 Q40 165 46 175" fill="#558B2F" />
        <Path d="M53 174 Q62 165 56 175" fill="#558B2F" />
        <Ellipse cx="44" cy="186" rx="4" ry="6" fill="rgba(255,255,255,0.24)" />
      </G>

      {/* ── Leaf plant (bottom-right) ── */}
      <G>
        <Rect x="198" y="186" width="3" height="16" rx="1.5" fill="#33691E" />
        {/* Left leaf */}
        <Path d="M199 192 Q186 174 193 165 Q210 168 205 184 Q202 192 199 192Z" fill="#66BB6A" />
        <Path d="M199 192 Q200 178 193 165" stroke="#43A047" strokeWidth="1.6" fill="none" />
        {/* Right leaf */}
        <Path d="M201 188 Q214 170 222 175 Q218 190 208 192 Q204 193 201 188Z" fill="#81C784" />
        <Path d="M201 188 Q214 176 222 175" stroke="#43A047" strokeWidth="1.6" fill="none" />
      </G>

    </Svg>
  );
}
