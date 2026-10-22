import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom'
import { Building2, CircleCheck, Upload, Download, FileText, Plus, Zap, CalendarClock, CreditCard, Users, TriangleAlert, Printer, Check, Moon, Car, ChevronRight, RefreshCw, Trash2, Wallet, IndianRupee, Gauge, FileSpreadsheet } from 'lucide-react'
import { Button, Card, Field, Badge, Chip, Sheet, Row, Empty, Skeleton, cx, toast, Bar, Logo } from '../../components/ui'
import { Breakdown } from '../customer/Checkout'
import { PageHead } from './FleetShell'
import { useStore, update, type FleetVehicle } from '../../lib/store'
import { seedFleet, parseCsv, importRows, SAMPLE_CSV, DEPOTS, createSchedule, type CsvRow } from '../../lib/fleet'
import { fleetPrice, FLEET } from '../../lib/pricing'
import { validateGstin, SAMPLE_GSTIN, inr, inr0, fmtDate, r2, uid, initials } from '../../lib/format'
import { EV_MODELS, SUPPORTED } from '../../lib/data'

const useBiz = () => useStore((s) => s.fleet.business)
function NeedsBiz({ children }: { children: React.ReactNode }) { const b = useBiz(); return b ? <>{children}</> : <Navigate to="/fleet/signup" replace /> }
export const withBiz = (C: () => React.ReactElement) => () => <NeedsBiz><C /></NeedsBiz>

export function FleetSignup() {
  const nav = useNavigate(); const [sp] = useSearchParams()
  const [name, setName] = useState(sp.get('gst') ? 'Swift Mobility Pvt Ltd' : '')
  const [gst, setGst] = useState(sp.get('gst') ?? '')
  const [billing, setBilling] = useState(sp.get('gst') ? 'Plot 42, Sector 18, Gurugram, Haryana 122015' : '')
  const [size, setSize] = useState('11–50')
  const [depot, setDepot] = useState(DEPOTS[0])
  const [terms, setTerms] = useState<'prepaid' | 'credit'>('credit')
  const [touched, setTouched] = useState(!!sp.get('gst'))
  const [busy, setBusy] = useState(false)
  const g = gst ? validateGstin(gst) : undefined
  const ok = name.trim() && g?.ok && billing.trim()
  const submit = () => { setTouched(true); if (!ok) return; setBusy(true); setTimeout(() => { update((s) => { s.fleet.business = undefined; s.fleet.vehicles = []; s.fleet.schedules = []; s.fleet.invoices = []; s.fleet.team = []; seedFleet(s, { name: name.trim(), gstin: gst.toUpperCase(), state: g?.ok ? g.state : '', billing, size, depots: [depot, ...DEPOTS.filter((d) => d !== depot)] }) }); toast('Business account created'); nav('/fleet') }, 900) }
  return (
    <div className="min-h-[100dvh] bg-bg lg:grid lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-ev/25 blur-3xl" />
        <Logo size={34} light />
        <Badge tone="ev" className="mt-4 w-fit !bg-ev/20 !text-ev-400">FuelDrop for Business · Early access</Badge>
        <h1 className="mt-auto text-[40px] font-extrabold leading-tight tracking-tight">Overnight depot charging<br /><span className="text-ev-400">for your EV fleet.</span></h1>
        <ul className="mt-6 space-y-3 text-[15px] text-white/75">{['Schedule a van for every vehicle at the depot', 'One consolidated GST invoice a month', 'Monthly credit, team roles and spend controls'].map((x) => <li key={x} className="flex gap-2"><CircleCheck className="h-5 w-5 flex-none text-ev-400" />{x}</li>)}</ul>
        <p className="mt-10 text-[12px] text-white/40">Sample fleet rate: ₹{FLEET.perKwh}/kWh + ₹{FLEET.sessionFee} per vehicle session + 18% GST (to be validated).</p>
      </div>
      <div className="mx-auto w-full max-w-[520px] px-5 py-8 lg:py-14">
        <Link to="/" className="text-[13px] font-semibold text-ink-2 hover:text-navy">← Back</Link>
        <div className="mt-4 rounded-2xl bg-brand-50 px-3.5 py-2.5 text-[12.5px] text-brand-600 ring-1 ring-brand-100 lg:hidden">FuelDrop for Business is in early access. We’re launching for individual EV owners first.</div>
        <h2 className="mt-5 text-[26px] font-extrabold tracking-tight">Set up your business</h2>
        <p className="mt-1 text-[14px] text-ink-2">Takes about 2 minutes. We verify your GSTIN for tax invoices.</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <Field label="Registered business name" placeholder="Swift Mobility Pvt Ltd" value={name} onChange={(e) => setName(e.target.value)} error={touched && !name.trim() ? 'Enter your business name' : undefined} />
          <div>
            <Field label="GSTIN" placeholder="06AAKCS1234F1ZM" maxLength={15} value={gst} onChange={(e) => { setGst(e.target.value.toUpperCase().replace(/\s/g, '')); setTouched(true) }}
              error={touched && gst && g && !g.ok ? g.error : touched && !gst ? 'GSTIN is needed for GST invoices' : undefined}
              hint={g?.ok ? <span className="font-semibold text-ev-700">✓ Valid format & checksum · {g.state}</span> : undefined} />
            <div className="mt-1.5 flex gap-3 text-[12px] font-semibold"><button type="button" className="text-ev-700" onClick={() => { setGst(SAMPLE_GSTIN); setTouched(true) }}>Use sample GSTIN</button>{g && !g.ok && <button type="button" className="text-ink-2" onClick={() => toast('Unregistered businesses can continue without GSTIN in the full product', 'info')}>Continue without GSTIN</button>}</div>
          </div>
          <Field label="Billing address" placeholder="Plot 42, Sector 18, Gurugram, Haryana 122015" value={billing} onChange={(e) => setBilling(e.target.value)} error={touched && !billing.trim() ? 'Enter a billing address' : undefined} />
          <div><p className="mb-1.5 text-[13px] font-semibold">Fleet size</p><div className="flex flex-wrap gap-2">{['1–10', '11–50', '51–200', '200+'].map((x) => <Chip key={x} on={size === x} onClick={() => setSize(x)}>{x} EVs</Chip>)}</div></div>
          <div><p className="mb-1.5 text-[13px] font-semibold">Main depot</p><div className="flex flex-wrap gap-2">{DEPOTS.map((x) => <Chip key={x} on={depot === x} onClick={() => setDepot(x)}>{x}</Chip>)}</div></div>
          <div><p className="mb-1.5 text-[13px] font-semibold">Payment terms</p><div className="grid grid-cols-2 gap-2">{([['prepaid', 'Prepaid', 'Pay per schedule'], ['credit', 'Monthly credit', 'Apply · manual approval']] as const).map(([k, t, d]) => <button type="button" key={k} onClick={() => setTerms(k)} className={cx('rounded-2xl p-3 text-left ring-1 ring-inset', terms === k ? 'bg-white ring-2 ring-navy' : 'bg-white ring-line')}><p className="text-[14px] font-semibold">{t}</p><p className="text-[12px] text-ink-2">{d}</p></button>)}</div></div>
          <Button type="submit" loading={busy} icon={<Building2 className="h-5 w-5" />}>Create business account</Button>
          <p className="text-[11.5px] text-ink-3">Demo: GSTIN is checked for format and checksum only, not against the GST portal.</p>
        </form>
      </div>
    </div>
  )
}

