import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Activity, IndianRupee, BatteryCharging, TriangleAlert, ExternalLink, Clock, ChevronRight, X, Truck, RefreshCw, Smartphone } from 'lucide-react'
import { Logo, Card, Badge, Bar, cx, toast, Toaster, Button } from '../../components/ui'
import { MapView } from '../../components/MapView'
import { useStore, update, useNow, assignVan, sessionActions, isActive, cancelBooking, sessionProgress, etaMin, type Booking } from '../../lib/store'
import { ZONES, PARTNERS } from '../../lib/data'
import { inr, inr0, fmtTime, r2, uid } from '../../lib/format'
import { statusLabel, statusTone } from '../customer/Home'

const VAN_POS: Record<string, [number, number]> = { 'VAN-01': [168, 140], 'VAN-02': [62, 230], 'VAN-03': [292, 60], 'VAN-04': [230, 346], 'VAN-05': [110, 262] }
const FILTERS = ['All', 'Needs action', 'Live', 'Scheduled', 'Done'] as const

const nextAction = (b: Booking): string | null => ({ searching: 'Assign van', unassigned: 'Assign van', scheduled: 'Dispatch', en_route: 'Mark arrived', arrived: 'Plugged in', connecting: 'Start charging', charging: 'Complete', paused: 'Complete' } as Record<string, string>)[b.status] ?? null

