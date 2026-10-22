export function Ring({ value, size = 120, stroke = 10, track = '#E7EAF3', color = '#16A34A', children, glow }: { value: number; size?: number; stroke?: number; track?: string; color?: string; children?: React.ReactNode; glow?: boolean }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs><linearGradient id={`rg${size}`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#4ADE80" /><stop offset="1" stopColor={color} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={`url(#rg${size})`} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value / 100)))} style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)', filter: glow ? 'drop-shadow(0 0 8px rgba(74,222,128,.6))' : undefined }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
