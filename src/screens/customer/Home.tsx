import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronDown, Zap, CalendarClock, MapPin, ChevronRight, Plug, Plus, Check, Moon, ShieldCheck, Gauge as GaugeI, Headphones } from 'lucide-react'
import { Card, Screen, Badge, Sheet, Button, Skeleton, cx, VehicleGlyph, SectionTitle } from '../../components/ui'
import { BottomNav } from '../../components/BottomNav'
import { Ring } from '../../components/Gauge'
import { useStore, update, isActive, etaMin, useNow, type Booking } from '../../lib/store'
import { PRICE } from '../../lib/data'
import { inr, initials } from '../../lib/format'

export const statusLabel: Record<Booking['status'], string> = {
  awaiting_payment: 'Awaiting payment', scheduled: 'Scheduled', searching: 'Finding a van', unassigned: 'No van free', en_route: 'Van on the way', arrived: 'Partner has arrived', connecting: 'Plugging in', charging: 'Charging', paused: 'Paused', completed: 'Completed', interrupted: 'Interrupted', failed_handshake: 'Didn’t accept charge', cancelled: 'Cancelled',
}
export const statusTone = (s: Booking['status']) => (['completed'].includes(s) ? 'ev' : ['cancelled', 'failed_handshake', 'interrupted', 'unassigned'].includes(s) ? 'red' : s === 'awaiting_payment' ? 'amber' : s === 'scheduled' ? 'blue' : 'brand') as 'ev' | 'red' | 'amber' | 'blue' | 'brand'
export const bookingLink = (b: Booking) => b.status === 'awaiting_payment' ? `/pay/${b.id}` : ['charging', 'paused'].includes(b.status) ? `/session/${b.id}` : ['completed', 'interrupted'].includes(b.status) ? `/receipt/${b.id}` : `/track/${b.id}`

export function ActiveBanner() {
  const b = useStore((s) => s.bookings.find((x) => x.source === 'me' && isActive(x)))
  const t = useNow(1000)
  const nav = useNavigate()
  if (!b) return null
  const sub = b.status === 'en_route' ? `Arriving in ~${etaMin(b, t)} min` : b.status === 'scheduled' && b.slot.kind === 'scheduled' ? `${b.slot.day}, ${b.slot.label}` : b.status === 'charging' ? `${b.vehicle.name} · tap to view session` : b.vehicle.name
  return (
    <button onClick={() => nav(bookingLink(b))} className="flex w-full items-center gap-3 rounded-2xl bg-navy p-3.5 text-left text-white shadow-lift animate-rise">
      <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-ev/20 text-ev-400"><span className="absolute inset-0 rounded-xl bg-ev/30 animate-ring" /><Zap className="relative h-5 w-5 fill-current" /></span>
      <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{statusLabel[b.status]}</span><span className="block truncate text-[12px] text-white/65">{sub}</span></span>
      <ChevronRight className="h-5 w-5 text-white/60" />
    </button>
  )
}