function Kpi({ icon: I, label, value, sub, tone = 'ev' }: { icon: typeof Zap; label: string; value: string; sub?: React.ReactNode; tone?: 'ev' | 'brand' | 'navy' | 'blue' }) {
  const t = { ev: 'bg-ev-100 text-ev-700', brand: 'bg-brand-100 text-brand-600', navy: 'bg-navy-100 text-navy', blue: 'bg-blue-50 text-blue-700' }[tone]
  return <Card className="animate-rise"><div className="flex items-center gap-2"><span className={cx('grid h-8 w-8 place-items-center rounded-lg', t)}><I className="h-4 w-4" /></span><p className="text-[12.5px] font-medium text-ink-2">{label}</p></div><p className="mt-3 text-[24px] font-extrabold tracking-tight tabular-nums">{value}</p>{sub && <p className="mt-0.5 text-[12px] text-ink-2">{sub}</p>}</Card>
}

const DAILY = [92, 118, 104, 131, 88, 142, 126, 97, 151, 133, 120, 146, 109, 138, 155, 124, 117, 149, 162, 134, 141, 128]
export const FleetDashboard = withBiz(function FleetDashboard() {
  const nav = useNavigate()
  const f = useStore((s) => s.fleet)
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t) }, [])
  const kwhMonth = r2(f.vehicles.reduce((a, v) => a + v.kwhMonth, 0))
  const spend = fleetPrice(kwhMonth, Math.round(kwhMonth / 28)).total
  const avail = f.credit.limit - f.credit.used
  const upcoming = f.schedules.filter((x) => x.status === 'scheduled')
  const low = [...f.vehicles].sort((a, b) => a.lastSoc - b.lastSoc).slice(0, 5)
  const max = Math.max(...DAILY)
  return (
    <>
      <PageHead title={`${new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, ${f.team[0]?.name.split(' ')[0] ?? 'there'}`} sub={`${f.business?.name} · October 2026`} action={<Button block={false} size="md" variant="ev" icon={<CalendarClock className="h-4 w-4" />} onClick={() => nav('/fleet/schedule')}>Schedule depot charging</Button>} />
      {loading ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[118px]" />)}</div> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={Car} label="Vehicles" value={String(f.vehicles.length)} sub={`${f.vehicles.filter((v) => v.lastSoc < 30).length} below 30%`} tone="navy" />
          <Kpi icon={Zap} label="kWh this month" value={kwhMonth.toLocaleString('en-IN')} sub="Month to date" />
          <Kpi icon={IndianRupee} label="Spend this month" value={inr0(spend)} sub="incl. 18% GST" tone="brand" />
          <Kpi icon={CreditCard} label="Credit available" value={inr0(avail)} sub={<Bar value={(f.credit.used / f.credit.limit) * 100} tone={avail < 30000 ? 'amber' : 'ev'} className="mt-1.5" />} tone="blue" />
        </div>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between"><p className="font-bold">Daily energy · October</p><Badge tone="grey">kWh</Badge></div>
          <div className="mt-4 flex h-40 items-end gap-1.5" role="img" aria-label="Bar chart of daily kWh in October">
            {DAILY.map((d, i) => <div key={i} className="group relative flex-1"><div className={cx('rounded-t-md transition-all', i === DAILY.length - 1 ? 'bg-ev' : 'bg-ev/25 group-hover:bg-ev/50')} style={{ height: `${(d / max) * 150}px` }} /><span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-navy px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">{d}</span></div>)}
          </div>
          <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-3"><span>1 Oct</span><span>22 Oct</span></div>
        </Card>
        <Card>
          <div className="flex items-center justify-between"><p className="font-bold">Upcoming sessions</p><Link to="/fleet/bookings" className="text-[12.5px] font-semibold text-ev-700">All</Link></div>
          {!upcoming.length ? <div className="py-6 text-center"><Moon className="mx-auto h-7 w-7 text-ink-3" /><p className="mt-2 text-[13px] text-ink-2">Nothing scheduled tonight.</p><Button className="mt-3" size="sm" block={false} variant="soft" onClick={() => nav('/fleet/schedule')}>Plan overnight charging</Button></div>
            : <div className="mt-3 space-y-2">{upcoming.slice(0, 4).map((x) => <div key={x.id} className="flex items-center gap-3 rounded-xl bg-bg p-3"><Moon className="h-4 w-4 text-[#4F46E5]" /><div className="flex-1"><p className="text-[13.5px] font-semibold">{x.date} · {x.window}</p><p className="text-[12px] text-ink-2">{x.vehicleIds.length} vehicles · {x.kwh} kWh · {x.depot.split(',')[0]}</p></div><Badge tone="blue">{x.id}</Badge></div>)}</div>}
        </Card>
      </div>
      <Card className="mt-4 !p-0">
        <div className="flex items-center justify-between px-4 pt-4"><p className="font-bold">Lowest charge</p><Link to="/fleet/vehicles" className="text-[12.5px] font-semibold text-ev-700">All vehicles</Link></div>
        {!low.length ? <Empty icon={<Car className="h-9 w-9" />} title="No vehicles yet" body="Import your fleet from a CSV to get started." action={<Button variant="ev" size="md" onClick={() => nav('/fleet/vehicles?import=1')}>Import vehicles</Button>} /> :
          <div className="mt-2 divide-y divide-line">{low.map((v) => <VehicleRow key={v.id} v={v} />)}</div>}
      </Card>
    </>
  )
})

function VehicleRow({ v, right }: { v: FleetVehicle; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg"><Car className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{v.reg}</p><p className="truncate text-[12px] text-ink-2">{v.name} · {v.connector} · {v.depot.split(',')[0]}</p></div>
      <div className="hidden w-28 sm:block"><Bar value={v.lastSoc} tone={v.lastSoc < 25 ? 'red' : v.lastSoc < 40 ? 'amber' : 'ev'} /></div>
      <p className={cx('w-10 text-right text-[13px] font-bold tabular-nums', v.lastSoc < 25 && 'text-red-600')}>{v.lastSoc}%</p>
      {right}
    </div>
  )
}

export const FleetVehicles = withBiz(function FleetVehicles() {
  const [sp] = useSearchParams()
  const f = useStore((s) => s.fleet)
  const [open, setOpen] = useState(!!sp.get('import'))
  const [rows, setRows] = useState<CsvRow[] | null>(null)
  const [single, setSingle] = useState(false)
  const [q, setQ] = useState('')
  const [reg, setReg] = useState(''); const [model, setModel] = useState(EV_MODELS[0].id)
  const file = useRef<HTMLInputElement>(null)
  const load = (text: string) => { try { setRows(parseCsv(text, f.vehicles.map((v) => v.reg))) } catch { toast('Couldn’t read that CSV', 'err') } }
  const template = () => { const blob = new Blob(['reg_no,make_model,vehicle_type,battery_kwh,connector,depot\n'], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fueldrop-vehicles-template.csv'; a.click() }
  const list = f.vehicles.filter((v) => `${v.reg} ${v.name}`.toLowerCase().includes(q.toLowerCase()))
  const good = rows?.filter((r) => !r.error).length ?? 0
  return (
    <>
      <PageHead title="Vehicles" sub={`${f.vehicles.length} EVs across ${new Set(f.vehicles.map((v) => v.depot)).size} depots`} action={<div className="flex gap-2"><Button block={false} size="md" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={() => setSingle(true)}>Add one</Button><Button block={false} size="md" variant="dark" icon={<Upload className="h-4 w-4" />} onClick={() => { setOpen(true); setRows(null) }}>Import CSV</Button></div>} />
      <input aria-label="Search vehicles" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search registration or model" className="mb-3 h-11 w-full rounded-xl bg-white px-4 text-[14px] ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-navy lg:max-w-sm" />
      <Card className="!p-0">
        <div className="hidden grid-cols-[1fr_auto] border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-3 sm:grid"><span>Vehicle</span><span className="pr-2">Last known charge</span></div>
        {!list.length ? <Empty icon={<Car className="h-9 w-9" />} title={q ? 'No matches' : 'No vehicles yet'} body={q ? 'Try another registration number.' : 'Import your fleet from a CSV.'} /> : <div className="divide-y divide-line">{list.map((v) => <VehicleRow key={v.id} v={v} right={<button aria-label={`Remove ${v.reg}`} onClick={() => { if (confirm(`Remove ${v.reg}?`)) { update((s) => { s.fleet.vehicles = s.fleet.vehicles.filter((x) => x.id !== v.id) }); toast(`${v.reg} removed`) } }} className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>} />)}</div>}
      </Card>

      <Sheet open={open} onClose={() => setOpen(false)} title="Import vehicles from CSV" footer={rows ? <div className="flex gap-2"><Button variant="ghost" size="md" onClick={() => setRows(null)}>Choose another file</Button><Button variant="ev" size="md" disabled={!good} onClick={() => { importRows(rows); setOpen(false); toast(`${good} vehicles imported`) }}>Import {good} valid row{good === 1 ? '' : 's'}</Button></div> : undefined}>
        {!rows ? <>
          <button onClick={() => file.current?.click()} className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-line bg-bg px-4 py-8 text-center transition hover:border-ev">
            <FileSpreadsheet className="h-9 w-9 text-ev" /><p className="mt-2 font-semibold">Choose a CSV file</p><p className="text-[12px] text-ink-2">Columns: reg_no, make_model, vehicle_type, battery_kwh, connector, depot</p>
          </button>
          <input ref={file} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const fl = e.target.files?.[0]; if (fl) fl.text().then(load) }} />
          <div className="mt-3 flex gap-2"><Button variant="soft" size="md" onClick={() => load(SAMPLE_CSV)}>Use sample CSV (10 rows)</Button><Button variant="ghost" size="md" icon={<Download className="h-4 w-4" />} onClick={template}>Template</Button></div>
        </> : <>
          <div className="mb-3 flex gap-2"><Badge tone="ev">{good} ready</Badge>{rows.length - good > 0 && <Badge tone="red">{rows.length - good} need fixing</Badge>}</div>
          <div className="max-h-[320px] divide-y divide-line overflow-y-auto rounded-2xl ring-1 ring-line">{rows.map((r) => (
            <div key={r.line} className={cx('flex items-start gap-3 px-3 py-2.5 text-[13px]', r.error && 'bg-red-50/60')}>
              <span className="w-12 flex-none text-[11px] font-semibold text-ink-3">Row {r.line}</span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{r.reg} <span className="font-normal text-ink-2">· {r.model}</span></p>{r.error ? <p className="text-[12px] font-medium text-red-600">{r.error}</p> : <p className="text-[12px] text-ink-2">{r.connector} · {r.kwh} kWh · {r.depot}</p>}</div>
              {r.error ? <TriangleAlert className="h-4 w-4 flex-none text-red-500" /> : <Check className="h-4 w-4 flex-none text-ev" />}
            </div>))}</div>
        </>}
      </Sheet>
      <Sheet open={single} onClose={() => setSingle(false)} title="Add a vehicle" footer={<Button variant="ev" disabled={!/^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{4}$/.test(reg)} onClick={() => { const m = EV_MODELS.find((x) => x.id === model)!; update((s) => { s.fleet.vehicles.push({ id: uid('FV'), name: `${m.make} ${m.model}`, reg, modelId: m.id, connector: m.connector, batteryKwh: m.kwh, depot: DEPOTS[0], lastSoc: 50, kwhMonth: 0 }) }); setSingle(false); setReg(''); toast(`${reg} added`) }}>Add vehicle</Button>}>
        <Field label="Registration number" placeholder="HR 26 FJ 2207" value={reg} onChange={(e) => setReg(e.target.value.toUpperCase())} />
        <p className="mb-1.5 mt-4 text-[13px] font-semibold">Model</p>
        <div className="flex flex-wrap gap-2">{EV_MODELS.filter((m) => SUPPORTED.includes(m.connector)).map((m) => <Chip key={m.id} on={model === m.id} onClick={() => setModel(m.id)}>{m.make} {m.model}</Chip>)}</div>
      </Sheet>
    </>
  )
})

export const FleetSchedule = withBiz(function FleetSchedule() {
  const nav = useNavigate(); const [sp] = useSearchParams()
  const f = useStore((s) => s.fleet)
  const [depot, setDepot] = useState(f.business?.depots[0] ?? DEPOTS[0])
  const [date, setDate] = useState('Tonight')
  const [win, setWin] = useState('10 PM – 5 AM')
  const [target, setTarget] = useState(sp.get('big') ? 100 : 80)
  const [recurring, setRecurring] = useState(false)
  const atDepot = f.vehicles.filter((v) => v.depot === depot)
  const [sel, setSel] = useState<string[]>(() => sp.get('big') ? f.vehicles.map((v) => v.id) : atDepot.filter((v) => v.lastSoc < 50).map((v) => v.id))
  const [credit, setCredit] = useState(false)
  const [done, setDone] = useState<string>()
  useEffect(() => { if (sp.get('big')) setSel(f.vehicles.map((v) => v.id)) }, [f.vehicles.length]) // eslint-disable-line
  const chosen = f.vehicles.filter((v) => sel.includes(v.id))
  const kwh = Math.round(chosen.reduce((a, v) => a + Math.max(0, ((target - v.lastSoc) / 100) * v.batteryKwh), 0) * 10) / 10
  const p = fleetPrice(kwh, chosen.length)
  const avail = r2(f.credit.limit - f.credit.used)
  const over = p.total > avail
  const visible = sp.get('big') ? f.vehicles : atDepot
  const confirm = (pay: 'credit' | 'split') => { const id = createSchedule({ depot, date: date === 'Tonight' ? 'Tonight, 22 Oct' : 'Tomorrow, 23 Oct', window: win, vehicleIds: sel, targetSoc: target, kwh, pay }); setCredit(false); setDone(id) }
  if (done) return (
    <div className="mx-auto max-w-md py-10 text-center animate-rise">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ev text-white shadow-glow animate-pop"><Check className="h-10 w-10" strokeWidth={3} /></div>
      <h1 className="mt-5 text-[24px] font-extrabold">Depot session scheduled</h1>
      <p className="mt-1 text-ink-2">#{done} · {chosen.length} vehicles · {kwh} kWh · {win}{recurring ? ' · repeats nightly' : ''}</p>
      <p className="mt-3 text-[13px] text-ink-2">Drivers get an SMS 30 minutes before the van arrives, with their bay instruction (not sent in this demo).</p>
      <div className="mt-6 flex justify-center gap-2"><Button block={false} variant="ghost" size="md" onClick={() => nav('/fleet/bookings')}>View sessions</Button><Button block={false} variant="ev" size="md" onClick={() => nav('/fleet')}>Back to dashboard</Button></div>
    </div>
  )
  return (
    <>
      <PageHead title="Schedule depot charging" sub="Overnight bulk sessions at your depot" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <p className="mb-2 text-[13px] font-semibold">Depot</p><div className="flex flex-wrap gap-2">{(f.business?.depots ?? DEPOTS).map((d) => <Chip key={d} on={depot === d} onClick={() => { setDepot(d); setSel(f.vehicles.filter((v) => v.depot === d && v.lastSoc < 50).map((v) => v.id)) }}>{d}</Chip>)}</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-2 text-[13px] font-semibold">Night</p><div className="flex gap-2">{['Tonight', 'Tomorrow'].map((d) => <Chip key={d} on={date === d} onClick={() => setDate(d)}>{d}</Chip>)}</div></div>
              <div><p className="mb-2 text-[13px] font-semibold">Window</p><div className="flex flex-wrap gap-2">{['10 PM – 5 AM', '11 PM – 6 AM'].map((d) => <Chip key={d} on={win === d} onClick={() => setWin(d)}>{d}</Chip>)}</div></div>
            </div>
            <div className="mt-4 flex items-center justify-between"><div><p className="text-[13px] font-semibold">Charge everyone to</p><p className="text-[12px] text-ink-2">Common target for all selected vehicles</p></div><div className="flex gap-1.5">{[80, 90, 100].map((n) => <Chip key={n} on={target === n} onClick={() => setTarget(n)}>{n}%</Chip>)}</div></div>
            <label className="mt-4 flex items-center gap-2 text-[13px] font-medium"><input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 accent-[#16A34A]" />Repeat every night (recurring)</label>
          </Card>
          <Card className="!p-0">
            <div className="flex items-center justify-between px-4 py-3"><p className="font-bold">Vehicles <span className="font-medium text-ink-2">· {sel.length} selected</span></p><button className="text-[12.5px] font-semibold text-ev-700" onClick={() => setSel(sel.length === visible.length ? [] : visible.map((v) => v.id))}>{sel.length === visible.length ? 'Clear' : 'Select all'}</button></div>
            {!visible.length ? <Empty icon={<Car className="h-8 w-8" />} title="No vehicles at this depot" body="Import vehicles or pick another depot." action={<Button size="md" variant="soft" onClick={() => nav('/fleet/vehicles?import=1')}>Import vehicles</Button>} /> :
              <div className="divide-y divide-line border-t border-line">{visible.map((v) => { const on = sel.includes(v.id); const k = r2(Math.max(0, ((target - v.lastSoc) / 100) * v.batteryKwh)); return (
                <label key={v.id} className={cx('flex cursor-pointer items-center gap-3 px-4 py-3 transition', on ? 'bg-ev-50/60' : 'hover:bg-bg')}>
                  <input type="checkbox" checked={on} onChange={() => setSel((x) => on ? x.filter((y) => y !== v.id) : [...x, v.id])} className="h-4 w-4 accent-[#16A34A]" />
                  <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{v.reg}</p><p className="truncate text-[12px] text-ink-2">{v.name} · {v.lastSoc}% → {target}%</p></div>
                  <p className="text-[13px] font-semibold tabular-nums">+{k.toFixed(1)} kWh</p>
                </label>) })}</div>}
          </Card>
        </div>
        <div className="space-y-3 lg:sticky lg:top-0 lg:self-start">
          <Breakdown p={p} title={`Estimate · ${chosen.length} vehicles`} />
          <Card className="!py-3"><Row k="Credit available" v={inr(avail)} /><Bar value={(f.credit.used / f.credit.limit) * 100} tone={over ? 'red' : 'ev'} className="mt-1" />{over && <p className="mt-2 text-[12px] font-medium text-red-600">This plan is {inr(p.total - avail)} over your available credit.</p>}</Card>
          <Button variant="ev" disabled={!sel.length || kwh <= 0} onClick={() => over ? setCredit(true) : confirm('credit')} icon={<Moon className="h-5 w-5" />}>Schedule on credit · {inr(p.total)}</Button>
          <p className="text-[11.5px] text-ink-3">Billed on metered kWh per vehicle. Vehicles that aren’t at the depot are marked Missed and not billed.</p>
        </div>
      </div>
      <Sheet open={credit} onClose={() => setCredit(false)} title="Credit limit reached" footer={<div className="space-y-2.5"><Button variant="ev" onClick={() => { toast(`${inr(p.total - avail)} paid via UPI (demo)`); confirm('split') }}>Pay {inr(p.total - avail)} now via UPI, rest on credit</Button><div className="flex gap-2"><Button variant="ghost" size="md" onClick={() => { setCredit(false); nav('/fleet/credit?request=1') }}>Request increase</Button><Button variant="ghost" size="md" onClick={() => setCredit(false)}>Edit selection</Button></div></div>}>
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-200"><TriangleAlert className="mt-0.5 h-5 w-5 flex-none" /><p className="text-[13.5px] leading-5">This booking ({inr(p.total)}) exceeds your available credit of {inr(avail)}. Pay {inr(p.total - avail)} now via UPI and put the rest on credit, or request a higher limit.</p></div>
        <div className="mt-3"><Row k="Credit limit" v={inr(f.credit.limit)} /><Row k="Used" v={inr(f.credit.used)} /><Row k="Available" v={inr(avail)} strong /></div>
      </Sheet>
    </>
  )
})

export const FleetBookings = withBiz(function FleetBookings() {
  const f = useStore((s) => s.fleet)
  const nav = useNavigate()
  const vname = (id: string) => f.vehicles.find((v) => v.id === id)?.reg ?? id
  return (
    <>
      <PageHead title="Depot sessions" sub="Scheduled and past bulk charging" action={<Button block={false} size="md" variant="ev" icon={<Plus className="h-4 w-4" />} onClick={() => nav('/fleet/schedule')}>New schedule</Button>} />
      {!f.schedules.length ? <Empty icon={<CalendarClock className="h-9 w-9" />} title="No sessions yet" body="Schedule your first overnight depot charge." /> :
        <div className="space-y-3">{f.schedules.map((s) => (
          <Card key={s.id} className="animate-rise">
            <div className="flex flex-wrap items-center gap-2"><p className="font-bold">#{s.id}</p><Badge tone={s.status === 'scheduled' ? 'blue' : s.status === 'partial' ? 'amber' : 'ev'}>{s.status === 'partial' ? 'Partially delivered' : s.status === 'scheduled' ? 'Scheduled' : 'Completed'}</Badge><span className="ml-auto text-[12.5px] text-ink-2">{s.date} · {s.window} · {s.depot.split(',')[0]}</span></div>
            {s.status === 'partial' ? <>
              <div role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900">{s.vehicleIds.length - (s.missed?.length ?? 0)} of {s.vehicleIds.length} vehicles charged. <b>{(s.missed ?? []).map(vname).join(', ')}</b> wasn’t at the depot. You’re billed only for {s.delivered?.toFixed(1)} kWh, and the unused credit has been restored.</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{s.vehicleIds.map((id) => { const miss = s.missed?.includes(id); return <div key={id} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 text-[13px]"><span className="font-semibold">{vname(id)}</span><Badge tone={miss ? 'red' : 'ev'}>{miss ? 'Missed · not at depot' : 'Done'}</Badge></div> })}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3"><Button block={false} size="sm" variant="dark" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => { update((st) => { const x = st.fleet.schedules.find((y) => y.id === s.id)!; x.status = 'completed' }); createSchedule({ depot: s.depot, date: 'Tonight, 22 Oct', window: s.window, vehicleIds: s.missed ?? [], targetSoc: s.targetSoc, kwh: 18, pay: 'credit' }); toast('Missed vehicle rescheduled for tonight') }}>Reschedule missed vehicle</Button><span className="text-[12.5px] text-ink-2">Billed {inr(s.price.total)} (incl. GST)</span></div>
            </> : <p className="mt-2 text-[13px] text-ink-2">{s.vehicleIds.length} vehicles · {s.kwh} kWh est. · {inr(s.price.total)} on credit · target {s.targetSoc}%</p>}
          </Card>))}</div>}
    </>
  )
})

