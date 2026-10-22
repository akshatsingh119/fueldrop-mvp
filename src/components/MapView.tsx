import { useLayoutEffect, useRef, useState } from 'react'
import { Zap, House } from 'lucide-react'

const ROUTE = 'M 62 92 L 62 182 L 168 182 L 168 262 L 292 262 L 292 338'

/** A stylised, offline city map with the van travelling along the route. */
export function MapView({ progress, label, className = '', showRoute = true, vans }: { progress: number; label?: string; className?: string; showRoute?: boolean; vans?: { x: number; y: number; battery: number; id: string; busy: boolean }[] }) {
  const ref = useRef<SVGPathElement>(null)
  const [pt, setPt] = useState({ x: 62, y: 92 })
  const [len, setLen] = useState(0)
  useLayoutEffect(() => {
    const p = ref.current; if (!p) return
    const L = p.getTotalLength(); setLen(L)
    const q = p.getPointAtLength(L * Math.min(1, Math.max(0, progress))); setPt({ x: q.x, y: q.y })
  }, [progress])
  return (
    <div className={(className.includes('absolute') ? '' : 'relative ') + 'overflow-hidden bg-[#E9EEF4] ' + className}>
      <svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#D7DFEA" /></pattern>
          <linearGradient id="routeG" x1="0" x2="1"><stop offset="0" stopColor="#16A34A" /><stop offset="1" stopColor="#22C55E" /></linearGradient>
          <filter id="sh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0F1B3D" floodOpacity=".25" /></filter>
        </defs>
        <rect width="360" height="420" fill="url(#dots)" />
        {/* blocks */}
        {[[12, 12, 38, 68], [80, 12, 76, 68], [186, 12, 94, 40], [300, 12, 48, 120], [12, 112, 38, 58], [80, 112, 76, 58], [186, 74, 94, 96], [12, 202, 140, 48], [186, 202, 94, 48], [300, 152, 48, 98], [12, 280, 140, 60], [186, 280, 94, 46], [12, 360, 140, 50], [186, 356, 94, 54], [312, 360, 36, 50]].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="8" fill="#F7F9FC" stroke="#E1E7F0" />
        ))}
        {/* park + lake */}
        <rect x="190" y="78" width="86" height="88" rx="14" fill="#D7F0DE" />
        <circle cx="222" cy="110" r="9" fill="#BFE6CB" /><circle cx="248" cy="134" r="12" fill="#BFE6CB" />
        <path d="M 16 290 q 40 -18 80 0 t 52 30 l 0 16 l -132 0 z" fill="#D3E6F8" />
        {/* roads */}
        <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
          <path d="M 62 0 V 420 M 168 0 V 420 M 292 0 V 420" strokeWidth="14" />
          <path d="M 0 92 H 360 M 0 182 H 360 M 0 262 H 360 M 0 346 H 360" strokeWidth="14" />
        </g>
        <g stroke="#E3E9F2" strokeWidth="1" strokeDasharray="6 8" fill="none">
          <path d="M 62 0 V 420 M 168 0 V 420 M 292 0 V 420 M 0 92 H 360 M 0 182 H 360 M 0 262 H 360 M 0 346 H 360" />
        </g>
        <text x="96" y="178" fontSize="8" fill="#9AA4B8" fontWeight="600" letterSpacing=".5">27TH MAIN RD</text>
        <text x="200" y="258" fontSize="8" fill="#9AA4B8" fontWeight="600" letterSpacing=".5">SECTOR 2</text>
        <text x="206" y="124" fontSize="8" fill="#5FA877" fontWeight="600">Agara Park</text>
        {showRoute && <>
          <path ref={ref} d={ROUTE} stroke="#0F1B3D" strokeOpacity=".12" strokeWidth="9" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={ROUTE} stroke="url(#routeG)" strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={len ? `${len} ${len}` : undefined} strokeDashoffset={len * Math.min(1, progress)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          <path d={ROUTE} stroke="#fff" strokeWidth="1.6" fill="none" strokeDasharray="2 10" strokeLinecap="round" className="animate-flow" opacity=".9" />
        </>}
        {vans?.map((v) => (
          <g key={v.id} transform={`translate(${v.x} ${v.y})`} filter="url(#sh)">
            <circle r="13" fill={v.busy ? '#0F1B3D' : '#16A34A'} stroke="#fff" strokeWidth="3" />
            <text y="3.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">{v.battery}</text>
          </g>
        ))}
        {showRoute && <>
          <g transform="translate(292 338)">
            <circle r="16" fill="#FF6A2B" opacity=".35" className="animate-ring" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            <circle r="16" fill="#FF6A2B" stroke="#fff" strokeWidth="3" filter="url(#sh)" />
            <House x={-8} y={-8} width={16} height={16} color="#fff" strokeWidth={2.4} />
          </g>
          <g style={{ transform: `translate(${pt.x}px, ${pt.y}px)`, transition: 'transform 1s linear' }}>
            <circle r="18" fill="#16A34A" opacity=".35" className="animate-ring" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            <circle r="18" fill="#0F1B3D" stroke="#fff" strokeWidth="3.5" filter="url(#sh)" />
            <Zap x={-9} y={-9} width={18} height={18} color="#4ADE80" fill="#4ADE80" />
            {label && <g transform="translate(0 -36)">
              <rect x={-(label.length * 3.1 + 14)} y="-12" width={label.length * 6.2 + 28} height="24" rx="12" fill="#0F1B3D" filter="url(#sh)" />
              <text textAnchor="middle" y="4" fontSize="10.5" fontWeight="600" fill="#fff">{label}</text>
            </g>}
          </g>
        </>}
      </svg>
    </div>
  )
}