export function Home() {
  const nav = useNavigate()
  const s = useStore((x) => x)
  const [loading, setLoading] = useState(true)
  const [addrOpen, setAddrOpen] = useState(false)
  const [vehOpen, setVehOpen] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 550); return () => clearTimeout(t) }, [])
  const v = s.vehicles.find((x) => x.id === s.vehicleId) ?? s.vehicles[0]
  const a = s.addresses.find((x) => x.id === s.addressId) ?? s.addresses[0]
  const soc = v ? s.soc[v.id] ?? 32 : 0
  const range = v ? Math.round((soc / 100) * v.batteryKwh * (v.type === 'car' ? 7 : 25)) : 0
  const last = s.bookings.find((b) => b.source === 'me' && b.status === 'completed')
  const hasActive = s.bookings.some((b) => b.source === 'me' && isActive(b))
  const go = (slot: 'now' | 'scheduled') => { update((x) => { x.draft.vehicleId = v?.id; x.draft.addressId = a?.id; x.draft.currentSoc = soc; x.draft.targetSoc = Math.max(soc + 10, 80) > 100 ? 100 : Math.max(soc + 10, 80); x.draft.slot = slot === 'now' ? { kind: 'now' } : { kind: 'scheduled', day: 'Today', label: '', night: false }; x.draft.coupon = undefined }); nav(slot === 'now' ? '/book' : '/book?schedule=1') }

  return (
    <Screen bottom={<BottomNav />} bodyClass="pb-4" top={
      <div className="flex items-center gap-3 px-5 pb-2 pt-3">
        <button onClick={() => setAddrOpen(true)} className="min-w-0 flex-1 text-left">
          <span className="text-[12px] font-medium text-ink-2">Charge at</span>
          <span className="flex items-center gap-1 text-[16px] font-bold"><MapPin className="h-4 w-4 flex-none text-brand" /><span className="truncate">{a ? `${a.label} · ${a.line.split(',').slice(-1)[0].trim()}` : 'Add an address'}</span><ChevronDown className="h-4 w-4 flex-none" /></span>
        </button>
        <Link to="/profile" aria-label="Profile" className="grid h-11 w-11 place-items-center rounded-full bg-navy text-[14px] font-bold text-white">{initials(s.auth.name ?? 'A S')}</Link>
      </div>}>
      <div className="space-y-4 px-5">
        <h1 className="pt-2 text-[26px] font-extrabold leading-tight tracking-tight">Hi {s.auth.name?.split(' ')[0] ?? 'there'},<br /><span className="text-ink-2">ready for a top-up?</span></h1>
        <ActiveBanner />
        {loading ? <Skeleton className="h-[236px] rounded-[24px]" /> : v ? (
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-navy via-navy-700 to-[#123B3A] p-5 text-white shadow-lift animate-rise">
            <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ev/25 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <button onClick={() => setVehOpen(true)} className="text-left">
                <p className="text-[12px] font-medium text-white/60">My EV</p>
                <p className="flex items-center gap-1 text-[18px] font-bold">{v.name}<ChevronDown className="h-4 w-4 text-white/60" /></p>
                <p className="text-[12.5px] text-white/60">{v.reg}</p>
              </button>
              <Badge tone="ev" className="!bg-ev/20 !text-ev-400"><Plug className="h-3 w-3" />{v.connector}</Badge>
            </div>
            <div className="relative mt-4 flex items-center gap-5">
              <Ring value={soc} size={112} stroke={10} track="rgba(255,255,255,.12)" glow>
                <div><p className="text-[26px] font-extrabold leading-none">{soc}%</p><p className="mt-1 text-[11px] text-white/60">last known</p></div>
              </Ring>
              <div className="flex-1 space-y-2.5">
                <div><p className="text-[11.5px] text-white/55">Approx. range</p><p className="text-[17px] font-bold">~{range} km</p></div>
                <div><p className="text-[11.5px] text-white/55">Battery</p><p className="text-[17px] font-bold">{v.batteryKwh} kWh</p></div>
                <label className="block"><span className="sr-only">Update charge level</span>
                  <input type="range" min={0} max={100} value={soc} onChange={(e) => update((x) => { x.soc[v.id] = +e.target.value })} className="h-1.5 w-full rounded-full" style={{ background: `linear-gradient(90deg,#4ADE80 ${soc}%,rgba(255,255,255,.15) ${soc}%)` }} />
                  <span className="text-[10.5px] text-white/45">Drag to update charge level</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <Card onClick={() => nav('/vehicle/add')} className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-ev-100 text-ev-700"><Plus /></span><div><p className="font-semibold">Add your EV</p><p className="text-[13px] text-ink-2">We’ll auto-fill the connector and battery size</p></div></Card>
        )}
        <div className="grid grid-cols-[1.4fr_1fr] gap-3">
          <button disabled={!v || !a || hasActive} onClick={() => go('now')} className="group relative overflow-hidden rounded-[22px] bg-ev p-4 text-left text-white shadow-glow transition active:scale-[.98] disabled:opacity-60">
            <Zap className="h-6 w-6 fill-current" /><p className="mt-5 text-[17px] font-bold leading-tight">Charge now</p><p className="text-[12px] text-white/80">{hasActive ? 'You have a live booking' : 'Nearest free van'}</p>
            <ChevronRight className="absolute right-3 top-4 h-5 w-5 text-white/70 transition group-hover:translate-x-0.5" />
          </button>
          <button disabled={!v || !a} onClick={() => go('scheduled')} className="rounded-[22px] bg-white p-4 text-left shadow-card transition active:scale-[.98] disabled:opacity-60">
            <CalendarClock className="h-6 w-6 text-navy" /><p className="mt-5 text-[15px] font-bold leading-tight">Schedule</p><p className="text-[12px] text-ink-2">Pick a slot</p>
          </button>
        </div>
        <Card className="flex items-center gap-3 !p-3.5">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#EEF0FF] text-[#4F46E5]"><Moon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">Overnight saver</p><p className="text-[12px] text-ink-2">Code <b>EVNIGHT</b>: 10% off energy, 10 PM – 6 AM slots</p></div>
          <button onClick={() => go('scheduled')} className="text-[13px] font-semibold text-ev-700">Use</button>
        </Card>

        <SectionTitle>Simple, metered pricing</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {[{ k: inr(PRICE.perKwh, 0), l: 'per kWh', i: GaugeI }, { k: inr(PRICE.visitFee, 0), l: 'visit fee', i: MapPin }, { k: '18%', l: 'GST on total', i: ShieldCheck }].map((x) => (
            <Card key={x.l} className="!p-3"><x.i className="h-4 w-4 text-ev" /><p className="mt-2 text-[17px] font-extrabold">{x.k}</p><p className="text-[11.5px] text-ink-2">{x.l}</p></Card>
          ))}
        </div>
        <p className="text-[12px] leading-5 text-ink-2">You pay an estimate upfront and are billed on the kWh the meter actually delivers. Any difference comes back to you.</p>

        {last && <>
          <SectionTitle action={<Link to="/bookings" className="text-[13px] font-semibold text-ev-700">See all</Link>}>Last session</SectionTitle>
          <Card onClick={() => nav(`/receipt/${last.id}`)} className="flex items-center gap-3">
            <VehicleGlyph type={last.vehicle.type} colour={last.vehicle.colour} />
            <div className="flex-1"><p className="font-semibold">{last.deliveredKwh} kWh · {last.currentSoc}% → {last.targetSoc}%</p><p className="text-[12.5px] text-ink-2">{new Date(last.endedAt ?? last.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {inr(last.finalPrice?.total ?? last.price.total)}</p></div>
            <ChevronRight className="h-5 w-5 text-ink-3" />
          </Card>
        </>}
        <Card onClick={() => nav('/support')} className="mb-2 flex items-center gap-3 !p-3.5"><Headphones className="h-5 w-5 text-navy" /><span className="flex-1 text-[14px] font-semibold">Help & support</span><ChevronRight className="h-5 w-5 text-ink-3" /></Card>
      </div>

      <Sheet open={addrOpen} onClose={() => setAddrOpen(false)} title="Charge at" footer={<Button variant="ghost" icon={<Plus className="h-5 w-5" />} onClick={() => nav('/address/new?back=/home')}>Add new address</Button>}>
        <div className="space-y-2">{s.addresses.map((x) => (
          <button key={x.id} onClick={() => { update((st) => { st.addressId = x.id }); setAddrOpen(false) }} className={cx('flex w-full items-start gap-3 rounded-2xl p-3 text-left ring-1', x.id === a?.id ? 'bg-ev-50 ring-ev' : 'ring-line')}>
            <MapPin className="mt-0.5 h-5 w-5 text-brand" /><span className="flex-1"><span className="block font-semibold">{x.label}</span><span className="block text-[13px] text-ink-2">{x.line} · {x.pin}</span>{x.parking && <span className="block text-[12px] text-ink-3">Parking: {x.parking}</span>}</span>{x.id === a?.id && <Check className="h-5 w-5 text-ev" />}
          </button>))}</div>
      </Sheet>
      <Sheet open={vehOpen} onClose={() => setVehOpen(false)} title="Choose vehicle" footer={<Button variant="ghost" icon={<Plus className="h-5 w-5" />} onClick={() => nav('/vehicle/add?back=/home')}>Add another EV</Button>}>
        <div className="space-y-2">{s.vehicles.map((x) => (
          <button key={x.id} onClick={() => { update((st) => { st.vehicleId = x.id }); setVehOpen(false) }} className={cx('flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1', x.id === v?.id ? 'bg-ev-50 ring-ev' : 'ring-line')}>
            <VehicleGlyph type={x.type} colour={x.colour} /><span className="flex-1"><span className="block font-semibold">{x.name}</span><span className="block text-[13px] text-ink-2">{x.reg} · {x.connector} · {x.batteryKwh} kWh</span></span>{x.id === v?.id && <Check className="h-5 w-5 text-ev" />}
          </button>))}</div>
      </Sheet>
    </Screen>
  )
}
