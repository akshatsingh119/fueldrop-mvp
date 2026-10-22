import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Smartphone, Building2, MonitorDot, ExternalLink, Signal, Wifi, BatteryFull } from 'lucide-react'
import { Logo, Toaster, cx } from './ui'
import { DemoFab, ScenarioList } from './DemoMenu'
import { useStore, isActive } from '../lib/store'

export const useMedia = (q: string) => {
  const [m, set] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => { const mq = window.matchMedia(q); const f = () => set(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f) }, [q])
  return m
}

function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 15000); return () => clearInterval(i) }, [])
  return <>{t.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })}</>
}

export function AppFrame({ children }: { children: ReactNode }) {
  const desktop = useMedia('(min-width: 1024px)')
  const loc = useLocation()
  const hideFab = loc.pathname === '/'
  const inner = (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      {children}
      <Toaster />
      {!hideFab && !desktop && <DemoFab />}
    </div>
  )
  if (!desktop) return <div className="h-[100dvh] w-full">{inner}</div>
  return <DesktopStage>{inner}</DesktopStage>
}

function LiveCard() {
  const b = useStore((s) => s.bookings.find((x) => x.source === 'me' && isActive(x)))
  if (!b) return <p className="text-[13px] text-white/50">No active booking. Book a charge in the phone to see it appear in the ops console.</p>
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ev-400">Live booking · {b.id}</p>
      <p className="mt-1 text-[15px] font-semibold text-white">{b.vehicle.name}</p>
      <p className="text-[12.5px] text-white/60">{b.status.replace('_', ' ')} · {b.estKwh} kWh est.</p>
    </div>
  )
}

function DesktopStage({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center gap-14 overflow-hidden bg-navy-900 px-10 py-8">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-ev/20 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 right-0 h-[520px] w-[520px] rounded-full bg-brand/15 blur-[140px]" />
      <aside className="relative z-10 hidden w-[340px] flex-none xl:block">
        <Logo size={36} light />
        <h1 className="mt-8 text-[40px] font-extrabold leading-[1.08] tracking-tight text-white">Doorstep EV charging,<br /><span className="text-ev-400">booked in a tap.</span></h1>
        <p className="mt-4 text-[15px] leading-6 text-white/65">A charging van comes to where your car, scooter or e-auto is parked. Launching for EV owners in Delhi NCR and Bengaluru (sample zones); fleets are in early access.</p>
        <div className="mt-8 space-y-2.5">
          {[{ to: '/home', icon: Smartphone, t: 'Customer app', d: 'You’re looking at it' }, { to: '/fleet', icon: Building2, t: 'FuelDrop for Business', d: 'Early access · fleets come later' }, { to: '/admin', icon: MonitorDot, t: 'Ops console', d: 'Opens in a new tab — stays in sync', ext: true }].map((x) => (
            <Link key={x.t} to={x.to} target={x.ext ? '_blank' : undefined} className="group flex items-center gap-3 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 transition hover:bg-white/10">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-ev/15 text-ev-400"><x.icon className="h-5 w-5" /></span>
              <span className="flex-1"><span className="block text-[14px] font-semibold text-white">{x.t}</span><span className="block text-[12px] text-white/55">{x.d}</span></span>
              {x.ext && <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-white" />}
            </Link>
          ))}
        </div>
        <p className="mt-8 text-[11.5px] leading-5 text-white/40">Demo MVP with sample data. Not a live service — no real payments, SMS or dispatch.</p>
      </aside>

      <div className="relative z-10 flex-none">
        <div className="relative h-[844px] max-h-[calc(100vh-64px)] w-[390px] rounded-[54px] bg-[#05091A] p-[10px] shadow-[0_40px_120px_rgba(0,0,0,.55),inset_0_0_0_2px_rgba(255,255,255,.08)]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[44px] bg-bg">
            <div className="relative z-20 flex h-11 flex-none items-center justify-between bg-bg px-7 text-[14px] font-semibold text-navy">
              <span className="tabular-nums"><Clock /></span>
              <span className="absolute left-1/2 top-2 h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-[#05091A]" />
              <span className="flex items-center gap-1.5"><Signal className="h-4 w-4" /><Wifi className="h-4 w-4" /><BatteryFull className="h-5 w-5" /></span>
            </div>
            <div className="relative min-h-0 flex-1">{children}</div>
          </div>
        </div>
      </div>

      <aside className="relative z-10 hidden w-[320px] flex-none lg:block">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white/45">Live</p>
        <LiveCard />
        <p className="mb-3 mt-7 text-[11px] font-bold uppercase tracking-wider text-white/45">Demo scenarios</p>
        <div className={cx('no-scrollbar max-h-[calc(100vh-260px)] overflow-y-auto pr-1')}><ScenarioList dense /></div>
      </aside>
    </div>
  )
}

export function PhoneShell() { return <AppFrame><Outlet /></AppFrame> }
