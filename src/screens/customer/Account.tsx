import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { History, Wallet as WalletI, Plus, ChevronRight, Car, MapPin, Headphones, Building2, MonitorDot, LogOut, RotateCcw, Trash2, Star, ArrowDownLeft, ArrowUpRight, Pencil, ChevronDown, MessageCircle, Phone, Mail, Zap, Check } from 'lucide-react'
import { Button, Screen, TopBar, Card, Badge, Sheet, Field, Empty, Skeleton, cx, toast, VehicleGlyph, SectionTitle, Chip, useOffline } from '../../components/ui'
import { BottomNav } from '../../components/BottomNav'
import { useStore, update, actions, resetAll, isActive } from '../../lib/store'
import { inr, fmtDT, initials, r2, uid } from '../../lib/format'
import { statusLabel, statusTone, bookingLink } from './Home'

export function Bookings() {
  const nav = useNavigate(); const [sp] = useSearchParams()
  const bookings = useStore((s) => s.bookings)
  const all = bookings.filter((b) => b.source === 'me' && b.status !== 'awaiting_payment')
  const [tab, setTab] = useState<'active' | 'past'>('past')
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t) }, [])
  useEffect(() => { if (all.some(isActive)) setTab('active') }, []) // eslint-disable-line
  const list = sp.get('empty') ? [] : all.filter((b) => (tab === 'active' ? isActive(b) : !isActive(b)))
  return (
    <Screen bottom={<BottomNav />} top={<TopBar back={false} title={<span className="text-[22px]">Bookings</span>} />}>
      <div className="px-5 pb-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-card">{(['active', 'past'] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={cx('rounded-xl py-2.5 text-[13px] font-semibold capitalize transition', tab === k ? 'bg-navy text-white' : 'text-ink-2')}>{k}</button>)}</div>
        {loading ? <div className="mt-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[84px]" />)}</div>
          : !list.length ? <Empty icon={<History className="h-9 w-9" />} title={tab === 'active' && !sp.get('empty') ? 'No live bookings' : 'No charging sessions yet'} body="Your sessions and GST receipts will show up here." action={<Button variant="ev" onClick={() => nav('/home')} icon={<Zap className="h-5 w-5 fill-current" />}>Book a charge</Button>} />
            : <div className="mt-4 space-y-3">{list.map((b, i) => (
              <Card key={b.id} onClick={() => nav(bookingLink(b))} className="flex items-center gap-3 animate-rise">
                <VehicleGlyph type={b.vehicle.type} colour={b.vehicle.colour} />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{b.vehicle.name}</p><p className="text-[12px] text-ink-2">{fmtDT(b.createdAt)}</p><p className="text-[12px] text-ink-2">{b.deliveredKwh ?? b.estKwh} kWh · {inr(b.finalPrice?.total ?? b.price.total)}</p></div>
                <div className="flex flex-col items-end gap-1.5"><Badge tone={statusTone(b.status)}>{statusLabel[b.status]}</Badge>{b.rating && <span className="text-[11px] text-ink-2"><Star className="inline h-3 w-3 fill-amber-400 text-amber-400" /> {b.rating}</span>}</div>
                <span className="sr-only">{i}</span>
              </Card>))}</div>}
      </div>
    </Screen>
  )
}