export const FleetInvoices = withBiz(function FleetInvoices() {
  const f = useStore((s) => s.fleet)
  const csv = () => { const rows = [['invoice_no', 'period', 'sessions', 'kwh', 'energy', 'session_fees', 'gst', 'total', 'status'], ...f.invoices.map((i) => [i.no, i.period, i.sessions, i.kwh, i.energy, i.fee, i.gst, i.total, i.status])]; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })); a.download = 'fueldrop-invoices.csv'; a.click(); toast('Invoices exported as CSV') }
  return (
    <>
      <PageHead title="GST invoices" sub="One consolidated tax invoice per month" action={<Button block={false} size="md" variant="ghost" icon={<Download className="h-4 w-4" />} onClick={csv}>Export CSV (Tally/Zoho)</Button>} />
      {!f.invoices.length ? <Empty icon={<FileText className="h-9 w-9" />} title="No invoices yet" body="Your first invoice is generated at month end." /> :
        <Card className="!p-0"><div className="divide-y divide-line">{f.invoices.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand"><FileText className="h-5 w-5" /></span>
            <div className="min-w-[160px] flex-1"><p className="font-semibold">{i.period}</p><p className="text-[12px] text-ink-2">{i.no} · {i.sessions} sessions · {i.kwh.toLocaleString('en-IN')} kWh</p></div>
            <p className="font-bold tabular-nums">{inr(i.total)}</p>
            <Badge tone={i.status === 'paid' ? 'ev' : 'amber'}>{i.status === 'paid' ? 'Paid' : `Due ${fmtDate(i.issued + 86400000 * 30)}`}</Badge>
            <div className="flex gap-2">
              {i.status === 'due' && <Button block={false} size="sm" variant="dark" onClick={() => { update((s) => { const x = s.fleet.invoices.find((y) => y.id === i.id)!; x.status = 'paid'; s.fleet.credit.used = Math.max(0, r2(s.fleet.credit.used - x.total)) }); toast(`${inr(i.total)} paid · credit restored`) }}>Pay</Button>}
              <Button block={false} size="sm" variant="ghost" icon={<Printer className="h-3.5 w-3.5" />} onClick={() => window.open(`${import.meta.env.BASE_URL}#/print/invoice/${i.id}`, '_blank')}>PDF</Button>
            </div>
          </div>))}</div></Card>}
    </>
  )
})

