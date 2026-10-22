import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, X, ChevronRight } from 'lucide-react'
import { SCENARIOS, type Scenario } from '../lib/demo'
import { useStore } from '../lib/store'
import { cx, toast } from './ui'

export function ScenarioList({ onPick, dense }: { onPick?: () => void; dense?: boolean }) {
  const nav = useNavigate()
  const offline = useStore((s) => s.demo.offline)
  const groups = [...new Set(SCENARIOS.map((s) => s.group))]
  const run = (s: Scenario) => {
    if (s.id === 'reset' && !confirm('Reset all demo data in this browser?')) return
    s.run(nav); onPick?.()
    if (s.id === 'offline') toast(offline ? 'Back online' : 'Offline mode on', 'info')
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">{g}</p>
          <div className={cx('overflow-hidden rounded-2xl bg-white ring-1 ring-line', dense && 'ring-white/10 bg-white/5')}>
            {SCENARIOS.filter((s) => s.group === g).map((s, i) => (
              <button key={s.id} onClick={() => run(s)} className={cx('flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition', i && (dense ? 'border-t border-white/10' : 'border-t border-line'), dense ? 'hover:bg-white/10' : 'hover:bg-bg')}>
                <div className="min-w-0 flex-1">
                  <p className={cx('text-[13px] font-semibold', dense ? 'text-white' : 'text-navy')}>{s.title}{s.id === 'offline' && offline && <span className="ml-1.5 rounded bg-amber-400/20 px-1.5 text-[10px] text-amber-500">ON</span>}</p>
                  <p className={cx('truncate text-[11.5px]', dense ? 'text-white/55' : 'text-ink-2')}>{s.desc}</p>
                </div>
                <ChevronRight className={cx('h-4 w-4 flex-none', dense ? 'text-white/40' : 'text-ink-3')} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DemoFab({ className, pill }: { className?: string; pill?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open demo scenarios" title="Demo scenarios"
        className={cx(pill ? 'absolute bottom-6 right-6 z-30 flex h-10 items-center gap-1.5 rounded-full bg-navy pl-3 pr-3.5 text-[12px] font-semibold text-white shadow-lift transition hover:bg-navy-700 active:scale-95'
          : 'absolute right-0 top-[42%] z-30 flex flex-col items-center gap-1.5 rounded-l-xl bg-navy/85 px-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/90 shadow-lift backdrop-blur transition hover:bg-navy hover:pr-2.5', className)}>
        <FlaskConical className="h-3.5 w-3.5 text-ev-400" /><span style={pill ? undefined : { writingMode: 'vertical-rl' }}>Demo</span>
      </button>
      {open && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Demo scenarios">
          <button aria-label="Close" className="absolute inset-0 bg-navy/50 animate-fade" onClick={() => setOpen(false)} />
          <div className="no-scrollbar relative max-h-[86%] overflow-y-auto rounded-t-[28px] bg-bg px-4 pb-6 pt-3 animate-sheet">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-navy-100" />
            <div className="mb-3 flex items-start justify-between px-1">
              <div><h2 className="text-lg font-bold">Demo scenarios</h2><p className="text-[12px] text-ink-2">Jump to any edge case. Demo time runs faster than real time.</p></div>
              <button aria-label="Close" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-card"><X className="h-4 w-4" /></button>
            </div>
            <ScenarioList onPick={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
