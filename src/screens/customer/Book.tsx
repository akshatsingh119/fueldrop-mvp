import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, CalendarClock, Clock, Route, TriangleAlert, Moon, Bell, Info, Plug } from 'lucide-react'
import { Button, Screen, TopBar, Card, Chip, cx, VehicleGlyph, Badge, toast, SectionTitle } from '../../components/ui'
import { useStore, update, draftVehicle, draftAddress } from '../../lib/store'
import { PRICE, SUPPORTED, VAN_KW, timeSlots } from '../../lib/data'
import { priceFor } from '../../lib/pricing'
import { inr } from '../../lib/format'

export function SocSlider({ label, value, onChange, min = 0, max = 100, tone = '#16A34A', from }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; tone?: string; from?: number }) {
  const pct = ((value - min) / (max - min)) * 100
  const fromPct = from != null ? ((from - min) / (max - min)) * 100 : 0
  const bg = from != null
    ? `linear-gradient(90deg,#CBD5E1 ${fromPct}%,${tone} ${fromPct}%,${tone} ${pct}%,#E7EAF3 ${pct}%)`
    : `linear-gradient(90deg,${tone} ${pct}%,#E7EAF3 ${pct}%)`
  return (
    <label className="block">
      <span className="flex items-baseline justify-between"><span className="text-[13px] font-semibold text-ink-2">{label}</span><span className="text-[22px] font-extrabold tabular-nums">{value}%</span></span>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} aria-label={label} className="mt-2 h-1.5 w-full rounded-full" style={{ background: bg }} />
    </label>
  )
}

