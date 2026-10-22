import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tag, ChevronRight, CreditCard, Wallet, Smartphone, Check, MapPin, CalendarClock, Zap, CircleX, ShieldCheck, Timer, Loader2, PartyPopper, CircleCheck } from 'lucide-react'
import { Button, Screen, TopBar, Card, Row, Sheet, Field, cx, toast, useOffline, VehicleGlyph, Badge, SectionTitle } from '../../components/ui'
import { useStore, update, draftVehicle, draftAddress, draftKwh, makeBooking, confirmPaid, cancelBooking, useNow, type PayMethod } from '../../lib/store'
import { priceFor, checkCoupon, COUPONS, type Price } from '../../lib/pricing'
import { PRICE } from '../../lib/data'
import { inr, mmss } from '../../lib/format'

export function Breakdown({ p, title = 'Price estimate' }: { p: Price; title?: string }) {
  return (
    <Card>
      <p className="mb-1 text-[13px] font-bold">{title}</p>
      <Row k={`Energy · ${p.kwh} kWh × ${inr(p.perKwh, 0)}`} v={inr(p.energy)} />
      {p.energyDiscount > 0 && <Row k={`Coupon ${p.coupon}`} v={`− ${inr(p.energyDiscount)}`} tone="ev" />}
      <Row k={p.fleet ? `Session fee · ${p.sessions} × ${inr(p.fee / (p.sessions || 1), 0)}` : p.fee === 0 ? 'Visit fee (waived)' : 'Visit fee'} v={p.fee === 0 && !p.fleet ? <span><s className="mr-1.5 text-ink-3">₹149.00</s>₹0.00</span> : inr(p.fee)} />
      {p.feeDiscount > 0 && <Row k={`Coupon ${p.coupon}`} v={`− ${inr(p.feeDiscount)}`} tone="ev" />}
      <div className="my-1.5 border-t border-dashed border-line" />
      <Row k="Taxable value" v={inr(p.taxable)} />
      <Row k={<span>GST 18% <span className="text-ink-3">(CGST 9% + SGST 9%)</span></span>} v={inr(p.gst)} />
      <div className="my-1.5 border-t border-line" />
      <Row k="Total" v={inr(p.total)} strong />
    </Card>
  )
}

const UPI_APPS = [{ id: 'gpay', name: 'Google Pay' }, { id: 'phonepe', name: 'PhonePe' }, { id: 'paytm', name: 'Paytm' }, { id: 'other', name: 'Other UPI ID' }]

