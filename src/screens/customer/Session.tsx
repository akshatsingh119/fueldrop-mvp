import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pause, Play, Square, Zap, Gauge, Clock, IndianRupee, TriangleAlert, Headphones, Star, Download, Check, Wallet, Share2, Leaf } from 'lucide-react'
import { Button, Screen, Card, Row, Sheet, Badge, cx, IconBtn, toast, TopBar } from '../../components/ui'
import { Ring } from '../../components/Gauge'
import { Breakdown } from './Checkout'
import { useStore, useNow, sessionProgress, sessionActions, partnerOf } from '../../lib/store'
import { priceFor } from '../../lib/pricing'
import { inr, fmtTime, fmtDT, r2 } from '../../lib/format'

export function Session() {
  const { id } = useParams(); const nav = useNavigate()
  const b = useStore((s) => s.bookings.find((x) => x.id === id))
  const t = useNow(500)
  const [stop, setStop] = useState(false)
  useEffect(() => { if (b?.supersededBy && Date.now() - b.timeline[b.timeline.length - 1].t < 5000) { nav(`/session/${b.supersededBy}`, { replace: true }); return } if (b?.status === 'completed') nav(`/receipt/${b.id}`, { replace: true }); if (b && ['en_route', 'arrived', 'connecting', 'searching', 'scheduled', 'unassigned', 'failed_handshake', 'cancelled'].includes(b.status)) nav(`/track/${b.id}`, { replace: true }) }, [b?.status, b, nav])
  if (!b) return null
  const prog = sessionProgress(b, t)
  const delivered = r2(b.estKwh * prog)
  const soc = Math.round(b.currentSoc + (b.targetSoc - b.currentSoc) * prog)
  const paused = b.status === 'paused'
  const interrupted = b.status === 'interrupted'
  const realMinsLeft = Math.max(0, Math.round(((b.estKwh - delivered) / (b.powerKw || 3)) * 60 * 1.1))
  const sofar = priceFor(delivered, b.price.coupon).total
  const kw = paused || interrupted ? 0 : r2(b.powerKw * (prog > 0.8 ? 0.6 + (1 - prog) * 2 : 0.92 + Math.sin(t / 900) * 0.04))

  if (interrupted) return (
    <Screen top={<TopBar title="Session stopped" back="/home" />} footer={<div className="space-y-2.5"><Button variant="ev" onClick={() => nav('/book')}>Book a top-up</Button><Button variant="ghost" onClick={() => nav(`/receipt/${b.id}`)}>View receipt</Button></div>}>
      <div className="px-5 pb-6 animate-rise">
        <div role="alert" className="rounded-[24px] bg-amber-50 p-5 ring-1 ring-amber-200">
          <div className="flex items-center gap-2 text-amber-900"><TriangleAlert className="h-5 w-5" /><p className="text-[17px] font-extrabold">Charging stopped early</p></div>
          <p className="mt-2 text-[13.5px] leading-5 text-amber-900/85">Our charger hit a fault and stopped safely at <b>{b.deliveredKwh} kWh</b> (booked {b.estKwh} kWh). You’re billed only for what was delivered, and the visit fee is waived.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card><p className="text-[12px] text-ink-2">Delivered</p><p className="text-[22px] font-extrabold">{b.deliveredKwh} <span className="text-[13px]">kWh</span></p><p className="text-[12px] text-ink-2">of {b.estKwh} kWh</p></Card>
          <Card><p className="text-[12px] text-ink-2">Battery now</p><p className="text-[22px] font-extrabold">~{Math.round(b.currentSoc + (b.targetSoc - b.currentSoc) * ((b.deliveredKwh ?? 0) / b.estKwh))}%</p><p className="text-[12px] text-ink-2">from {b.currentSoc}%</p></Card>
        </div>
        {b.refund && <Card className="mt-3 !bg-ev-50"><p className="flex items-center gap-2 text-[14px] font-bold text-ev-700"><Wallet className="h-4 w-4" />{inr(b.refund.amount)} refunded</p><p className="mt-1 text-[12.5px] text-ink-2">To your {b.refund.to}{b.refund.to.includes('wallet') ? ' — instantly' : ' in 3–5 working days'}.</p></Card>}
        <div className="mt-3">{b.finalPrice && <Breakdown p={b.finalPrice} title="Final bill" />}</div>
      </div>
    </Screen>
  )

  return (
    <Screen bg="bg-navy" className="text-white" footer={undefined}>
      <div className="relative flex min-h-full flex-col">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-ev/25 blur-3xl" />
        <div className="relative flex items-center gap-3 px-5 pt-3">
          <IconBtn dark label="Back to home" onClick={() => nav('/home')}><ChevronLeft className="h-5 w-5" /></IconBtn>
          <div className="flex-1"><p className="text-[15px] font-bold">{b.vehicle.name}</p><p className="text-[12px] text-white/55">{b.vehicle.reg} · {b.vehicle.connector} · {b.id}</p></div>
          <Badge tone="ev" className={cx('!bg-ev/20 !text-ev-400', paused && '!bg-amber-400/20 !text-amber-300')}>{paused ? 'Paused' : <><span className="h-1.5 w-1.5 rounded-full bg-ev-400 animate-bolt" /> Live</>}</Badge>
        </div>
        <div className="relative mt-6 flex justify-center">
          <Ring value={soc} size={236} stroke={16} track="rgba(255,255,255,.08)" glow>
            <div>
              <Zap className={cx('mx-auto h-6 w-6 text-ev-400', !paused && 'animate-bolt')} fill="currentColor" />
              <p className="mt-1 text-[54px] font-extrabold leading-none tracking-tight tabular-nums">{soc}<span className="text-[26px]">%</span></p>
              <p className="mt-1.5 text-[12.5px] text-white/55">target {b.targetSoc}%</p>
            </div>
          </Ring>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 px-5">
          {[{ i: Zap, l: 'Energy delivered', v: `${delivered.toFixed(1)}`, u: `/ ${b.estKwh} kWh` }, { i: Gauge, l: 'Power', v: kw.toFixed(1), u: 'kW' }, { i: Clock, l: 'Time left (real)', v: paused ? '—' : realMinsLeft >= 60 ? `${Math.floor(realMinsLeft / 60)}h ${realMinsLeft % 60}` : `${realMinsLeft}`, u: paused ? '' : realMinsLeft >= 60 ? 'm' : 'min' }, { i: IndianRupee, l: 'Cost so far', v: inr(sofar), u: '' }].map((x) => (
            <div key={x.l} className="rounded-2xl bg-white/[.06] p-3.5 ring-1 ring-white/10">
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/55"><x.i className="h-3.5 w-3.5 text-ev-400" />{x.l}</p>
              <p className="mt-1 text-[20px] font-extrabold tabular-nums">{x.v} <span className="text-[12px] font-semibold text-white/50">{x.u}</span></p>
            </div>
          ))}
        </div>
        <div className="relative mx-5 mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-ev to-ev-400 transition-all duration-500" style={{ width: `${prog * 100}%` }} /></div>
        <p className="relative mt-2 px-5 text-[11.5px] text-white/45">Demo plays the whole session in ~40 seconds.</p>
        <div className="relative mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-white/[.06] p-3.5 ring-1 ring-white/10">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-[13px] font-bold">{(partnerOf(b)?.name ?? 'P').split(' ').map((w) => w[0]).join('')}</span>
          <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold">{partnerOf(b)?.name} is with your EV</p><p className="truncate text-[11.5px] text-white/55">Van {b.vanId} · started {b.chargeStartAt ? fmtTime(b.chargeStartAt) : '—'} · billed on metered kWh</p></div>
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="text-[12px] font-semibold">{partnerOf(b)?.rating}</span>
        </div>
        <div className="relative mt-auto grid grid-cols-[1fr_1fr_auto] gap-2.5 px-5 pb-6 pt-6">
          {paused
            ? <Button variant="ev" size="lg" onClick={() => { sessionActions.resume(b.id); toast('Charging resumed') }} icon={<Play className="h-5 w-5 fill-current" />}>Resume</Button>
            : <Button variant="ghost" className="!bg-white/10 !text-white !ring-white/15" onClick={() => { sessionActions.pause(b.id); toast('Paused — the partner keeps the cable connected', 'info') }} icon={<Pause className="h-5 w-5" />}>Pause</Button>}
          <Button variant="danger" className="!bg-white !ring-0" onClick={() => setStop(true)} icon={<Square className="h-4 w-4 fill-current" />}>Stop</Button>
          <IconBtn dark label="Help" onClick={() => nav('/support?booking=' + b.id)} className="!h-14 !w-14 !rounded-2xl"><Headphones className="h-5 w-5" /></IconBtn>
        </div>
      </div>
      <Sheet open={stop} onClose={() => setStop(false)} title="Stop charging now?" footer={<div className="space-y-2.5"><Button variant="danger" onClick={() => { sessionActions.stop(b.id); setStop(false) }}>Stop at {delivered.toFixed(1)} kWh</Button><Button variant="ghost" onClick={() => setStop(false)}>Keep charging</Button></div>}>
        <div className="text-navy">
          <p className="text-[13.5px] leading-5 text-ink-2">You’ll be billed for the energy delivered so far. The unused part of your estimate is refunded automatically.</p>
          <Card className="mt-3 !shadow-none ring-1 ring-line"><Row k="Paid (estimate)" v={inr(b.price.total)} /><Row k={`Bill for ${delivered.toFixed(1)} kWh`} v={inr(sofar)} /><Row k="Refund" v={inr(Math.max(0, b.price.total - sofar))} strong tone="ev" /></Card>
        </div>
      </Sheet>
    </Screen>
  )
}