export const FleetTeam = withBiz(function FleetTeam() {
  const team = useStore((s) => s.fleet.team)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [role, setRole] = useState<'Admin' | 'Fleet manager' | 'Driver'>('Driver')
  const ok = name.trim() && /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))
  return (
    <>
      <PageHead title="Team" sub="Who can book, approve and see invoices" action={<Button block={false} size="md" variant="ev" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Invite member</Button>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">{[['Admin', 'Everything, incl. credit & team'], ['Fleet manager', 'Book, schedule, see invoices'], ['Driver', 'See their vehicle’s sessions']].map(([r, d]) => <Card key={r} className="!p-3.5"><p className="text-[13.5px] font-bold">{r}</p><p className="text-[12px] text-ink-2">{d}</p></Card>)}</div>
      <Card className="!p-0"><div className="divide-y divide-line">{team.map((m, i) => (
        <div key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-navy text-[13px] font-bold text-white">{initials(m.name)}</span>
          <div className="min-w-[140px] flex-1"><p className="font-semibold">{m.name} {m.status === 'invited' && <Badge tone="amber" className="ml-1">Invited</Badge>}</p><p className="text-[12px] text-ink-2">{m.phone}</p></div>
          <select aria-label={`Role for ${m.name}`} disabled={i === 0} value={m.role} onChange={(e) => { update((s) => { s.fleet.team.find((x) => x.id === m.id)!.role = e.target.value as typeof role }); toast(`${m.name} is now ${e.target.value}`) }} className="h-9 rounded-lg bg-bg px-2 text-[13px] font-semibold ring-1 ring-line disabled:opacity-60">{['Admin', 'Fleet manager', 'Driver'].map((r) => <option key={r}>{r}</option>)}</select>
          {i > 0 && <button aria-label={`Remove ${m.name}`} onClick={() => { update((s) => { s.fleet.team = s.fleet.team.filter((x) => x.id !== m.id) }); toast(`${m.name} removed`) }} className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
        </div>))}</div></Card>
      <Card className="mt-4"><p className="font-bold">Spend controls</p><div className="mt-2 grid gap-2 sm:grid-cols-2 text-[13px]"><div className="rounded-xl bg-bg p-3"><p className="text-ink-2">Per-vehicle cap</p><p className="font-bold">30 kWh / day</p></div><div className="rounded-xl bg-bg p-3"><p className="text-ink-2">Owner approval above</p><p className="font-bold">₹50,000 per booking</p></div></div></Card>
      <Sheet open={open} onClose={() => setOpen(false)} title="Invite a team member" footer={<Button variant="ev" disabled={!ok} onClick={() => { update((s) => { s.fleet.team.push({ id: uid('M'), name: name.trim(), phone: '+91 ' + phone.replace(/\D/g, ''), email: '—', role, status: 'invited' }) }); setOpen(false); setName(''); setPhone(''); toast('Invite created (demo — no SMS sent)') }}>Create invite</Button>}>
        <div className="space-y-3"><Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" /><Field label="Mobile" prefix="+91" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98100 12345" />
          <div><p className="mb-1.5 text-[13px] font-semibold">Role</p><div className="flex gap-2">{(['Admin', 'Fleet manager', 'Driver'] as const).map((r) => <Chip key={r} on={role === r} onClick={() => setRole(r)}>{r}</Chip>)}</div></div></div>
      </Sheet>
    </>
  )
})

