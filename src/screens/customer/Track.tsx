import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Phone, MessageCircle, Headphones, Zap, Star, KeyRound, Clock, TriangleAlert, CalendarClock, RefreshCw, Plug, Loader2, CircleX, Wallet, ShieldCheck, Check } from 'lucide-react'
import { Button, Screen, Card, Row, Sheet, Badge, Skeleton, cx, IconBtn, toast } from '../../components/ui'
import { MapView } from '../../components/MapView'
import { useStore, useNow, update, etaMin, travelProgress, partnerOf, cancelBooking, cancelCharge, type Booking } from '../../lib/store'
import { inr, initials, fmtTime } from '../../lib/format'
import { statusLabel } from './Home'

const STEPS = ['Confirmed', 'Van assigned', 'On the way', 'Arrived', 'Charging', 'Complete']
const stepOf = (b: Booking) => ({ awaiting_payment: 0, scheduled: 0, searching: 0, unassigned: 0, en_route: 2, arrived: 3, connecting: 3, charging: 4, paused: 4, completed: 5, interrupted: 5, failed_handshake: 3, cancelled: 0 }[b.status])

export function Stepper({ b }: { b: Booking }) {
  const st = stepOf(b)
  return (
    <div className="mt-4">
      <div className="flex gap-1">{STEPS.map((s, i) => <div key={s} className={cx('h-1.5 flex-1 rounded-full transition-colors duration-700', i < st ? 'bg-ev' : i === st ? 'bg-ev/50' : 'bg-navy-100')} />)}</div>
      <div className="mt-1.5 flex justify-between text-[10.5px] font-medium text-ink-3"><span>{STEPS[0]}</span><span className="font-semibold text-ev-700">{STEPS[st]}</span><span>{STEPS[5]}</span></div>
    </div>
  )
}

const REASONS = ['Booked by mistake', 'Taking too long', 'Charged elsewhere', 'Wrong vehicle or place', 'Other']

