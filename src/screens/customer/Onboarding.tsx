import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Zap, ShieldCheck, Clock, IndianRupee, LocateFixed, MapPin, Bell, Navigation, Building2, CircleCheck } from 'lucide-react'
import { Button, Screen, TopBar, Field, Logo, Card, Chip, toast, cx, Badge } from '../../components/ui'
import { HeroArt, PinArt } from '../../components/Art'
import { actions, update, useStore } from '../../lib/store'
import { ZONES, zoneForPin } from '../../lib/data'
import { mmss } from '../../lib/format'

export function Splash() {
  const nav = useNavigate()
  const auth = useStore((s) => s.auth)
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-navy text-white">
      <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-ev/30 blur-3xl" />
      <div aria-hidden className="absolute -left-24 bottom-40 h-60 w-60 rounded-full bg-brand/20 blur-3xl" />
      <div className="relative flex items-center justify-between px-6 pt-5">
        <Logo size={30} light />
        <Link to="/admin" className="text-[12px] font-semibold text-white/50 hover:text-white">Ops console</Link>
      </div>
      <div className="relative flex flex-1 flex-col justify-center px-6">
        <HeroArt className="mx-auto w-full max-w-[330px] animate-rise" />
        <h1 className="mt-6 text-[34px] font-extrabold leading-[1.08] tracking-tight animate-rise" style={{ animationDelay: '.05s' }}>Your EV, charged<br />where it’s <span className="text-ev-400">parked.</span></h1>
        <p className="mt-3 text-[15px] leading-6 text-white/70 animate-rise" style={{ animationDelay: '.1s' }}>Book a doorstep charge for your car, scooter or e-auto. A FuelDrop van comes to your parking spot.</p>
        <div className="mt-5 flex flex-wrap gap-2 animate-rise" style={{ animationDelay: '.15s' }}>
          {[{ i: IndianRupee, t: '₹21/kWh + ₹149 visit + GST' }, { i: Clock, t: 'Now or scheduled' }, { i: ShieldCheck, t: 'Pay for metered kWh' }].map((x) => (
            <span key={x.t} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white/85 ring-1 ring-white/10"><x.i className="h-3.5 w-3.5 text-ev-400" />{x.t}</span>
          ))}
        </div>
      </div>
      <div className="relative space-y-3 px-6 pb-8">
        {auth.loggedIn && auth.onboarded
          ? <Button variant="ev" onClick={() => nav('/home')} icon={<Zap className="h-5 w-5 fill-current" />}>Continue as {auth.name?.split(' ')[0]}</Button>
          : <Button variant="ev" onClick={() => nav('/login')} icon={<Zap className="h-5 w-5 fill-current" />}>Get started</Button>}
        <button onClick={() => nav('/fleet/signup')} className="flex w-full items-center justify-center gap-2 py-1.5 text-[13px] font-semibold text-white/70 hover:text-white"><Building2 className="h-4 w-4" /> FuelDrop for Business <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ev-400">Early access</span></button>
        <p className="text-center text-[11px] text-white/40">Demo MVP · sample data · no real payments</p>
      </div>
    </div>
  )
}

export function Login() {
  const nav = useNavigate()
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const digits = phone.replace(/\D/g, '')
  const submit = () => {
    if (digits.length !== 10) return setErr('Enter a 10-digit mobile number')
    if (!/^[6-9]/.test(digits)) return setErr('Indian mobile numbers start with 6, 7, 8 or 9')
    setErr(''); setBusy(true)
    setTimeout(() => { update((s) => { s.demo.otpExpired = false }); nav(`/otp?phone=${digits}`) }, 700)
  }
  return (
    <Screen top={<TopBar back="/" />} footer={<Button onClick={submit} loading={busy} disabled={!digits}>Send OTP</Button>}>
      <div className="px-5 pt-2 animate-rise">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">What’s your<br />mobile number?</h1>
        <p className="mt-2 text-sm text-ink-2">We’ll send a 6-digit code to verify it.</p>
        <form className="mt-7" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <Field label="Mobile number" prefix="🇮🇳 +91" inputMode="numeric" autoFocus autoComplete="tel-national" placeholder="98100 12345" maxLength={11}
            value={digits.length > 5 ? digits.slice(0, 5) + ' ' + digits.slice(5) : digits} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setErr('') }} error={err} />
        </form>
        <button className="mt-3 text-[13px] font-semibold text-ev-700" onClick={() => setPhone('9810012345')}>Use demo number 98100 12345</button>
        <p className="mt-8 text-[12px] leading-5 text-ink-3">By continuing you agree to FuelDrop’s Terms and Privacy Policy (placeholders in this demo).</p>
      </div>
    </Screen>
  )
}