export const FleetCredit = withBiz(function FleetCredit() {
  const [sp] = useSearchParams()
  const c = useStore((s) => s.fleet.credit)
  const invoices = useStore((s) => s.fleet.invoices)
  const due = invoices.filter((i) => i.status === 'due')
  const [open, setOpen] = useState(!!sp.get('request'))
  const [amt, setAmt] = useState('300000')
  const avail = c.limit - c.used
  return (
    <>
      <PageHead title="Credit" sub="Monthly credit for depot charging" />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="!bg-navy !p-6 text-white">
          <p className="text-[13px] text-white/60">Available credit</p>
          <p className="mt-1 text-[36px] font-extrabold tracking-tight tabular-nums">{inr(avail)}</p>
          <Bar value={(c.used / c.limit) * 100} tone={avail < 30000 ? 'amber' : 'ev'} className="mt-3 !bg-white/10" />
          <div className="mt-3 flex justify-between text-[12.5px] text-white/60"><span>Used {inr(c.used)}</span><span>Limit {inr(c.limit)}</span></div>
          {c.requested && <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-[12.5px]">Increase to {inr0(c.requested)} requested · reviewed within 24 hours</p>}
          <div className="mt-5 flex gap-2"><Button block={false} size="md" variant="ev" onClick={() => setOpen(true)} icon={<Gauge className="h-4 w-4" />}>Request increase</Button></div>
        </Card>
        <Card>
          <p className="font-bold">Outstanding</p>
          {!due.length ? <p className="mt-2 text-[13px] text-ink-2">Nothing due. 🎉</p> : due.map((i) => <div key={i.id} className="mt-3 flex items-center justify-between rounded-xl bg-bg p-3"><div><p className="text-[13.5px] font-semibold">{i.period}</p><p className="text-[12px] text-ink-2">{i.no}</p></div><p className="font-bold">{inr(i.total)}</p></div>)}
          {!!due.length && <Button className="mt-3" size="md" variant="dark" icon={<Wallet className="h-4 w-4" />} onClick={() => { update((s) => { s.fleet.invoices.forEach((i) => { if (i.status === 'due') { i.status = 'paid'; s.fleet.credit.used = Math.max(0, r2(s.fleet.credit.used - i.total)) } }) }); toast('Dues paid via netbanking (demo) · credit restored') }}>Pay outstanding</Button>}
        </Card>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Request a higher limit" footer={<Button variant="ev" onClick={() => { update((s) => { s.fleet.credit.requested = +amt }); setOpen(false); toast('Request sent · we review within 24 hours') }}>Send request</Button>}>
        <Field label="New limit" prefix="₹" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ''))} hint="We may ask for PAN, incorporation documents and recent bank statements (KYC)." />
        <div className="mt-3 flex gap-2">{[300000, 500000, 1000000].map((n) => <Chip key={n} on={+amt === n} onClick={() => setAmt(String(n))}>{inr0(n)}</Chip>)}</div>
      </Sheet>
    </>
  )
})

export function FleetIndexRedirect() { return <Navigate to="/fleet" replace /> }
export const _unused = { ChevronRight, useMemo }
