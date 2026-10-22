import type { ReactNode } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Car, CalendarClock, FileText, Users, CreditCard, ListChecks, ArrowLeft } from 'lucide-react'
import { Logo, Toaster, cx, Badge, OfflineBanner } from '../../components/ui'
import { DemoFab } from '../../components/DemoMenu'
import { useStore } from '../../lib/store'
import { useMedia } from '../../components/PhoneShell'

const NAV = [
  { to: '/fleet', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/fleet/vehicles', label: 'Vehicles', icon: Car },
  { to: '/fleet/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/fleet/bookings', label: 'Sessions', icon: ListChecks },
  { to: '/fleet/invoices', label: 'Invoices', icon: FileText },
  { to: '/fleet/team', label: 'Team', icon: Users },
  { to: '/fleet/credit', label: 'Credit', icon: CreditCard },
]

export function FleetShell() {
  const biz = useStore((s) => s.fleet.business)
  const desktop = useMedia('(min-width: 1024px)')
  const nav = useNavigate()
  return (
    <div className="relative flex h-[100dvh] bg-bg">
      {desktop && (
        <aside className="flex w-[248px] flex-none flex-col bg-navy px-4 py-5 text-white">
          <div className="px-2"><Logo size={28} light /></div>
          <div className="mt-2 px-2"><Badge tone="ev" className="!bg-ev/20 !text-ev-400">for Business · Early access</Badge></div>
          <nav className="mt-7 space-y-1" aria-label="Fleet">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition', isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}><n.icon className="h-[18px] w-[18px]" />{n.label}</NavLink>)}
          </nav>
          <div className="mt-auto rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
            <p className="text-[13px] font-semibold">{biz?.name ?? 'No business yet'}</p>
            <p className="text-[11.5px] text-white/50">{biz ? `GSTIN ${biz.gstin}` : 'Set up your account'}</p>
          </div>
          <Link to="/home" className="mt-3 flex items-center gap-2 px-2 text-[12.5px] font-semibold text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" /> Personal app</Link>
        </aside>
      )}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        {!desktop && (
          <header className="flex items-center justify-between bg-navy px-5 py-3 text-white">
            <button onClick={() => nav('/home')} aria-label="Back to personal app"><Logo size={24} light /></button>
            <Badge tone="ev" className="!bg-ev/20 !text-ev-400">Business · Early access</Badge>
          </header>
        )}
        <main className="no-scrollbar flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1120px] px-5 py-5 lg:px-10 lg:py-8"><Outlet /></div>
        </main>
        {!desktop && (
          <nav aria-label="Fleet" className="no-scrollbar flex overflow-x-auto border-t border-line bg-white px-1 pb-3 pt-1.5">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex min-w-[64px] flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-semibold', isActive ? 'text-ev-700' : 'text-ink-3')}><n.icon className="h-[18px] w-[18px]" />{n.label}</NavLink>)}
          </nav>
        )}
        <Toaster />
        <DemoFab pill={desktop} />
      </div>
    </div>
  )
}

export const PageHead = ({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-[24px] font-extrabold tracking-tight lg:text-[28px]">{title}</h1>{sub && <p className="mt-0.5 text-[13.5px] text-ink-2">{sub}</p>}</div>
    {action}
  </div>
)