export function Admin() {
  const s = useStore((x) => x)
  const t = useNow(1000)
  const [city, setCity] = useState<'All' | 'Bengaluru' | 'Delhi NCR'>('All')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [sel, setSel] = useState<string>()
  const zoneCity = (z?: string) => ZONES.find((x) => x.id === z)?.city
  const rows = useMemo(() => [...s.bookings].sort((a, b) => Number(isActive(b)) - Number(isActive(a)) || b.createdAt - a.createdAt).filter((b) => city === 'All' || zoneCity(b.address.zoneId) === city).filter((b) => filter === 'All' ? true : filter === 'Needs action' ? ['searching', 'unassigned', 'failed_handshake', 'interrupted', 'awaiting_payment'].includes(b.status) || !!b.delayed && b.status === 'en_route' : filter === 'Live' ? ['en_route', 'arrived', 'connecting', 'charging', 'paused'].includes(b.status) : filter === 'Scheduled' ? b.status === 'scheduled' : ['completed', 'cancelled', 'interrupted', 'failed_handshake'].includes(b.status)), [s.bookings, city, filter])
  const today = s.bookings.filter((b) => ['completed', 'interrupted'].includes(b.status))
  const kwhToday = r2(today.reduce((a, b) => a + (b.deliveredKwh ?? 0), 0) + s.bookings.filter((b) => b.status === 'charging').reduce((a, b) => a + b.estKwh * sessionProgress(b, t), 0))
  const rev = r2(today.reduce((a, b) => a + (b.finalPrice?.total ?? 0), 0))
  const live = s.bookings.filter((b) => ['en_route', 'arrived', 'connecting', 'charging', 'paused'].includes(b.status)).length
  const needs = s.bookings.filter((b) => ['searching', 'unassigned'].includes(b.status)).length
  const avgBat = Math.round(s.vans.reduce((a, v) => a + v.battery, 0) / s.vans.length)
  const busy = new Set(s.bookings.filter((b) => isActive(b) && b.vanId).map((b) => b.vanId))
  const selected = s.bookings.find((b) => b.id === sel)

  const act = (b: Booking, vanId?: string) => {
    const now = Date.now()
    if (b.status === 'searching' || b.status === 'unassigned' || b.status === 'scheduled') {
      let ok = true; update((st) => { const x = st.bookings.find((y) => y.id === b.id)!; ok = assignVan(st, x, vanId); if (ok && !x.auto) x.auto = x.source !== 'fleet' }); if (!ok) toast('No free van with enough battery in this zone — pick one manually', 'err'); else toast(`${b.id} dispatched`); return
    }
    if (['charging', 'paused'].includes(b.status)) { sessionActions.complete(b.id); toast(`${b.id} completed`); return }
    update((st) => {
      const x = st.bookings.find((y) => y.id === b.id)!
      if (x.status === 'en_route') { x.status = 'arrived'; x.arrivedAt = now; x.timeline.push({ t: now, label: 'Marked arrived by ops' }) }
      else if (x.status === 'arrived') { x.status = 'connecting'; x.connectAt = now; x.timeline.push({ t: now, label: 'Connector plugged in · handshaking' }) }
      else if (x.status === 'connecting') { x.status = 'charging'; x.chargeStartAt = now; x.pausedMs = 0; x.flags.handshakeFail = false; x.timeline.push({ t: now, label: 'Charging started (ops)' }) }
    })
  }
  const delay = (b: Booking) => { update((st) => { const x = st.bookings.find((y) => y.id === b.id)!; x.delayMs += 15000; x.delayed = true; x.timeline.push({ t: Date.now(), label: 'Van running late · +10 min · ₹50 goodwill credit' }); if (x.source === 'me') { st.wallet.balance = r2(st.wallet.balance + 50); st.wallet.txns.unshift({ id: uid('T'), t: Date.now(), label: `Delay goodwill credit · ${x.id}`, amount: 50 }) } }); toast(`${b.id}: +10 min, ₹50 goodwill credited`, 'info') }

  return (
    <div className="relative min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-5 py-3 lg:px-8">
          <Logo size={26} /><span className="rounded-lg bg-navy px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Ops console</span>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ev-700"><span className="h-2 w-2 rounded-full bg-ev animate-bolt" />Live · synced with the customer app in this browser</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-xl bg-bg p-1">{(['All', 'Bengaluru', 'Delhi NCR'] as const).map((c) => <button key={c} onClick={() => setCity(c)} className={cx('rounded-lg px-3 py-1.5 text-[12.5px] font-semibold', city === c ? 'bg-white text-navy shadow-card' : 'text-ink-2')}>{c}</button>)}</div>
            <Link to="/home" target="_blank" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-ink-2 ring-1 ring-line hover:text-navy"><Smartphone className="h-4 w-4" />Customer app<ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[{ i: Activity, l: 'Live sessions', v: String(live), tone: 'bg-ev-100 text-ev-700' }, { i: TriangleAlert, l: 'Need a van', v: String(needs), tone: needs ? 'bg-red-50 text-red-600' : 'bg-navy-100 text-navy' }, { i: Zap, l: 'kWh delivered today', v: kwhToday.toFixed(1), tone: 'bg-ev-100 text-ev-700' }, { i: IndianRupee, l: 'Revenue today (incl. GST)', v: inr0(rev), tone: 'bg-brand-100 text-brand-600' }, { i: BatteryCharging, l: 'Avg van battery', v: `${avgBat}%`, tone: 'bg-blue-50 text-blue-700' }].map((k) => (
            <Card key={k.l} className="!p-4"><div className="flex items-center gap-2"><span className={cx('grid h-8 w-8 place-items-center rounded-lg', k.tone)}><k.i className="h-4 w-4" /></span><p className="text-[12px] font-medium text-ink-2">{k.l}</p></div><p className="mt-2.5 text-[26px] font-extrabold tabular-nums tracking-tight">{k.v}</p></Card>
          ))}
        </div>
        <div className="mt-5 grid gap-5 2xl:grid-cols-[1fr_380px]">
          <Card className="!p-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              <p className="mr-2 font-bold">Bookings</p>
              {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={cx('rounded-full px-3 py-1 text-[12px] font-semibold', filter === f ? 'bg-navy text-white' : 'text-ink-2 hover:bg-bg')}>{f}</button>)}
              <span className="ml-auto text-[12px] text-ink-3">{rows.length} shown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] whitespace-nowrap text-[13px]">
                <thead><tr className="bg-bg/70 text-left text-[11px] font-bold uppercase tracking-wider text-ink-3"><th className="px-4 py-2.5">Booking</th><th className="px-3">Customer</th><th className="px-3">Vehicle</th><th className="px-3">Zone · slot</th><th className="px-3 text-right">kWh</th><th className="px-3">Status</th><th className="px-3">Van</th><th className="px-4 text-right">Action</th></tr></thead>
                <tbody>
                  {rows.map((b) => { const na = nextAction(b); const z = ZONES.find((x) => x.id === b.address.zoneId); const assignable = ['searching', 'unassigned', 'scheduled'].includes(b.status); return (
                    <tr key={b.id} onClick={() => setSel(b.id)} className={cx('cursor-pointer border-t border-line/70 transition hover:bg-bg/60', sel === b.id && 'bg-ev-50/60', b.source === 'me' && 'shadow-[inset_3px_0_0_#16A34A]')}>
                      <td className="px-4 py-3"><p className="font-bold">{b.id}</p><p className="text-[11.5px] text-ink-3">{fmtTime(b.createdAt)} · {b.source === 'me' ? 'You (demo user)' : b.source === 'fleet' ? 'Fleet' : 'Sample'}</p></td>
                      <td className="px-3"><p className="font-medium">{b.customer}</p><p className="text-[11.5px] text-ink-3">{b.phone}</p></td>
                      <td className="px-3"><p className="font-medium">{b.vehicle.name}</p><p className="text-[11.5px] text-ink-3">{b.vehicle.reg} · {b.vehicle.connector}</p></td>
                      <td className="px-3"><p className="font-medium">{z?.name ?? '—'}</p><p className="text-[11.5px] text-ink-3">{b.slot.kind === 'now' ? 'ASAP' : `${b.slot.day}, ${b.slot.label}`}</p></td>
                      <td className="px-3 text-right tabular-nums">{b.status === 'charging' ? `${(b.estKwh * sessionProgress(b, t)).toFixed(1)}/` : ''}{(b.deliveredKwh ?? b.estKwh).toFixed(1)}</td>
                      <td className="px-3"><Badge tone={statusTone(b.status)}>{statusLabel[b.status]}</Badge>{b.status === 'en_route' && <p className={cx('mt-1 text-[11px]', b.delayed ? 'font-semibold text-amber-700' : 'text-ink-3')}>ETA {etaMin(b, t)} min{b.delayed ? ' · late' : ''}</p>}</td>
                      <td className="px-3" onClick={(e) => e.stopPropagation()}>
                        {assignable ? <select aria-label={`Assign van to ${b.id}`} defaultValue="" onChange={(e) => e.target.value && act(b, e.target.value)} className="h-8 rounded-lg bg-white px-2 text-[12px] font-semibold ring-1 ring-line"><option value="">Assign…</option>{s.vans.map((v) => <option key={v.id} value={v.id} disabled={busy.has(v.id) || v.battery < 30}>{v.id} · {v.battery}%{busy.has(v.id) ? ' · busy' : v.battery < 30 ? ' · low' : ''}</option>)}</select>
                          : <span className="text-[12px] font-medium">{b.vanId ?? '—'}</span>}
                      </td>
                      <td className="px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          {b.status === 'en_route' && <button onClick={() => delay(b)} className="rounded-lg px-2 py-1.5 text-[12px] font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50" title="Add 10 min delay"><Clock className="h-3.5 w-3.5" /></button>}
                          {na && <button onClick={() => act(b)} className="inline-flex items-center gap-1 rounded-lg bg-navy px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-navy-700">{na}<ChevronRight className="h-3.5 w-3.5" /></button>}
                          {isActive(b) && b.status !== 'charging' && b.status !== 'paused' && <button aria-label={`Cancel ${b.id}`} onClick={() => { if (confirm(`Cancel ${b.id}? The customer is refunded per policy.`)) { cancelBooking(b.id, 'Cancelled by ops'); toast(`${b.id} cancelled`) } }} className="rounded-lg px-2 py-1.5 text-ink-3 ring-1 ring-line hover:text-red-600"><X className="h-3.5 w-3.5" /></button>}
                        </div>
                      </td>
                    </tr>) })}
                  {!rows.length && <tr><td colSpan={8} className="py-14 text-center text-ink-2">No bookings match this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-1 2xl:content-start">
            <Card className="!p-0 overflow-hidden"><div className="flex items-center justify-between px-4 py-3"><p className="font-bold">Van map</p><span className="flex gap-2 text-[11px] text-ink-2"><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-ev" />Free</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-navy" />Busy</span></span></div>
              <MapView progress={0} showRoute={false} className="h-72" vans={s.vans.map((v) => ({ id: v.id, x: VAN_POS[v.id][0], y: VAN_POS[v.id][1], battery: v.battery, busy: busy.has(v.id) }))} /></Card>
            <Card className="!p-0">
              <p className="px-4 pt-4 font-bold">Vans</p>
              <div className="mt-2 divide-y divide-line">{s.vans.map((v) => { const p = PARTNERS.find((x) => x.id === v.partnerId); const z = ZONES.find((x) => x.id === v.zoneId); return (
                <div key={v.id} className="px-4 py-3">
                  <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-ink-2" /><p className="text-[13.5px] font-bold">{v.id}</p><span className="text-[11.5px] text-ink-3">{v.reg}</span><Badge tone={busy.has(v.id) ? 'navy' : v.battery < 30 ? 'red' : 'ev'} className="ml-auto">{busy.has(v.id) ? 'On job' : v.battery < 30 ? 'Low' : 'Free'}</Badge></div>
                  <p className="mt-0.5 text-[12px] text-ink-2">{p?.name} · {z?.name}, {z?.city}</p>
                  <div className="mt-2 flex items-center gap-2"><Bar value={v.battery} tone={v.battery < 30 ? 'red' : v.battery < 50 ? 'amber' : 'ev'} className="flex-1" /><span className="w-24 text-right text-[12px] font-semibold tabular-nums">{v.battery}% · ~{Math.round((v.battery / 100) * v.capacityKwh)} kWh</span></div>
                  {v.battery < 60 && !busy.has(v.id) && <button onClick={() => { update((st) => { st.vans.find((x) => x.id === v.id)!.battery = 100 }); toast(`${v.id} recharged at depot (demo)`) }} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-ev-700"><RefreshCw className="h-3.5 w-3.5" />Recharge at depot</button>}
                </div>) })}</div>
            </Card>
          </div>
        </div>
      </main>
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label={`Booking ${selected.id}`}>
          <button aria-label="Close" className="absolute inset-0 bg-navy/30 animate-fade" onClick={() => setSel(undefined)} />
          <aside className="relative h-full w-full max-w-[420px] overflow-y-auto bg-white p-6 shadow-lift animate-rise">
            <div className="flex items-start justify-between"><div><p className="text-[20px] font-extrabold">{selected.id}</p><Badge tone={statusTone(selected.status)} className="mt-1">{statusLabel[selected.status]}</Badge></div><button aria-label="Close" onClick={() => setSel(undefined)} className="grid h-9 w-9 place-items-center rounded-full bg-bg"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 space-y-1 text-[13px]">
              {[['Customer', `${selected.customer} · ${selected.phone}`], ['Vehicle', `${selected.vehicle.name} · ${selected.vehicle.reg}`], ['Connector', selected.vehicle.connector], ['Address', selected.address.line], ['Parking', selected.address.parking ?? '—'], ['SoC', `${selected.currentSoc}% → ${selected.targetSoc}%`], ['Estimate', `${selected.estKwh} kWh · ${inr(selected.price.total)}`], ['Paid via', selected.payMethod.toUpperCase()], ['Final bill', selected.finalPrice ? inr(selected.finalPrice.total) : '—'], ['Refund', selected.refund ? `${inr(selected.refund.amount)} → ${selected.refund.to}` : '—']].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-1"><span className="text-ink-2">{k}</span><span className="text-right font-medium">{v}</span></div>)}
            </div>
            <p className="mt-6 text-[12px] font-bold uppercase tracking-wider text-ink-3">Timeline</p>
            <ol className="mt-2 space-y-3 border-l-2 border-line pl-4">{selected.timeline.map((e, i) => <li key={i} className="relative text-[13px]"><span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-ev ring-4 ring-white" /><p className="font-medium">{e.label}</p><p className="text-[11.5px] text-ink-3">{fmtTime(e.t)}</p></li>)}</ol>
            {nextAction(selected) && <Button className="mt-6" variant="dark" onClick={() => act(selected)}>{nextAction(selected)}</Button>}
          </aside>
        </div>
      )}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-40"><Toaster /></div>
    </div>
  )
}