export function Checkout() {
  const nav = useNavigate()
  const s = useStore((x) => x)
  const offline = useOffline()
  const v = draftVehicle(s); const a = draftAddress(s); const k = draftKwh(s)
  const d = s.draft
  const night = d.slot.kind === 'scheduled' && d.slot.night
  const first = !s.bookings.some((b) => b.source === 'me' && b.status !== 'cancelled' && b.status !== 'awaiting_payment')
  const coupon = d.coupon && checkCoupon(d.coupon, { night, firstBooking: first }).ok ? d.coupon : undefined
  const p = priceFor(k, coupon)
  const [cOpen, setCOpen] = useState(false)
  const [code, setCode] = useState('')
  const [cErr, setCErr] = useState('')
  const [upiApp, setUpiApp] = useState('gpay')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!v || !a || k <= 0) return <Screen top={<TopBar title="Checkout" />}><div className="p-6 text-center text-sm text-ink-2">Nothing to pay for yet.<div className="mt-4"><Button onClick={() => nav('/book')}>Set up a charge</Button></div></div></Screen>
  const walletLow = s.wallet.balance < p.total
  const method = d.payMethod
  const setM = (m: PayMethod) => update((x) => { x.draft.payMethod = m })
  const apply = (c: string) => { const r = checkCoupon(c, { night, firstBooking: first }); if (!r.ok) { setCErr(r.error); return } update((x) => { x.draft.coupon = c.toUpperCase() }); setCOpen(false); setCErr(''); setCode(''); toast(`${c.toUpperCase()} applied`) }
  const pay = () => {
    if (method === 'wallet' && walletLow) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (method === 'upi') {
        let id = ''; update((x) => { x.draft.coupon = coupon; const b = makeBooking(x, 'awaiting_payment'); x.bookings.unshift(b); id = b.id }); nav(`/pay/${id}`); return
      }
      if (s.demo.payFail) { update((x) => { x.demo.payFail = false }); setFailed(true); return }
      let id = ''; update((x) => { x.draft.coupon = coupon; const b = makeBooking(x, 'searching'); confirmPaid(x, b); x.bookings.unshift(b); x.soc[b.vehicle.id] = b.currentSoc; id = b.id })
      nav(`/booked/${id}`)
    }, 1400)
  }
  const slotText = d.slot.kind === 'now' ? 'ASAP · ETA ~50–60 min' : `${d.slot.day}, ${d.slot.label}`
  return (
    <Screen top={<TopBar title="Checkout" sub="Review and pay" />} footer={
      <Button onClick={pay} loading={busy} disabled={offline || (method === 'wallet' && walletLow)} icon={!busy && <ShieldCheck className="h-5 w-5" />}>{offline ? 'You’re offline' : busy ? 'Processing…' : `Pay ${inr(p.total)}`}</Button>}>
      <div className="space-y-3 px-5 pb-6 animate-rise">
        <Card className="space-y-3">
          <div className="flex items-center gap-3"><VehicleGlyph type={v.type} colour={v.colour} /><div className="flex-1"><p className="font-semibold">{v.name}</p><p className="text-[12.5px] text-ink-2">{d.currentSoc}% → {d.targetSoc}% · +{k} kWh · {v.connector}</p></div><button onClick={() => nav('/book')} className="text-[13px] font-semibold text-ev-700">Edit</button></div>
          <div className="flex items-start gap-3 border-t border-line pt-3"><MapPin className="mt-0.5 h-5 w-5 text-brand" /><div className="flex-1 text-[13px]"><p className="font-semibold text-navy">{a.label}</p><p className="text-ink-2">{a.line}</p>{a.parking && <p className="text-ink-3">Parking: {a.parking}</p>}</div></div>
          <div className="flex items-center gap-3 border-t border-line pt-3"><CalendarClock className="h-5 w-5 text-navy" /><p className="flex-1 text-[13px] font-semibold">{slotText}</p>{night && <Badge tone="blue">Night slot</Badge>}</div>
        </Card>

        <Card onClick={() => setCOpen(true)} className="flex items-center gap-3 !py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-brand"><Tag className="h-4 w-4" /></span>
          <div className="flex-1">{coupon ? <><p className="text-[14px] font-semibold">{coupon} applied</p><p className="text-[12px] text-ev-700">You save {inr(p.feeDiscount + p.energyDiscount + (p.feeDiscount + p.energyDiscount) * PRICE.gst)} incl. GST</p></> : <><p className="text-[14px] font-semibold">Apply a coupon</p><p className="text-[12px] text-ink-2">{first ? 'FIRSTCHARGE: ₹50 off your visit fee' : 'See available offers'}</p></>}</div>
          {coupon ? <button onClick={(e) => { e.stopPropagation(); update((x) => { x.draft.coupon = undefined }) }} className="text-[13px] font-semibold text-red-600">Remove</button> : <ChevronRight className="h-5 w-5 text-ink-3" />}
        </Card>

        <SectionTitle>Pay with</SectionTitle>
        <div className="space-y-2" role="radiogroup" aria-label="Payment method">
          {([['upi', 'UPI', 'Approve in your UPI app', Smartphone], ['card', 'Card', 'HDFC Visa •••• 4242 (demo)', CreditCard], ['wallet', 'FuelDrop wallet', `Balance ${inr(s.wallet.balance)}`, Wallet]] as const).map(([m, t, sub, I]) => (
            <div key={m} className={cx('rounded-2xl bg-white ring-1 ring-inset transition', method === m ? 'ring-2 ring-navy' : 'ring-line')}>
              <button role="radio" aria-checked={method === m} onClick={() => setM(m)} className="flex w-full items-center gap-3 p-3.5 text-left">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg"><I className="h-5 w-5" /></span>
                <span className="flex-1"><span className="block text-[14px] font-semibold">{t}</span><span className={cx('block text-[12px]', m === 'wallet' && walletLow ? 'text-red-600' : 'text-ink-2')}>{m === 'wallet' && walletLow ? `${sub} · not enough` : sub}</span></span>
                <span className={cx('grid h-5 w-5 place-items-center rounded-full ring-2', method === m ? 'bg-navy ring-navy' : 'ring-line')}>{method === m && <Check className="h-3 w-3 text-white" strokeWidth={3} />}</span>
              </button>
              {method === 'upi' && m === 'upi' && <div className="flex flex-wrap gap-2 px-3.5 pb-3.5">{UPI_APPS.map((u) => <button key={u.id} onClick={() => setUpiApp(u.id)} className={cx('rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1', upiApp === u.id ? 'bg-ev-50 text-ev-700 ring-ev' : 'ring-line text-ink-2')}>{u.name}</button>)}</div>}
              {method === 'wallet' && m === 'wallet' && walletLow && <div className="px-3.5 pb-3.5"><Button size="sm" variant="soft" block={false} onClick={() => nav('/wallet?add=' + Math.ceil(p.total - s.wallet.balance))}>Add {inr(Math.ceil(p.total - s.wallet.balance), 0)} to wallet</Button></div>}
            </div>
          ))}
        </div>

        <div className="pt-2"><Breakdown p={p} /></div>
        <p className="px-1 text-[12px] leading-5 text-ink-2">You pay this estimate now. The final bill uses the kWh our charger’s meter delivers, and any difference is refunded automatically. Free cancellation until the van leaves; ₹49 after that.</p>
      </div>

      {busy && <div className="absolute inset-0 z-30 grid place-items-center bg-white/70 backdrop-blur-sm animate-fade"><div className="text-center"><Loader2 className="mx-auto h-9 w-9 animate-spin text-ev" /><p className="mt-3 text-[14px] font-semibold">Securing your payment…</p></div></div>}

      <Sheet open={cOpen} onClose={() => setCOpen(false)} title="Coupons">
        <form onSubmit={(e) => { e.preventDefault(); apply(code) }} className="flex items-end gap-2">
          <Field className="flex-1" label="Have a code?" placeholder="FIRSTCHARGE" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCErr('') }} error={cErr} />
          <Button size="md" block={false} variant="dark" className="mb-[1px] h-[52px]" type="submit">Apply</Button>
        </form>
        <div className="mt-4 space-y-2">
          {COUPONS.map((c) => { const r = checkCoupon(c.code, { night, firstBooking: first }); return (
            <div key={c.code} className={cx('flex items-center gap-3 rounded-2xl border border-dashed p-3.5', r.ok ? 'border-ev bg-ev-50' : 'border-line opacity-70')}>
              <div className="flex-1"><p className="text-[13px] font-extrabold tracking-wide">{c.code}</p><p className="text-[13px] font-semibold">{c.title}</p><p className="text-[12px] text-ink-2">{r.ok ? c.desc : r.error}</p></div>
              <Button size="sm" block={false} variant={r.ok ? 'ev' : 'ghost'} disabled={!r.ok} onClick={() => apply(c.code)}>Apply</Button>
            </div>) })}
        </div>
      </Sheet>
      <Sheet open={failed} onClose={() => setFailed(false)}>
        <div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600 animate-pop"><CircleX className="h-8 w-8" /></div>
          <h2 className="mt-3 text-[20px] font-extrabold">Payment failed</h2>
          <p className="mx-auto mt-1.5 max-w-[290px] text-[13.5px] leading-5 text-ink-2">Your bank declined the payment of {inr(p.total)}. No money was deducted; if it was, it’ll be refunded automatically in 3–5 working days. We’re holding your slot for 5 minutes.</p></div>
        <div className="mt-5 space-y-2.5"><Button onClick={() => { setFailed(false); pay() }}>Retry {inr(p.total)}</Button><Button variant="ghost" onClick={() => { setFailed(false); setM('upi') }}>Try UPI instead</Button></div>
      </Sheet>
    </Screen>
  )
}