export function Wallet() {
  const [sp] = useSearchParams(); const nav = useNavigate()
  const w = useStore((s) => s.wallet)
  const offline = useOffline()
  const [open, setOpen] = useState(!!sp.get('add'))
  const [amt, setAmt] = useState(sp.get('add') ?? '500')
  const [busy, setBusy] = useState(false)
  const add = () => { const n = +amt; if (!n || n < 10 || n > 10000) return; setBusy(true); setTimeout(() => { update((s) => { s.wallet.balance = r2(s.wallet.balance + n); s.wallet.txns.unshift({ id: uid('T'), t: Date.now(), label: 'Added via UPI (demo)', amount: n }) }); setBusy(false); setOpen(false); toast(`${inr(n)} added to wallet`); if (sp.get('add')) nav('/checkout') }, 900) }
  return (
    <Screen bottom={<BottomNav />} top={<TopBar back={false} title={<span className="text-[22px]">Wallet</span>} />}>
      <div className="px-5 pb-6">
        <div className="relative overflow-hidden rounded-[24px] bg-navy p-5 text-white shadow-lift">
          <div aria-hidden className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-ev/30 blur-2xl" />
          <p className="text-[13px] text-white/60">FuelDrop wallet balance</p>
          <p className="mt-1 text-[36px] font-extrabold tracking-tight tabular-nums">{inr(w.balance)}</p>
          <p className="text-[11.5px] text-white/50">Refunds land here instantly. Closed-loop: can’t be withdrawn or transferred.</p>
          <Button className="mt-4" variant="ev" size="md" disabled={offline} onClick={() => setOpen(true)} icon={<Plus className="h-4 w-4" />}>Add money</Button>
        </div>
        <SectionTitle>Activity</SectionTitle>
        {!w.txns.length ? <Empty icon={<WalletI className="h-9 w-9" />} title="No activity yet" body="Top-ups, payments and refunds will appear here." /> :
          <Card className="divide-y divide-line !p-0">{w.txns.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cx('grid h-9 w-9 place-items-center rounded-full', t.amount > 0 ? 'bg-ev-100 text-ev-700' : 'bg-navy-100 text-navy')}>{t.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-medium">{t.label}</p><p className="text-[11.5px] text-ink-2">{fmtDT(t.t)}</p></div>
              <p className={cx('text-[14px] font-bold tabular-nums', t.amount > 0 ? 'text-ev-700' : 'text-navy')}>{t.amount > 0 ? '+' : '−'}{inr(Math.abs(t.amount))}</p>
            </div>))}</Card>}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add money" footer={<Button variant="ev" onClick={add} loading={busy} disabled={!+amt || +amt < 10 || +amt > 10000}>Add {inr(+amt || 0, 0)} via UPI</Button>}>
        <Field label="Amount" prefix="₹" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, '').slice(0, 5))} error={+amt > 10000 ? 'Max ₹10,000 per top-up' : +amt && +amt < 10 ? 'Minimum ₹10' : undefined} />
        <div className="mt-3 flex gap-2">{[200, 500, 1000, 2000].map((n) => <Chip key={n} on={+amt === n} onClick={() => setAmt(String(n))} className="flex-1">₹{n.toLocaleString('en-IN')}</Chip>)}</div>
      </Sheet>
    </Screen>
  )
}

export function Profile() {
  const nav = useNavigate()
  const s = useStore((x) => x)
  const [edit, setEdit] = useState(false)
  const [name, setName] = useState(s.auth.name ?? '')
  const done = s.bookings.filter((b) => b.source === 'me' && b.status === 'completed')
  const kwh = r2(done.reduce((a, b) => a + (b.deliveredKwh ?? 0), 0))
  const Item = ({ icon: I, t, d, to, onClick, danger }: { icon: typeof Car; t: string; d?: string; to?: string; onClick?: () => void; danger?: boolean }) => (
    <button onClick={onClick ?? (() => to && nav(to))} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-bg">
      <span className={cx('grid h-9 w-9 place-items-center rounded-xl', danger ? 'bg-red-50 text-red-600' : 'bg-bg text-navy')}><I className="h-[18px] w-[18px]" /></span>
      <span className="flex-1"><span className={cx('block text-[14px] font-semibold', danger && 'text-red-600')}>{t}</span>{d && <span className="block text-[12px] text-ink-2">{d}</span>}</span>
      {!danger && <ChevronRight className="h-4 w-4 text-ink-3" />}
    </button>
  )
  return (
    <Screen bottom={<BottomNav />} top={<TopBar back={false} title={<span className="text-[22px]">Profile</span>} />}>
      <div className="space-y-4 px-5 pb-6">
        <Card className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-navy text-[18px] font-bold text-white">{initials(s.auth.name ?? 'A S')}</span>
          <div className="flex-1"><p className="text-[17px] font-bold">{s.auth.name}</p><p className="text-[13px] text-ink-2">{s.auth.phone}</p></div>
          <button aria-label="Edit name" onClick={() => setEdit(true)} className="grid h-9 w-9 place-items-center rounded-xl bg-bg"><Pencil className="h-4 w-4" /></button>
        </Card>
        <div className="grid grid-cols-3 gap-2.5">{[[done.length, 'sessions'], [`${kwh}`, 'kWh charged'], [`~${Math.round(kwh * 7)}`, 'km added']].map(([v, l]) => <Card key={l as string} className="!p-3 text-center"><p className="text-[18px] font-extrabold">{v}</p><p className="text-[11px] text-ink-2">{l}</p></Card>)}</div>
        <Card className="divide-y divide-line !p-0">
          <Item icon={Car} t="My vehicles" d={`${s.vehicles.length} saved`} to="/profile/vehicles" />
          <Item icon={MapPin} t="Saved addresses" d={`${s.addresses.length} saved`} to="/profile/addresses" />
          <Item icon={WalletI} t="Wallet" d={inr(s.wallet.balance)} to="/wallet" />
          <Item icon={Headphones} t="Help & support" to="/support" />
        </Card>
        <Card className="divide-y divide-line !p-0">
          <Item icon={Building2} t="FuelDrop for Business" d="Early access · fleets & depots" to="/fleet" />
          <Item icon={MonitorDot} t="Ops console (demo)" d="See bookings as dispatch does" onClick={() => window.open(`${import.meta.env.BASE_URL}#/admin`, '_blank')} />
        </Card>
        <Card className="divide-y divide-line !p-0">
          <Item icon={RotateCcw} t="Reset demo data" danger onClick={() => { if (confirm('Reset all demo data in this browser?')) { resetAll(); nav('/') } }} />
          <Item icon={LogOut} t="Log out" danger onClick={() => { actions.logout(); nav('/') }} />
        </Card>
        <p className="text-center text-[11px] text-ink-3">FuelDrop demo MVP · v0.1 · sample data</p>
      </div>
      <Sheet open={edit} onClose={() => setEdit(false)} title="Your name" footer={<Button disabled={!name.trim()} onClick={() => { update((x) => { x.auth.name = name.trim() }); setEdit(false); toast('Name updated') }}>Save</Button>}>
        <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      </Sheet>
    </Screen>
  )
}

