/** Hand-built illustrations (SVG) so the app has no external image dependencies. */
export function HeroArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 230" className={className} aria-hidden>
      <defs>
        <linearGradient id="van" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#DCE3EF" /></linearGradient>
        <linearGradient id="car" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#22C55E" /><stop offset="1" stopColor="#15803D" /></linearGradient>
        <radialGradient id="glow"><stop offset="0" stopColor="#4ADE80" stopOpacity=".55" /><stop offset="1" stopColor="#4ADE80" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="170" cy="206" rx="160" ry="12" fill="#000" opacity=".25" />
      <circle cx="176" cy="132" r="70" fill="url(#glow)" />
      {/* van */}
      <g>
        <path d="M18 92 q0-22 22-22 h92 q12 0 20 10 l22 28 q6 6 6 16 v62 q0 10-10 10 H28 q-10 0-10-10 z" fill="url(#van)" />
        <path d="M140 84 l22 26 h-30 v-26 z" fill="#0F1B3D" opacity=".85" />
        <rect x="18" y="140" width="162" height="10" fill="#16A34A" />
        <rect x="36" y="88" width="80" height="40" rx="10" fill="#0F1B3D" />
        <path d="M80 96 l-12 15 h8 l-3 12 12-16 h-8 z" fill="#4ADE80" />
        <text x="58" y="171" fontSize="11" fontWeight="800" fill="#0F1B3D" fontFamily="Inter">FuelDrop</text>
        <circle cx="54" cy="194" r="15" fill="#0F1B3D" /><circle cx="54" cy="194" r="6" fill="#8A92A6" />
        <circle cx="148" cy="194" r="15" fill="#0F1B3D" /><circle cx="148" cy="194" r="6" fill="#8A92A6" />
        <rect x="170" y="150" width="12" height="16" rx="3" fill="#0F1B3D" />
      </g>
      {/* cable */}
      <path d="M182 158 C 210 200, 228 120, 250 150" stroke="#0F1B3D" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M182 158 C 210 200, 228 120, 250 150" stroke="#4ADE80" strokeWidth="2" fill="none" strokeDasharray="3 9" strokeLinecap="round" className="animate-flow" />
      {/* car */}
      <g>
        <path d="M232 160 q2-26 24-30 l14-20 q6-8 18-8 h22 q12 0 18 10 l10 18 q12 4 12 18 v16 q0 8-8 8 H240 q-8 0-8-8 z" fill="url(#car)" />
        <path d="M276 112 h30 q6 0 9 6 l8 14 h-58 z" fill="#0F1B3D" opacity=".75" />
        <circle cx="258" cy="190" r="14" fill="#0F1B3D" /><circle cx="258" cy="190" r="5.5" fill="#8A92A6" />
        <circle cx="320" cy="190" r="14" fill="#0F1B3D" /><circle cx="320" cy="190" r="5.5" fill="#8A92A6" />
        <rect x="244" y="148" width="10" height="8" rx="2" fill="#0F1B3D" />
      </g>
      {/* sparks */}
      {[[200, 60], [240, 40], [300, 70], [120, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 2.5 : 3.5} fill="#4ADE80" className="animate-bolt" style={{ animationDelay: `${i * .3}s` }} />)}
    </svg>
  )
}

export function PinArt({ tone = '#16A34A', cross = false }: { tone?: string; cross?: boolean }) {
  return (
    <svg viewBox="0 0 160 140" className="h-36 w-40" aria-hidden>
      <ellipse cx="80" cy="124" rx="44" ry="8" fill="#0F1B3D" opacity=".08" />
      <circle cx="80" cy="62" r="52" fill={tone} opacity=".08" />
      <circle cx="80" cy="62" r="36" fill={tone} opacity=".12" />
      <path d="M80 20c-17 0-30 13-30 30 0 22 30 56 30 56s30-34 30-56c0-17-13-30-30-30z" fill={tone} />
      <circle cx="80" cy="50" r="11" fill="#fff" />
      {cross && <g stroke="#fff" strokeWidth="4" strokeLinecap="round"><path d="M74 44l12 12M86 44L74 56" stroke={tone} /></g>}
    </svg>
  )
}