const TIPS = ['On time', 'Polite', 'Careful with my car', 'Tidy cable handling', 'Explained clearly']
export function Receipt() {
  const { id } = useParams(); const nav = useNavigate()
  const b = useStore((s) => s.bookings.find((x) => x.id === id))
  const [stars, setStars] = useState(b?.rating ?? 0)
  const [tips, setTips] = useState<string[]>(b?.tips ?? [])
  const [fb, setFb] = useState(b?.feedback ?? '')
  if (!b) return null
  const fp = b.finalPrice ?? b.price
  const dur = b.endedAt && b.chargeStartAt ? Math.max(1, Math.round(((b.deliveredKwh ?? 0) / (b.powerKw || 3)) * 60 * 1.1)) : 0
  const endSoc = Math.round(b.currentSoc + (b.targetSoc - b.currentSoc) * ((b.deliveredKwh ?? b.estKwh) / (b.estKwh || 1)))
  const p = partnerOf(b)
  return (
    <Screen top={<TopBar title="Receipt" back="/home" right={<IconBtn label="Share receipt" onClick={() => { navigator.clipboard?.writeText(`${location.origin}${import.meta.env.BASE_URL}#/print/receipt/${b.id}`); toast('Receipt link copied') }}><Share2 className="h-5 w-5" /></IconBtn>} />}
      footer={b.rating ? <Button variant="ev" onClick={() => nav('/home')}>Done</Button> : <Button variant="ev" disabled={!stars} onClick={() => { sessionActions.rate(b.id, stars, fb, tips); toast('Thanks for rating ' + (p?.name.split(' ')[0] ?? 'your partner')); nav('/home') }}>{stars ? 'Submit rating' : 'Rate to finish'}</Button>}>
      <div className="px-5 pb-6 animate-rise">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-ev to-ev-700 p-5 text-white shadow-glow">
          <div aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-xl" />
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/20"><Check className="h-5 w-5" strokeWidth={3} /></span><p className="font-semibold">{b.status === 'interrupted' ? 'Partially charged' : 'Charged'} · {b.endedAt ? fmtDT(b.endedAt) : ''}</p></div>
          <p className="mt-4 text-[42px] font-extrabold leading-none tracking-tight">{b.deliveredKwh ?? b.estKwh} <span className="text-[20px]">kWh</span></p>
          <p className="mt-1.5 text-[14px] text-white/85">{b.currentSoc}% → ~{endSoc}% · {b.vehicle.name}</p>
          <div className="mt-4 flex gap-4 text-[12px] text-white/85"><span><Clock className="mr-1 inline h-3.5 w-3.5" />~{dur} min (real)</span><span><Leaf className="mr-1 inline h-3.5 w-3.5" />~{Math.round((b.deliveredKwh ?? 0) * 7)} km added</span></div>
        </div>
        {b.refund && b.refund.amount > 0 && <Card className="mt-3 flex items-start gap-3 !bg-ev-50 !shadow-none ring-1 ring-ev-100"><Wallet className="mt-0.5 h-5 w-5 flex-none text-ev-700" /><div><p className="text-[14px] font-bold text-ev-700">{inr(b.refund.amount)} refunded</p><p className="text-[12.5px] text-ink-2">{b.refund.reason}. To your {b.refund.to}{b.refund.to.includes('wallet') ? ' — instantly' : ', 3–5 working days'}.</p></div></Card>}
        <div className="mt-3"><Breakdown p={fp} title="Final bill" /></div>
        <Card className="mt-3"><Row k="Paid upfront" v={`${inr(b.price.total)} · ${b.payMethod.toUpperCase()}`} /><Row k="Meter reading" v={`${(1520.4).toFixed(1)} → ${(1520.4 + (b.deliveredKwh ?? 0)).toFixed(1)} kWh`} /><Row k="Van / operator" v={`${b.vanId ?? '—'} · ${p?.name ?? '—'}`} /><Row k="Invoice no." v={`FD/BLR/26-27/${b.id.slice(2)}`} /></Card>
        <Button className="mt-3" variant="ghost" size="md" icon={<Download className="h-4 w-4" />} onClick={() => window.open(`${import.meta.env.BASE_URL}#/print/receipt/${b.id}`, '_blank')}>Download GST receipt (PDF)</Button>

        <div className="mt-6 text-center">
          <p className="text-[16px] font-bold">{b.rating ? 'Thanks for your rating' : `How was ${p?.name.split(' ')[0] ?? 'your partner'}?`}</p>
          <div className="mt-3 flex justify-center gap-2" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} disabled={!!b.rating} onClick={() => setStars(n)} className="transition active:scale-90"><Star className={cx('h-9 w-9 transition', n <= stars ? 'fill-amber-400 text-amber-400' : 'text-navy-100')} /></button>)}
          </div>
          {stars > 0 && !b.rating && <div className="mt-4 animate-rise">
            <div className="flex flex-wrap justify-center gap-2">{TIPS.map((x) => <button key={x} onClick={() => setTips((t) => t.includes(x) ? t.filter((y) => y !== x) : [...t, x])} className={cx('rounded-full px-3 py-1.5 text-[12.5px] font-semibold ring-1', tips.includes(x) ? 'bg-ev-50 text-ev-700 ring-ev' : 'ring-line')}>{x}</button>)}</div>
            <textarea value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Anything else? (optional)" aria-label="Feedback" className="mt-3 h-20 w-full resize-none rounded-2xl bg-white p-3 text-[14px] ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>}
        </div>
      </div>
    </Screen>
  )
}