export function UpiPending() {
  const { id } = useParams(); const nav = useNavigate()
  const b = useStore((s) => s.bookings.find((x) => x.id === id))
  const t = useNow(1000)
  const [checking, setChecking] = useState(false)
  const [declined, setDeclined] = useState(false)
  useEffect(() => { if (b && b.status !== 'awaiting_payment' && b.status !== 'cancelled') nav(`/booked/${b.id}`, { replace: true }) }, [b, nav])
  if (!b) return <Screen top={<TopBar title="Payment" back="/home" />}><p className="p-6 text-center text-sm text-ink-2">This payment request no longer exists.</p></Screen>
  const left = Math.max(0, PRICE.upiWindowSec - Math.floor((t - b.createdAt) / 1000))
  const expired = left === 0 || b.status === 'cancelled'
  const approve = () => { setChecking(true); setTimeout(() => { setChecking(false); update((s) => { const x = s.bookings.find((y) => y.id === id); if (x && x.status === 'awaiting_payment') { confirmPaid(s, x); s.soc[x.vehicle.id] = x.currentSoc } }) }, 1200) }
  const decline = () => setDeclined(true)
  const pct = (left / PRICE.upiWindowSec) * 100
  return (
    <Screen top={<TopBar title="Complete payment" back={false} right={<button onClick={() => { cancelBooking(b.id, 'Payment cancelled'); nav('/checkout') }} className="text-[13px] font-semibold text-ink-2">Cancel</button>} />}
      footer={expired || declined ? <div className="space-y-2.5"><Button onClick={() => { if (b.status === 'awaiting_payment') cancelBooking(b.id, 'UPI request expired'); nav('/checkout') }}>Try again</Button><Button variant="ghost" onClick={() => { if (b.status === 'awaiting_payment') cancelBooking(b.id, 'UPI request expired'); update((s) => { s.draft.payMethod = 'card' }); nav('/checkout') }}>Pay by card instead</Button></div>
        : <div className="space-y-2.5"><Button variant="ev" onClick={approve} loading={checking}>{checking ? 'Checking status…' : 'I’ve approved it — check status'}</Button><div className="flex gap-2"><Button variant="ghost" size="md" onClick={() => toast('Opening your UPI app… (demo)', 'info')}>Open UPI app</Button><Button variant="ghost" size="md" onClick={decline}>Simulate decline</Button></div></div>}>
      <div className="flex flex-col items-center px-6 pt-6 text-center animate-rise">
        {expired || declined ? <>
          <div className="grid h-20 w-20 place-items-center rounded-full bg-red-50 text-red-600 animate-pop"><CircleX className="h-10 w-10" /></div>
          <h1 className="mt-4 text-[22px] font-extrabold">{declined ? 'Payment was declined' : 'Request expired'}</h1>
          <p className="mt-2 max-w-[290px] text-sm leading-5 text-ink-2">{declined ? 'The UPI request was declined in your app.' : 'We didn’t get approval within 5 minutes.'} No money was taken. You can try again — your estimate stays the same.</p>
        </> : <>
          <div className="relative grid h-36 w-36 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden><circle cx="50" cy="50" r="45" stroke="#E7EAF3" strokeWidth="6" fill="none" /><circle cx="50" cy="50" r="45" stroke="#16A34A" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={283} strokeDashoffset={283 * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 1s linear' }} /></svg>
            <div><Timer className="mx-auto h-5 w-5 text-ev" /><p className="mt-1 text-[30px] font-extrabold tabular-nums">{mmss(left)}</p><p className="text-[11px] text-ink-2">time left</p></div>
          </div>
          <h1 className="mt-4 text-[22px] font-extrabold">Approve {inr(b.price.total)} in your UPI app</h1>
          <p className="mt-2 max-w-[290px] text-sm leading-5 text-ink-2">We sent a collect request to <b className="text-navy">akshat@okhdfc</b> (demo). Keep this screen open — we’ll confirm automatically. You won’t be charged twice.</p>
          <Card className="mt-5 w-full text-left"><Row k="Booking" v={b.id} /><Row k="Vehicle" v={b.vehicle.name} /><Row k="Amount" v={inr(b.price.total)} strong /></Card>
        </>}
      </div>
    </Screen>
  )
}

