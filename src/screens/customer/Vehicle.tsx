import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plug, Battery, TriangleAlert, CircleCheck, Bell, ChevronDown } from 'lucide-react'
import { Button, Screen, TopBar, Field, Card, Chip, toast, cx, VehicleGlyph, Badge } from '../../components/ui'
import { EV_MODELS, SUPPORTED, VAN_KW, type Connector, type VType } from '../../lib/data'
import { actions, update, useStore } from '../../lib/store'

const REG = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4}$/
const ALL_CONN: Connector[] = ['CCS2', 'Type 2', 'Bharat AC-001', 'LEV', 'CHAdeMO', 'GB/T']

export function VehicleAdd() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const hasAddress = useStore((s) => s.addresses.length > 0)
  const [type, setType] = useState<VType>(() => (EV_MODELS.find((m) => m.id === sp.get('model'))?.type ?? 'car'))
  const [q, setQ] = useState('')
  const [modelId, setModelId] = useState<string | undefined>(sp.get('model') ?? undefined)
  const m = EV_MODELS.find((x) => x.id === modelId)
  const [conn, setConn] = useState<Connector | undefined>(m?.connector)
  const [reg, setReg] = useState('')
  const [err, setErr] = useState('')
  const [connOpen, setConnOpen] = useState(false)
  const list = useMemo(() => EV_MODELS.filter((x) => x.type === type && `${x.make} ${x.model}`.toLowerCase().includes(q.toLowerCase())), [type, q])
  const pick = (id: string) => { setModelId(id); setConn(EV_MODELS.find((x) => x.id === id)!.connector) }
  const connector = conn ?? m?.connector
  const ok = connector ? SUPPORTED.includes(connector) : true
  const save = () => {
    const r = reg.trim().toUpperCase()
    if (!REG.test(r)) { setErr('Use the format KA 01 AB 1234'); return }
    actions.addVehicle(m!.id, r.replace(/\s+/g, ' '), connector)
    update((s) => { s.auth.onboarded = true })
    toast(`${m!.make} ${m!.model} added`)
    nav(hasAddress ? (sp.get('back') ?? '/home') : '/address/new')
  }

  if (!m) return (
    <Screen top={<TopBar title="Add your EV" sub="Step 2 of 2" />}>
      <div className="px-5 pb-8 animate-rise">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 shadow-card">
          {([['car', 'Car'], ['2w', 'Scooter / bike'], ['3w', 'E-auto']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setType(k)} className={cx('rounded-xl py-2.5 text-[13px] font-semibold transition', type === k ? 'bg-navy text-white shadow' : 'text-ink-2 hover:text-navy')}>{l}</button>
          ))}
        </div>
        <div className="mt-4 flex h-12 items-center gap-2 rounded-2xl bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-navy">
          <Search className="h-4 w-4 text-ink-3" /><input aria-label="Search make or model" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search make or model" className="h-full flex-1 bg-transparent text-[15px] focus:outline-none" />
        </div>
        <div className="mt-4 space-y-2.5">
          {list.map((x, i) => (
            <Card key={x.id} onClick={() => pick(x.id)} className="flex items-center gap-3 animate-rise" >
              <VehicleGlyph type={x.type} colour={x.colour} />
              <div className="min-w-0 flex-1"><p className="font-semibold">{x.make} {x.model}</p><p className="text-[12.5px] text-ink-2">{x.kwh} kWh · {x.connector}</p></div>
              {!SUPPORTED.includes(x.connector) ? <Badge tone="amber">Not supported</Badge> : <Badge tone="grey">{x.connector}</Badge>}
              <span className="sr-only">{i}</span>
            </Card>
          ))}
          {!list.length && <p className="py-10 text-center text-sm text-ink-2">No match for “{q}”. Try another name, or contact support to add your model.</p>}
        </div>
      </div>
    </Screen>
  )

  return (
    <Screen top={<TopBar title={`${m.make} ${m.model}`} sub="Check the details" onBack={() => setModelId(undefined)} />}
      footer={ok ? <Button variant="ev" onClick={save} disabled={!reg}>Save vehicle</Button> : <div className="space-y-2.5"><Button variant="dark" icon={<Bell className="h-5 w-5" />} onClick={() => toast(`We’ll let you know when vans carry ${connector}`, 'info')}>Notify me when {connector} is supported</Button><Button variant="ghost" onClick={() => setModelId(undefined)}>Pick another vehicle</Button></div>}>
      <div className="space-y-4 px-5 pb-8 animate-rise">
        <Card className="flex items-center gap-4 bg-gradient-to-br from-white to-ev-50">
          <VehicleGlyph type={m.type} colour={m.colour} className="h-16 w-16" />
          <div><p className="text-[17px] font-bold">{m.make} {m.model}</p><p className="text-[13px] text-ink-2">{m.type === 'car' ? 'Car' : m.type === '2w' ? 'Two-wheeler' : 'Three-wheeler'} · specs approximate</p></div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Card><Plug className="h-5 w-5 text-ev" /><p className="mt-2 text-[12px] text-ink-2">Connector <span className="text-ink-3">(auto-filled)</span></p>
            <button onClick={() => setConnOpen((x) => !x)} className="mt-0.5 flex items-center gap-1 text-[16px] font-bold">{connector}<ChevronDown className="h-4 w-4 text-ink-3" /></button></Card>
          <Card><Battery className="h-5 w-5 text-ev" /><p className="mt-2 text-[12px] text-ink-2">Battery</p><p className="mt-0.5 text-[16px] font-bold">{m.kwh} kWh</p></Card>
        </div>
        {connOpen && <div className="flex flex-wrap gap-2 animate-fade">{ALL_CONN.map((c) => <Chip key={c} on={c === connector} onClick={() => { setConn(c); setConnOpen(false) }}>{c}</Chip>)}</div>}
        {ok ? (
          <div className="flex items-start gap-2.5 rounded-2xl bg-ev-50 p-3.5 text-[13px] text-ev-700 ring-1 ring-ev-100"><CircleCheck className="mt-0.5 h-4 w-4 flex-none" /><span><b>Compatible.</b> Our vans charge {connector} at up to {Math.min(VAN_KW[connector!], m.maxKw || VAN_KW[connector!])} kW{connector === 'CCS2' ? ' (DC)' : ' (AC)'}.</span></div>
        ) : (
          <div role="alert" className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="flex items-center gap-2 font-semibold text-amber-900"><TriangleAlert className="h-4 w-4" /> {connector} isn’t supported yet</p>
            <p className="mt-1.5 text-[13px] leading-5 text-amber-900/80">Our vans carry <b>{SUPPORTED.join(', ')}</b> connectors. We can’t charge this vehicle safely without the right plug, so booking is turned off for it.</p>
          </div>
        )}
        {ok && <Field label="Registration number" placeholder="KA 01 AB 1234" value={reg} onChange={(e) => { setReg(e.target.value.toUpperCase()); setErr('') }} error={err} hint="Helps the partner find the right vehicle" />}
      </div>
    </Screen>
  )
}