export function Vehicles() {
  const nav = useNavigate(); const s = useStore((x) => x)
  const [del, setDel] = useState<string>()
  return (
    <Screen top={<TopBar title="My vehicles" back="/profile" />} footer={<Button variant="ghost" icon={<Plus className="h-5 w-5" />} onClick={() => nav('/vehicle/add?back=/profile/vehicles')}>Add a vehicle</Button>}>
      <div className="space-y-3 px-5 pb-6">
        {!s.vehicles.length && <Empty icon={<Car className="h-9 w-9" />} title="No vehicles yet" body="Add your EV so we can bring the right connector." />}
        {s.vehicles.map((v) => (
          <Card key={v.id} className="flex items-center gap-3">
            <VehicleGlyph type={v.type} colour={v.colour} />
            <div className="min-w-0 flex-1"><p className="font-semibold">{v.name}</p><p className="text-[12.5px] text-ink-2">{v.reg} · {v.connector} · {v.batteryKwh} kWh</p>
              {s.vehicleId === v.id ? <Badge tone="ev" className="mt-1.5"><Check className="h-3 w-3" /> Default</Badge> : <button onClick={() => update((x) => { x.vehicleId = v.id })} className="mt-1 text-[12px] font-semibold text-ev-700">Make default</button>}</div>
            <button aria-label={`Remove ${v.name}`} onClick={() => setDel(v.id)} className="grid h-9 w-9 place-items-center rounded-xl text-ink-3 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </Card>))}
      </div>
      <Sheet open={!!del} onClose={() => setDel(undefined)} title="Remove this vehicle?" footer={<div className="space-y-2.5"><Button variant="danger" onClick={() => { update((x) => { x.vehicles = x.vehicles.filter((v) => v.id !== del); if (x.vehicleId === del) x.vehicleId = x.vehicles[0]?.id }); setDel(undefined); toast('Vehicle removed') }}>Remove</Button><Button variant="ghost" onClick={() => setDel(undefined)}>Keep</Button></div>}>
        <p className="text-[14px] text-ink-2">Past bookings and receipts stay in your history.</p>
      </Sheet>
    </Screen>
  )
}

export function Addresses() {
  const nav = useNavigate(); const s = useStore((x) => x)
  return (
    <Screen top={<TopBar title="Saved addresses" back="/profile" />} footer={<Button variant="ghost" icon={<Plus className="h-5 w-5" />} onClick={() => nav('/address/new?back=/profile/addresses')}>Add an address</Button>}>
      <div className="space-y-3 px-5 pb-6">
        {!s.addresses.length && <Empty icon={<MapPin className="h-9 w-9" />} title="No addresses yet" body="Add where your EV is usually parked." />}
        {s.addresses.map((a) => (
          <Card key={a.id} className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand"><MapPin className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{a.label} {s.addressId === a.id && <Badge tone="ev" className="ml-1">Default</Badge>}</p><p className="text-[12.5px] text-ink-2">{a.line} · {a.pin}</p>{a.parking && <p className="text-[12px] text-ink-3">Parking: {a.parking}</p>}
              {s.addressId !== a.id && <button onClick={() => update((x) => { x.addressId = a.id })} className="mt-1 text-[12px] font-semibold text-ev-700">Make default</button>}</div>
            <button aria-label={`Delete ${a.label}`} onClick={() => { if (confirm(`Delete ${a.label}?`)) { update((x) => { x.addresses = x.addresses.filter((y) => y.id !== a.id); if (x.addressId === a.id) x.addressId = x.addresses[0]?.id }); toast('Address deleted') } }} className="grid h-9 w-9 place-items-center rounded-xl text-ink-3 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </Card>))}
      </div>
    </Screen>
  )
}

const FAQ = [
  ['How is the price worked out?', 'Energy at ₹21/kWh plus a ₹149 visit fee, then 18% GST on the total. You pay an estimate upfront; the final bill uses the kWh our charger meter delivers, and any difference is refunded automatically.'],
  ['Which vehicles can you charge?', 'Our vans carry CCS2 (most electric cars), Type 2 AC, Bharat AC-001 (many e-autos) and light-EV connectors for scooters. CHAdeMO and GB/T are not supported yet.'],
  ['Do I need to be with my vehicle?', 'No. Share your parking spot details, and give the start OTP to the partner once the cable is connected. Your vehicle should be unlocked for charging or the charge port accessible.'],
  ['What if charging stops early?', 'You’re billed only for the energy delivered. If the stop was caused by our equipment, the visit fee is waived too.'],
  ['What’s the cancellation policy?', 'Free until a van is dispatched. ₹49 once a van is on the way. Visit fee + GST once the van has reached you.'],
  ['Is basement parking OK?', 'Sometimes. Basement or covered parking may need society permission and a quick safety check — we’ll confirm before dispatch.'],
]
export function Support() {
  const [sp] = useSearchParams()
  const [open, setOpen] = useState<number | null>(0)
  const [chat, setChat] = useState(false)
  const [msgs, setMsgs] = useState<{ me: boolean; t: string }[]>([{ me: false, t: `Hi! I’m the FuelDrop help assistant (demo).${sp.get('booking') ? ` I can see booking ${sp.get('booking')}.` : ''} How can I help?` }])
  const [txt, setTxt] = useState('')
  const send = () => { if (!txt.trim()) return; const m = txt; setTxt(''); setMsgs((x) => [...x, { me: true, t: m }]); setTimeout(() => setMsgs((x) => [...x, { me: false, t: 'Thanks — a support agent will pick this up. In the full app this connects to live chat. (Demo reply)' }]), 900) }
  return (
    <Screen top={<TopBar title="Help & support" sub={sp.get('booking') ? `About booking ${sp.get('booking')}` : undefined} />}>
      <div className="px-5 pb-6">
        <div className="grid grid-cols-3 gap-2.5">
          {[{ i: MessageCircle, t: 'Chat', a: () => setChat(true) }, { i: Phone, t: 'Call', a: () => toast('Support line: 1800-XXX-XXXX (placeholder)', 'info') }, { i: Mail, t: 'Email', a: () => toast('help@fueldrop.example (placeholder)', 'info') }].map((x) => <Card key={x.t} onClick={x.a} className="!p-3 text-center"><x.i className="mx-auto h-5 w-5 text-ev" /><p className="mt-1.5 text-[13px] font-semibold">{x.t}</p></Card>)}
        </div>
        <SectionTitle>Common questions</SectionTitle>
        <Card className="divide-y divide-line !p-0">{FAQ.map(([q, a], i) => (
          <div key={q}><button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left"><span className="flex-1 text-[14px] font-semibold">{q}</span><ChevronDown className={cx('h-4 w-4 text-ink-3 transition', open === i && 'rotate-180')} /></button>
            {open === i && <p className="px-4 pb-4 text-[13px] leading-5 text-ink-2 animate-fade">{a}</p>}</div>))}</Card>
        <p className="mt-4 text-center text-[11.5px] text-ink-3">Policies shown are demo samples for this MVP. <Link to="/home" className="font-semibold text-ev-700">Back to home</Link></p>
      </div>
      <Sheet open={chat} onClose={() => setChat(false)} title="Chat with us">
        <div className="flex h-[300px] flex-col gap-2 overflow-y-auto rounded-2xl bg-bg p-3">{msgs.map((m, i) => <div key={i} className={cx('max-w-[80%] rounded-2xl px-3 py-2 text-[13px]', m.me ? 'self-end bg-navy text-white' : 'self-start bg-white shadow-card')}>{m.t}</div>)}</div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send() }}><input aria-label="Message" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Type a message" className="h-12 flex-1 rounded-2xl bg-white px-4 text-[14px] ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-navy" /><Button size="md" block={false} variant="ev" type="submit">Send</Button></form>
      </Sheet>
    </Screen>
  )
}