export function CancelSheet({ b, open, onClose }: { b: Booking; open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const [r, setR] = useState(REASONS[0])
  const c = cancelCharge(b)
  const refund = b.status === 'awaiting_payment' ? 0 : b.price.total - c.fee
  return (
    <Sheet open={open} onClose={onClose} title="Cancel this booking?" footer={<div className="space-y-2.5"><Button variant="danger" onClick={() => { cancelBooking(b.id, r); onClose(); toast(refund > 0 ? `Refund of ${inr(refund)} started` : 'Booking cancelled'); nav(`/track/${b.id}`, { replace: true }) }}>Cancel booking{refund > 0 ? ` · refund ${inr(refund)}` : ''}</Button><Button variant="ghost" onClick={onClose}>Keep my booking</Button></div>}>
      <div className="rounded-2xl bg-bg p-3.5">
        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-3">Refund policy</p>
        <ul className="mt-2 space-y-1.5 text-[13px]">
          {[['Before a van is dispatched', 'Free'], ['Van on the way', '₹49 fee'], ['Van has arrived', 'Visit fee + GST']].map(([k, v], i) => {
            const on = (i === 0 && c.fee === 0) || (i === 1 && c.fee === 49) || (i === 2 && c.fee > 49)
            return <li key={k} className={cx('flex justify-between rounded-lg px-2 py-1', on && 'bg-white font-semibold text-navy shadow-card')}><span>{k}</span><span>{v}</span></li>
          })}
        </ul>
        <div className="mt-3 border-t border-line pt-2"><Row k="You paid" v={inr(b.status === 'awaiting_payment' ? 0 : b.price.total)} /><Row k="Cancellation charge" v={c.fee ? `− ${inr(c.fee)}` : inr(0)} /><Row k="Refund" v={inr(Math.max(0, refund))} strong /></div>
        <p className="mt-1 text-[11.5px] text-ink-2">{b.payMethod === 'wallet' ? 'Refunds to your wallet instantly.' : 'Refunds to your original payment method in 3–5 working days.'}</p>
      </div>
      <p className="mb-2 mt-4 text-[13px] font-semibold">Why are you cancelling?</p>
      <div className="flex flex-wrap gap-2">{REASONS.map((x) => <button key={x} onClick={() => setR(x)} className={cx('rounded-full px-3 py-1.5 text-[12.5px] font-semibold ring-1', r === x ? 'bg-navy text-white ring-navy' : 'ring-line')}>{x}</button>)}</div>
    </Sheet>
  )
}

export function Track() {
  const { id } = useParams(); const nav = useNavigate()
  const [sp] = useSearchParams()
  const b = useStore((s) => s.bookings.find((x) => x.id === id))
  const van = useStore((s) => s.vans.find((v) => v.id === b?.vanId))
  const t = useNow(1000)
  const [cancel, setCancel] = useState(sp.get('cancel') === '1')
  const [calling, setCalling] = useState(false)
  useEffect(() => { if (b?.supersededBy && Date.now() - b.timeline[b.timeline.length - 1].t < 5000) { nav(`/track/${b.supersededBy}`, { replace: true }); return } if (b && ['charging', 'paused', 'interrupted'].includes(b.status)) nav(`/session/${b.id}`, { replace: true }); if (b?.status === 'completed') nav(`/receipt/${b.id}`, { replace: true }) }, [b?.status, b, nav])
  if (!b) return <Screen><div className="p-8 text-center"><p className="text-sm text-ink-2">Booking not found.</p><div className="mt-4"><Button onClick={() => nav('/bookings')}>See my bookings</Button></div></div></Screen>
  const p = partnerOf(b)
  const prog = travelProgress(b, t)
  const eta = etaMin(b, t)
  const showMap = ['en_route', 'arrived', 'connecting', 'searching', 'unassigned', 'scheduled', 'failed_handshake'].includes(b.status)
  const canCancel = ['scheduled', 'searching', 'unassigned', 'en_route', 'arrived'].includes(b.status)
  const label = b.status === 'en_route' ? `Van ${van?.reg.slice(-4) ?? ''} · ${eta} min` : b.status === 'searching' ? 'Searching…' : b.status === 'arrived' || b.status === 'connecting' ? 'At your spot' : undefined

  return (
    <Screen bodyClass="flex flex-col" className="bg-[#E9EEF4]">
      <div className="relative min-h-[300px] flex-1">
        {showMap ? <MapView progress={b.status === 'en_route' ? prog : ['arrived', 'connecting', 'failed_handshake'].includes(b.status) ? 1 : 0} label={label} className="absolute inset-0" showRoute={!['searching', 'unassigned', 'scheduled'].includes(b.status)} /> : <div className="absolute inset-0 bg-[#E9EEF4]" />}
        {b.status === 'searching' && <div className="absolute inset-0 grid place-items-center"><div className="relative grid h-24 w-24 place-items-center"><span className="absolute inset-0 rounded-full bg-ev/30 animate-ring" /><span className="absolute inset-3 rounded-full bg-ev/30 animate-ring" style={{ animationDelay: '.6s' }} /><span className="relative grid h-14 w-14 place-items-center rounded-full bg-navy text-ev-400 shadow-lift"><Zap className="h-6 w-6 fill-current" /></span></div></div>}
        <div className="absolute inset-x-0 top-0 flex justify-between p-4">
          <IconBtn label="Back to home" onClick={() => nav('/home')}><ChevronLeft className="h-5 w-5" /></IconBtn>
          <IconBtn label="Help" onClick={() => nav('/support?booking=' + b.id)}><Headphones className="h-5 w-5" /></IconBtn>
        </div>
      </div>

      <div className="relative z-10 -mt-6 rounded-t-[28px] bg-white px-5 pb-5 pt-3 shadow-[0_-10px_30px_rgba(15,27,61,.08)]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-navy-100" />
        {b.status === 'en_route' && <>
          <div className="flex items-end justify-between">
            <div><p className="text-[13px] text-ink-2">Arriving in</p><p className="text-[34px] font-extrabold leading-none tracking-tight tabular-nums">{eta} <span className="text-[18px]">min</span></p></div>
            <Badge tone={b.delayed ? 'amber' : 'ev'}>{b.delayed ? 'Running late' : 'On the way'}</Badge>
          </div>
          {b.delayed && <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900"><Clock className="mt-0.5 h-4 w-4 flex-none" /><span>Your van is running late due to traffic. We’ve added <b>₹50</b> to your wallet. <button className="font-bold underline" onClick={() => setCancel(true)}>Cancel free</button></span></div>}
        </>}
        {b.status === 'searching' && <div><p className="text-[20px] font-extrabold">Finding your van</p><p className="mt-1 text-[13px] text-ink-2">Matching a van near {b.address.label.toLowerCase()} with enough energy for {b.estKwh} kWh.</p><div className="mt-4 flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></div></div>}
        {b.status === 'scheduled' && b.slot.kind === 'scheduled' && <div><Badge tone="blue"><CalendarClock className="h-3 w-3" /> Scheduled</Badge><p className="mt-2 text-[20px] font-extrabold">{b.slot.day}, {b.slot.label}</p><p className="mt-1 text-[13px] text-ink-2">We’ll assign a van about an hour before and remind you 30 minutes ahead.</p><Button className="mt-4" variant="ghost" size="md" onClick={() => update((s) => { const x = s.bookings.find((y) => y.id === b.id)!; x.status = 'searching'; x.searchAt = Date.now(); x.timeline.push({ t: Date.now(), label: 'Dispatched early (demo)' }) })}>Demo: dispatch now</Button></div>}
        {b.status === 'unassigned' && <div role="alert"><div className="flex items-center gap-2 text-red-600"><TriangleAlert className="h-5 w-5" /><p className="text-[18px] font-extrabold text-navy">No van free near you</p></div><p className="mt-1.5 text-[13px] leading-5 text-ink-2">All vans nearby are busy or recharging. You can keep waiting, pick a slot, or cancel for a full refund of {inr(b.price.total)}.</p>
          <div className="mt-4 space-y-2"><Button variant="ev" size="md" icon={<RefreshCw className="h-4 w-4" />} onClick={() => update((s) => { const x = s.bookings.find((y) => y.id === b.id)!; x.status = 'searching'; x.searchAt = Date.now(); x.flags.noPartner = false; x.timeline.push({ t: Date.now(), label: 'Searching again' }) })}>Keep searching</Button>
            <div className="flex gap-2"><Button variant="ghost" size="md" onClick={() => { cancelBooking(b.id, 'Rescheduled'); nav('/book?schedule=1') }}>Pick a slot</Button><Button variant="danger" size="md" onClick={() => { cancelBooking(b.id, 'No van available'); toast(`Full refund of ${inr(b.price.total)} started`) }}>Cancel · full refund</Button></div></div></div>}
        {(b.status === 'arrived' || b.status === 'connecting') && <div><p className="text-[20px] font-extrabold">{b.status === 'arrived' ? `${p?.name.split(' ')[0]} has arrived` : 'Plugging in & checking'}</p><p className="mt-1 text-[13px] text-ink-2">{b.status === 'arrived' ? 'Running the site safety checklist at your parking spot.' : `Connector check (${b.vehicle.connector}) and vehicle handshake in progress…`}</p>
          <div className="mt-3 flex items-center gap-2 text-[12.5px] font-medium text-ev-700">{['Safety check', 'Connector', 'Handshake'].map((x, i) => <span key={x} className="flex items-center gap-1">{(b.status === 'connecting' && i < 2) || (b.status === 'arrived' && i < 1) ? <Check className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-3" />}{x}</span>)}</div></div>}
        {b.status === 'failed_handshake' && <div role="alert"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600"><Plug className="h-4 w-4" /></span><p className="text-[18px] font-extrabold">Your EV didn’t accept charge</p></div>
          <p className="mt-2 text-[13px] leading-5 text-ink-2">The partner tried twice, but the vehicle didn’t respond. Check that it’s unlocked and not in a fault or transport mode. <b className="text-navy">No energy was delivered and you won’t pay a visit fee</b> — {inr(b.refund?.amount ?? b.price.total)} is refunded to your {b.refund?.to}.</p>
          <div className="mt-4 flex gap-2"><Button size="md" variant="dark" onClick={() => nav('/book?schedule=1')}>Reschedule</Button><Button size="md" variant="ghost" onClick={() => nav('/support?booking=' + b.id)}>Get help</Button></div></div>}
        {b.status === 'cancelled' && <div><div className="flex items-center gap-2"><CircleX className="h-5 w-5 text-red-600" /><p className="text-[18px] font-extrabold">Booking cancelled</p></div>
          {b.refund && b.refund.amount > 0 ? <Card className="mt-3 !bg-ev-50 !shadow-none"><p className="flex items-center gap-1.5 text-[13px] font-semibold text-ev-700"><Wallet className="h-4 w-4" /> Refund of {inr(b.refund.amount)} to {b.refund.to}</p><p className="mt-0.5 text-[12px] text-ink-2">{b.refund.reason}. {b.refund.to.includes('wallet') ? 'Credited instantly.' : '3–5 working days.'}</p></Card> : <p className="mt-1 text-[13px] text-ink-2">Nothing was charged.</p>}
          <Button className="mt-4" variant="ev" size="md" onClick={() => nav('/book')}>Book again</Button></div>}

        {['en_route', 'arrived', 'connecting'].includes(b.status) && <Stepper b={b} />}

        {p && ['en_route', 'arrived', 'connecting'].includes(b.status) && <>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-bg p-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-navy text-[15px] font-bold text-white">{initials(p.name)}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{p.name}</p><p className="truncate text-[12px] text-ink-2"><Star className="inline h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating} · Trained charging operator · {van?.reg}</p></div>
            <IconBtn label="Chat with partner" onClick={() => toast('Chat opens here in the full app (demo)', 'info')}><MessageCircle className="h-5 w-5" /></IconBtn>
            <button aria-label="Call partner" onClick={() => setCalling(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-ev text-white shadow-glow"><Phone className="h-5 w-5" /></button>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-brand-50 p-3 ring-1 ring-brand-100">
            <KeyRound className="h-5 w-5 flex-none text-brand" />
            <p className="flex-1 text-[12.5px] text-navy">Start OTP <b className="ml-1 text-[16px] tracking-[.3em]">{b.otp ?? '4821'}</b><br /><span className="text-ink-2">Share only when the cable is connected to your vehicle.</span></p>
          </div>
        </>}
        <div className="mt-4 flex items-center justify-between text-[12px] text-ink-2">
          <span>{b.id} · {b.estKwh} kWh · {inr(b.price.total)}</span>
          {canCancel && <button onClick={() => setCancel(true)} className="font-semibold text-red-600">Cancel booking</button>}
        </div>
      </div>
      <CancelSheet b={b} open={cancel} onClose={() => setCancel(false)} />
      {calling && p && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-between bg-navy px-6 py-16 text-white animate-fade" role="dialog" aria-label="Calling partner">
          <div className="text-center"><p className="text-[13px] text-white/60">Calling via masked number…</p><div className="relative mx-auto mt-8 grid h-24 w-24 place-items-center"><span className="absolute inset-0 rounded-full bg-ev/30 animate-ring" /><span className="relative grid h-24 w-24 place-items-center rounded-full bg-white/10 text-[28px] font-bold">{initials(p.name)}</span></div><p className="mt-5 text-[22px] font-bold">{p.name}</p><p className="text-[13px] text-white/60">Your number stays private (demo — no real call)</p></div>
          <button aria-label="End call" onClick={() => setCalling(false)} className="grid h-16 w-16 place-items-center rounded-full bg-red-500 shadow-lift"><Phone className="h-7 w-7 rotate-[135deg]" /></button>
        </div>
      )}
      <span className="sr-only">{fmtTime(t)}</span>
      <ShieldCheck className="hidden" />
    </Screen>
  )
}