export function Book() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const s = useStore((x) => x)
  const v = draftVehicle(s); const a = draftAddress(s)
  const d = s.draft
  const [tab, setTab] = useState<'now' | 'scheduled'>(sp.get('schedule') || d.slot.kind === 'scheduled' ? 'scheduled' : 'now')
  const [day, setDay] = useState<'Today' | 'Tomorrow'>(d.slot.kind === 'scheduled' && d.slot.day === 'Tomorrow' ? 'Tomorrow' : 'Today')
  const slots = useMemo(() => timeSlots(), [])
  const sched = sp.get('schedule')
  useEffect(() => { if (sched) setTab('scheduled') }, [sched, sp])
  if (!v || !a) return (
    <Screen top={<TopBar title="Book a charge" />}><div className="p-6 text-center"><p className="text-sm text-ink-2">Add a vehicle and an address first.</p><div className="mt-4 space-y-2"><Button onClick={() => nav(v ? '/address/new' : '/vehicle/add')}>{v ? 'Add address' : 'Add vehicle'}</Button></div></div></Screen>
  )
  const set = (fn: (x: typeof d) => void) => update((st) => { fn(st.draft); st.draft.vehicleId = v.id; st.draft.addressId = a.id })
  const kwh = Math.max(0, Math.round(((d.targetSoc - d.currentSoc) / 100) * v.batteryKwh * 10) / 10)
  const minK = v.type === 'car' ? PRICE.minKwhCar : PRICE.minKwh2w
  const suggest = Math.min(100, Math.ceil((d.currentSoc + (minK / v.batteryKwh) * 100) / 5) * 5)
  const err = d.targetSoc <= d.currentSoc ? `Your ${v.type === 'car' ? 'car' : 'vehicle'} is already at ${d.currentSoc}%. Choose a target above that.` : kwh < minK ? `Minimum session is ${minK} kWh. At ${d.currentSoc}% that means a target of ${suggest}% or more.` : ''
  const canFix = suggest > d.currentSoc && suggest <= 100
  const compatible = SUPPORTED.includes(v.connector)
  const kw = VAN_KW[v.connector]
  const mins = kw ? Math.round((kwh / kw) * 60 * 1.1) : 0
  const range = Math.round(kwh * (v.type === 'car' ? 7 : 25))
  const noSlots = s.demo.noSlots
  const daySlots = slots.filter((x) => x.day === day).map((x) => ({ ...x, left: noSlots && x.day === 'Today' ? 0 : x.left }))
  const chosen = d.slot.kind === 'scheduled' && d.slot.label ? d.slot : undefined
  const slotOk = tab === 'now' ? !noSlots : !!chosen
  const price = priceFor(kwh, d.coupon && (d.coupon !== 'EVNIGHT' || chosen?.night) ? d.coupon : undefined)
  const can = !err && compatible && slotOk

  return (
    <Screen top={<TopBar title="Book a charge" sub={`${a.label} · ${a.line.split(',').slice(-1)[0].trim()}`} />}
      footer={<div className="flex items-center gap-4">
        <div className="min-w-[110px]"><p className="text-[11.5px] text-ink-2">Estimate incl. GST</p><p className="text-[20px] font-extrabold tabular-nums">{err ? '—' : inr(price.total)}</p></div>
        <Button onClick={() => { set((x) => { if (tab === 'now') x.slot = { kind: 'now' } }); nav('/checkout') }} disabled={!can}>Continue</Button>
      </div>}>
      <div className="px-5 pb-6">
        <Card className="flex items-center gap-3 animate-rise">
          <VehicleGlyph type={v.type} colour={v.colour} />
          <div className="min-w-0 flex-1"><p className="font-semibold">{v.name}</p><p className="text-[12.5px] text-ink-2">{v.reg} · {v.batteryKwh} kWh</p></div>
          <Badge tone={compatible ? 'ev' : 'amber'}><Plug className="h-3 w-3" />{v.connector}</Badge>
        </Card>
        {s.vehicles.length > 1 && <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">{s.vehicles.map((x) => <Chip key={x.id} on={x.id === v.id} onClick={() => update((st) => { st.draft.vehicleId = x.id; st.vehicleId = x.id })}>{x.name.split(' ').slice(1).join(' ') || x.name}</Chip>)}</div>}
        {!compatible && <div role="alert" className="mt-3 rounded-2xl bg-amber-50 p-4 text-[13px] text-amber-900 ring-1 ring-amber-200"><p className="flex items-center gap-2 font-semibold"><TriangleAlert className="h-4 w-4" /> We can’t charge this vehicle yet</p><p className="mt-1">Our vans carry {SUPPORTED.join(', ')}. Pick another vehicle or add one.</p></div>}

        <Card className="mt-4 space-y-5">
          <SocSlider label="Battery now" value={d.currentSoc} onChange={(n) => set((x) => { x.currentSoc = n })} tone="#94A3B8" />
          <div>
            <SocSlider label="Charge to" value={d.targetSoc} from={d.currentSoc} onChange={(n) => set((x) => { x.targetSoc = n })} />
            <div className="mt-3 flex gap-2">{[60, 80, 90, 100].map((n) => <Chip key={n} on={d.targetSoc === n} onClick={() => set((x) => { x.targetSoc = n })} className="flex-1">{n}%</Chip>)}</div>
          </div>
          {err ? (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-[13px] text-red-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" /><div className="flex-1">{err}{canFix && <button onClick={() => set((x) => { x.targetSoc = suggest })} className="ml-1 font-bold underline">Set to {suggest}%</button>}</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 divide-x divide-line rounded-xl bg-ev-50 py-3 text-center">
              <div><Zap className="mx-auto h-4 w-4 text-ev" /><p className="mt-1 text-[16px] font-extrabold tabular-nums">+{kwh}</p><p className="text-[11px] text-ink-2">kWh</p></div>
              <div><Route className="mx-auto h-4 w-4 text-ev" /><p className="mt-1 text-[16px] font-extrabold tabular-nums">~{range}</p><p className="text-[11px] text-ink-2">km range</p></div>
              <div><Clock className="mx-auto h-4 w-4 text-ev" /><p className="mt-1 text-[16px] font-extrabold tabular-nums">~{mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}</p><p className="text-[11px] text-ink-2">at {kw} kW</p></div>
            </div>
          )}
          <p className="flex items-start gap-1.5 text-[11.5px] leading-4 text-ink-3"><Info className="mt-px h-3.5 w-3.5 flex-none" />Check your battery % on the dashboard or the OEM app. You’re billed on metered kWh, not this estimate.</p>
        </Card>

        <SectionTitle>When?</SectionTitle>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-card">
          {([['now', 'ASAP', Zap], ['scheduled', 'Schedule', CalendarClock]] as const).map(([k, l, I]) => (
            <button key={k} onClick={() => { setTab(k); set((x) => { x.slot = k === 'now' ? { kind: 'now' } : (chosen ?? { kind: 'scheduled', day, label: '', night: false }) }) }} className={cx('flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition', tab === k ? 'bg-navy text-white shadow' : 'text-ink-2')}><I className="h-4 w-4" />{l}</button>
          ))}
        </div>
        {tab === 'now' ? (noSlots ? (
          <Card className="mt-3 text-center animate-rise">
            <p className="font-semibold">All vans near you are busy or recharging</p>
            <p className="mt-1 text-[13px] text-ink-2">Pick a slot, or we’ll tell you when ASAP is back.</p>
            <div className="mt-3 flex gap-2"><Button size="md" variant="ghost" onClick={() => toast('We’ll notify you when ASAP is back', 'info')} icon={<Bell className="h-4 w-4" />}>Notify me</Button><Button size="md" variant="dark" onClick={() => { setTab('scheduled'); setDay('Tomorrow') }}>Pick a slot</Button></div>
          </Card>
        ) : (
          <Card className="mt-3 flex items-center gap-3 animate-rise"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-ev-100 text-ev-700"><Zap className="h-5 w-5" /></span><div><p className="font-semibold">Next free van · ETA ~50–60 min</p><p className="text-[12.5px] text-ink-2">Sample ETA. You’ll see the live ETA after booking.</p></div></Card>
        )) : (
          <div className="mt-3 animate-rise">
            <div className="mb-3 flex gap-2">{(['Today', 'Tomorrow'] as const).map((x) => <Chip key={x} on={day === x} onClick={() => setDay(x)}>{x}</Chip>)}</div>
            {daySlots.every((x) => x.left === 0) || !daySlots.length ? (
              <Card className="text-center">
                <CalendarClock className="mx-auto h-8 w-8 text-ink-3" />
                <p className="mt-2 font-semibold">No slots left {day.toLowerCase()}</p>
                <p className="mt-1 text-[13px] text-ink-2">Every van in your zone is booked. Try tomorrow, or get notified if a slot opens.</p>
                <div className="mt-3 flex gap-2"><Button size="md" variant="ghost" onClick={() => toast('We’ll notify you if a slot opens', 'info')} icon={<Bell className="h-4 w-4" />}>Notify me</Button>{day === 'Today' && <Button size="md" variant="dark" onClick={() => setDay('Tomorrow')}>See tomorrow</Button>}</div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {daySlots.map((x) => {
                  const on = chosen?.day === x.day && chosen.label === x.label
                  return (
                    <button key={x.id} disabled={x.left === 0} onClick={() => set((dd) => { dd.slot = { kind: 'scheduled', day: x.day, label: x.label, night: x.night } })}
                      className={cx('rounded-2xl p-3 text-left ring-1 ring-inset transition active:scale-[.98] disabled:opacity-45', on ? 'bg-navy text-white ring-navy' : 'bg-white ring-line hover:ring-navy/30')}>
                      <span className="flex items-center gap-1 text-[14px] font-semibold">{x.night && <Moon className={cx('h-3.5 w-3.5', on ? 'text-ev-400' : 'text-[#4F46E5]')} />}{x.label}</span>
                      <span className={cx('text-[11.5px] font-medium', on ? 'text-white/70' : x.left === 0 ? 'text-red-600' : x.left === 1 ? 'text-amber-700' : 'text-ev-700')}>{x.left === 0 ? 'Full' : x.left === 1 ? 'Filling fast' : 'Open'}{x.night && ' · EVNIGHT'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Screen>
  )
}