export function Otp() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const phone = sp.get('phone') ?? '9810012345'
  const expiredFlag = useStore((s) => s.demo.otpExpired)
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [err, setErr] = useState('')
  const [tries, setTries] = useState(3)
  const [left, setLeft] = useState(expiredFlag ? 0 : 30)
  const [expired, setExpired] = useState(expiredFlag)
  const [shake, setShake] = useState(false)
  const [busy, setBusy] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  useEffect(() => { const i = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000); return () => clearInterval(i) }, [])
  useEffect(() => { if (expiredFlag) { setExpired(true); setLeft(0) } }, [expiredFlag])
  const resend = () => { setExpired(false); setLeft(30); setTries(3); setErr(''); setCode(Array(6).fill('')); update((s) => { s.demo.otpExpired = false }); toast(`New code sent to +91 ${phone.slice(0, 5)} ${phone.slice(5)}`); refs.current[0]?.focus() }
  const verify = (c = code.join('')) => {
    if (c.length < 6) return
    if (expired) { setErr('This code has expired. Request a new one.'); return }
    if (tries <= 0) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (c === '123456') {
        actions.login('+91 ' + phone.slice(0, 5) + ' ' + phone.slice(5))
        toast('Number verified')
        nav('/location')
      } else {
        const t = tries - 1; setTries(t); setShake(true); setTimeout(() => setShake(false), 450)
        setErr(t > 0 ? `Incorrect OTP. ${t} attempt${t > 1 ? 's' : ''} left before a 30-minute lock.` : 'Too many wrong attempts. Login is locked for 30 minutes (demo: tap Resend to unlock).')
        setCode(Array(6).fill('')); refs.current[0]?.focus()
      }
    }, 600)
  }
  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, '')
    if (d.length > 1) { const arr = d.slice(0, 6).split(''); const n = Array(6).fill('').map((_, j) => arr[j] ?? ''); setCode(n); if (arr.length === 6) verify(n.join('')); return }
    const n = [...code]; n[i] = d; setCode(n); setErr('')
    if (d && i < 5) refs.current[i + 1]?.focus()
    if (n.every(Boolean)) verify(n.join(''))
  }
  const locked = tries <= 0
  return (
    <Screen top={<TopBar back="/login" />} footer={<Button onClick={() => verify()} loading={busy} disabled={code.join('').length < 6 || locked}>Verify & continue</Button>}>
      <div className="px-5 pt-2 animate-rise">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Enter the code</h1>
        <p className="mt-2 text-sm text-ink-2">Sent to <b className="text-navy">+91 {phone.slice(0, 5)} {phone.slice(5)}</b> · <Link to="/login" className="font-semibold text-ev-700">Change</Link></p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ev-50 px-3 py-2 text-[12.5px] font-medium text-ev-700 ring-1 ring-ev-100"><ShieldCheck className="h-4 w-4" /> Demo code: <b className="tracking-[.2em]">123456</b></div>
        <div className={cx('mt-6 flex gap-2.5', shake && 'animate-[shake_.4s]')} style={shake ? { animation: 'shake .4s' } : undefined}>
          {code.map((c, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el }} value={c} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Digit ${i + 1}`} disabled={locked}
              onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !c && i) refs.current[i - 1]?.focus() }}
              className={cx('h-14 w-full min-w-0 rounded-2xl bg-white text-center text-[22px] font-bold text-navy shadow-card ring-1 ring-inset transition focus:outline-none focus:ring-2', err ? 'ring-red-400' : c ? 'ring-navy' : 'ring-line focus:ring-navy')} />
          ))}
        </div>
        {err && <p role="alert" className="mt-3 text-[13px] font-medium text-red-600">{err}</p>}
        {expired && !err && <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-800">This OTP expired (codes are valid for 5 minutes). Request a new one to continue.</p>}
        <div className="mt-6 text-sm text-ink-2">
          {left > 0 && !expired ? <>Resend code in <b className="tabular-nums text-navy">{mmss(left)}</b></> : <button onClick={resend} className="font-semibold text-ev-700">Resend code via SMS</button>}
        </div>
      </div>
    </Screen>
  )
}

export function Location() {
  const nav = useNavigate()
  const denied = useStore((s) => s.demo.locationDenied)
  const [phase, setPhase] = useState<'ask' | 'locating' | 'found' | 'denied'>('ask')
  const allow = () => {
    setPhase('locating')
    setTimeout(() => {
      if (denied) setPhase('denied')
      else { setPhase('found'); update((s) => { s.locationGranted = true }) }
    }, 1200)
  }
  return (
    <Screen top={<TopBar back={false} right={<button onClick={() => nav('/address/new')} className="text-[13px] font-semibold text-ink-2">Skip</button>} />}
      footer={phase === 'found' ? <Button variant="ev" onClick={() => nav('/address/new?pin=560102&line=' + encodeURIComponent('Sector 2, HSR Layout, Bengaluru') + '&gps=1')}>Confirm this location</Button>
        : phase === 'denied' ? <div className="space-y-2.5"><Button onClick={() => nav('/address/new')}>Enter address manually</Button><Button variant="ghost" onClick={() => { update((s) => { s.demo.locationDenied = false }); setPhase('ask') }}>I’ve turned it on — try again</Button></div>
          : <div className="space-y-2.5"><Button variant="ev" onClick={allow} loading={phase === 'locating'} icon={<LocateFixed className="h-5 w-5" />}>{phase === 'locating' ? 'Finding you…' : 'Allow location access'}</Button><Button variant="ghost" onClick={() => nav('/address/new')}>Enter address manually</Button></div>}>
      <div className="flex flex-col items-center px-6 pt-10 text-center animate-rise">
        <PinArt tone={phase === 'denied' ? '#DC2626' : '#16A34A'} />
        {phase === 'denied' ? <>
          <h1 className="mt-4 text-[24px] font-extrabold tracking-tight">Location is turned off</h1>
          <p className="mt-2 max-w-[290px] text-sm leading-5 text-ink-2">No problem — type your address instead. To use GPS later, allow location for this site in your browser settings.</p>
          <Card className="mt-6 w-full text-left"><p className="text-[13px] font-semibold">How to turn it on</p><ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[13px] text-ink-2"><li>Tap the lock icon in the address bar</li><li>Set Location to “Allow”</li><li>Come back and tap “Try again”</li></ol></Card>
        </> : phase === 'found' ? <>
          <h1 className="mt-4 text-[24px] font-extrabold tracking-tight">Found you</h1>
          <Card className="mt-5 w-full text-left"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-ev-100 text-ev-700"><Navigation className="h-5 w-5" /></span><div><p className="font-semibold">Sector 2, HSR Layout</p><p className="text-[13px] text-ink-2">Bengaluru, Karnataka 560102</p><Badge tone="ev" className="mt-2"><CircleCheck className="h-3 w-3" /> We charge here</Badge></div></div></Card>
        </> : <>
          <h1 className="mt-4 text-[24px] font-extrabold tracking-tight">Where’s your EV parked?</h1>
          <p className="mt-2 max-w-[290px] text-sm leading-5 text-ink-2">We use your location to check that we serve your area and to guide the van to your parking spot. We don’t track you in the background.</p>
        </>}
      </div>
    </Screen>
  )
}

export function AddressNew() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const hasVehicle = useStore((s) => s.vehicles.length > 0)
  const [label, setLabel] = useState('Home')
  const [flat, setFlat] = useState('')
  const [line, setLine] = useState(sp.get('line') ?? '')
  const [pin, setPin] = useState(sp.get('pin') ?? '')
  const [parking, setParking] = useState('')
  const [err, setErr] = useState<Record<string, string>>({})
  const zone = /^\d{6}$/.test(pin) ? zoneForPin(pin) : undefined
  const save = () => {
    const e: Record<string, string> = {}
    if (!line.trim()) e.line = 'Add your area and street'
    if (!/^\d{6}$/.test(pin)) e.pin = 'Pincode should be 6 digits'
    setErr(e); if (Object.keys(e).length) return
    if (!zone) { nav(`/waitlist?pin=${pin}`); return }
    actions.addAddress({ label, line: [flat, line].filter(Boolean).join(', '), pin, parking: parking || undefined })
    update((s) => { s.locationGranted = true })
    toast(`${label} address saved`)
    nav(hasVehicle ? (sp.get('back') ?? '/home') : '/vehicle/add')
  }
  return (
    <Screen top={<TopBar title="Add address" sub="Where should the van come?" />} footer={<Button onClick={save}>{/^\d{6}$/.test(pin) && !zone ? 'Check availability' : 'Save address'}</Button>}>
      <div className="space-y-4 px-5 pb-6 animate-rise">
        <div className="relative h-32 overflow-hidden rounded-2xl bg-[#E9EEF4] ring-1 ring-line">
          <svg viewBox="0 0 350 130" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden><g stroke="#fff" strokeWidth="10"><path d="M0 50H350M0 105H350M70 0V130M210 0V130" /></g><rect x="90" y="62" width="100" height="30" rx="6" fill="#D7F0DE" /></svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full"><MapPin className="h-9 w-9 fill-brand text-white drop-shadow" /></div>
          <span className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink-2">{sp.get('gps') ? 'Pinned from GPS' : 'Pin is placed from pincode'}</span>
        </div>
        <div className="flex gap-2">{['Home', 'Work', 'Other'].map((l) => <Chip key={l} on={label === l} onClick={() => setLabel(l)}>{l}</Chip>)}</div>
        <Field label="Flat / house no. & building" placeholder="Flat 1204, Tower B, Sobha Daffodil" value={flat} onChange={(e) => setFlat(e.target.value)} />
        <Field label="Area & street" placeholder="Sector 2, HSR Layout" value={line} onChange={(e) => setLine(e.target.value)} error={err.line} />
        <Field label="Pincode" inputMode="numeric" maxLength={6} placeholder="560102" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} error={err.pin}
          hint={zone ? <span className="font-semibold text-ev-700">✓ {zone.name}, {zone.city} — we charge here</span> : /^\d{6}$/.test(pin) ? <span className="font-semibold text-amber-700">We don’t serve this pincode yet</span> : 'Try 560102 (HSR, Bengaluru) or 201309 (Noida)'} />
        <Field label="Parking spot (helps the partner find your EV)" placeholder="Basement B2, slot 114" value={parking} onChange={(e) => setParking(e.target.value)} />
      </div>
    </Screen>
  )
}

export function Waitlist() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const pin = sp.get('pin') ?? '400001'
  const phone = useStore((s) => s.auth.phone)
  const joined = useStore((s) => s.waitlist.some((w) => w.pin === pin))
  return (
    <Screen top={<TopBar title="Not in your area yet" />} footer={<div className="space-y-2.5">
      <Button variant="ev" disabled={joined} icon={<Bell className="h-5 w-5" />} onClick={() => { update((s) => { s.waitlist.push({ pin, phone: phone ?? '', t: Date.now() }) }); toast('You’re on the waitlist for ' + pin) }}>{joined ? 'You’re on the waitlist' : 'Notify me when you launch here'}</Button>
      <Button variant="ghost" onClick={() => nav('/address/new')}>Try another address</Button></div>}>
      <div className="flex flex-col items-center px-6 pt-6 text-center animate-rise">
        <PinArt tone="#FF6A2B" />
        <h1 className="mt-3 text-[22px] font-extrabold tracking-tight">We don’t charge in {pin} yet</h1>
        <p className="mt-2 max-w-[290px] text-sm leading-5 text-ink-2">FuelDrop is starting with a few zones. Join the waitlist and we’ll SMS you when vans reach your area.</p>
      </div>
      <div className="px-5 pb-6 pt-6">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-ink-3">Live zones (demo)</p>
        <Card className="divide-y divide-line p-0">
          {ZONES.map((z) => <div key={z.id} className="flex items-center justify-between px-4 py-3 text-[14px]"><span className="font-medium">{z.name}</span><span className="text-[12px] text-ink-2">{z.city} · {z.pins[0]}</span></div>)}
        </Card>
      </div>
    </Screen>
  )
}