export function Booked() {
  const { id } = useParams(); const nav = useNavigate()
  const b = useStore((s) => s.bookings.find((x) => x.id === id))
  if (!b) return null
  const sched = b.slot.kind === 'scheduled'
  return (
    <Screen bg="bg-white" footer={<div className="space-y-2.5"><Button variant="ev" onClick={() => nav(`/track/${b.id}`)} icon={<Zap className="h-5 w-5 fill-current" />}>{sched ? 'View booking' : 'Track your van'}</Button><Button variant="ghost" onClick={() => nav('/home')}>Back to home</Button></div>}>
      <div className="flex flex-col items-center px-6 pt-14 text-center">
        <div className="relative"><span className="absolute inset-0 rounded-full bg-ev/30 animate-ring" /><div className="relative grid h-24 w-24 place-items-center rounded-full bg-ev text-white shadow-glow animate-pop"><CircleCheck className="h-12 w-12" strokeWidth={2.2} /></div></div>
        <PartyPopper className="mt-6 h-5 w-5 text-brand" />
        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight">{sched ? 'Charge scheduled' : 'Booking confirmed'}</h1>
        <p className="mt-2 max-w-[300px] text-sm leading-5 text-ink-2">{sched && b.slot.kind === 'scheduled' ? `A van will reach ${b.address.label.toLowerCase()} on ${b.slot.day.toLowerCase()}, ${b.slot.label}. We’ll remind you 30 minutes before.` : 'We’re finding the nearest van with enough energy for your charge.'}</p>
        <Card className="mt-6 w-full text-left">
          <Row k="Booking ID" v={b.id} /><Row k="Vehicle" v={`${b.vehicle.name}`} /><Row k="Energy (est.)" v={`${b.estKwh} kWh`} /><Row k="Paid" v={`${inr(b.price.total)} · ${b.payMethod.toUpperCase()}`} strong />
        </Card>
      </div>
    </Screen>
  )
}
