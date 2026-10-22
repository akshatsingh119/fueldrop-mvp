import { update, type State, type FleetVehicle, type Schedule, type Invoice, type Booking } from './store'
import { EV_MODELS, SUPPORTED, VAN_KW, type Connector } from './data'
import { fleetPrice } from './pricing'
import { uid, r2, SAMPLE_GSTIN } from './format'

export const DEPOTS = ['Sector 18 Depot, Gurugram', 'Udyog Vihar Ph-4 Yard, Gurugram']

const fv = (reg: string, modelId: string, depot = DEPOTS[0], lastSoc = 40, kwhMonth = 0): FleetVehicle => {
  const m = EV_MODELS.find((x) => x.id === modelId)!
  return { id: uid('FV'), name: `${m.make} ${m.model}`, reg, modelId, connector: m.connector, batteryKwh: m.kwh, depot, lastSoc, kwhMonth }
}

export function seedFleet(s: State, biz?: Partial<NonNullable<State['fleet']['business']>>) {
  if (s.fleet.business && !biz) return
  s.fleet.business = { name: 'Swift Mobility Pvt Ltd', gstin: SAMPLE_GSTIN, state: 'Haryana', billing: 'Plot 42, Sector 18, Gurugram, Haryana 122015', size: '11–50', depots: DEPOTS, ...biz }
  if (!s.fleet.vehicles.length) s.fleet.vehicles = [
    fv('HR 26 FG 1188', 'nexon-ev', DEPOTS[0], 22, 312), fv('HR 26 FG 1194', 'nexon-ev', DEPOTS[0], 35, 288), fv('HR 26 FH 0412', 'xuv400', DEPOTS[0], 18, 341),
    fv('HR 55 AK 7720', 'zs-ev', DEPOTS[0], 61, 205), fv('HR 55 AK 7731', 'tiago-ev', DEPOTS[1], 28, 176), fv('DL 1R AB 2290', 'punch-ev', DEPOTS[1], 47, 154),
    fv('HR 26 EV 3301', 'treo', DEPOTS[1], 15, 92), fv('HR 26 EV 3302', 'piaggio-ape', DEPOTS[1], 33, 88),
  ]
  const t = Date.now()
  if (!s.fleet.invoices.length) s.fleet.invoices = [
    inv('FDB/HR/26-27/0091', 'August 2026', t - 86400000 * 52, 74, 2980, true),
    inv('FDB/HR/26-27/0127', 'September 2026', t - 86400000 * 21, 96, 3850, false),
  ]
  if (!s.fleet.team.length) s.fleet.team = [
    { id: uid('M'), name: s.auth.name ?? 'Akshat Singh', phone: s.auth.phone ?? '+91 98100 12345', email: 'akshat@swiftmobility.example', role: 'Admin', status: 'active' },
    { id: uid('M'), name: 'Priya Nair', phone: '+91 98XXX XX412', email: 'priya@swiftmobility.example', role: 'Fleet manager', status: 'active' },
    { id: uid('M'), name: 'Suresh M.', phone: '+91 97XXX XX908', email: '—', role: 'Driver', status: 'active' },
  ]
  s.fleet.credit = { limit: 200000, used: 181800 }
  if (!s.fleet.schedules.length) {
    const ids = s.fleet.vehicles.slice(0, 4).map((v) => v.id)
    const p = fleetPrice(54, 3)
    s.fleet.schedules = [{ id: 'FD-B-1018', createdAt: t - 86400000 * 2, depot: DEPOTS[0], date: 'Tue, 20 Oct', window: '10 PM – 5 AM', vehicleIds: ids, targetSoc: 80, kwh: 72, price: p, status: 'partial', delivered: 54, missed: [s.fleet.vehicles[5].id] }]
  }
}
function inv(no: string, period: string, issued: number, sessions: number, kwh: number, paid: boolean): Invoice {
  const p = fleetPrice(kwh, sessions)
  return { id: uid('I'), no, period, issued, sessions, kwh, energy: p.energy, fee: p.fee, gst: p.gst, total: p.total, status: paid ? 'paid' : 'due' }
}

export const ensureFleet = () => update((s) => { s.auth.loggedIn = true; s.auth.name = s.auth.name ?? 'Akshat Singh'; seedFleet(s) })

export interface CsvRow { line: number; reg: string; model: string; type: string; kwh: string; connector: string; depot: string; error?: string; modelId?: string }
export const SAMPLE_CSV = `reg_no,make_model,vehicle_type,battery_kwh,connector,depot
HR 26 FJ 2201,Tata Nexon EV (LR),car,40.5,CCS2,Sector 18 Depot
HR 26 FJ 2202,Tata Nexon EV (LR),car,40.5,CCS2,Sector 18 Depot
HR 26 FJ 2203,MG ZS EV,car,50.3,CCS2,Sector 18 Depot
HR 26 FJ 2204,Mahindra XUV400 EV,car,39.4,CCS2,Udyog Vihar Yard
HR 26 FJ 2205,Tata Tiago EV,car,24,CCS2,Udyog Vihar Yard
HR 26 EV 3310,Mahindra Treo (e-auto),3w,7.4,Bharat AC-001,Udyog Vihar Yard
HR 26 EV 3311,Piaggio Ape E-City FX,3w,8,Bharat AC-001,Udyog Vihar Yard
HR 26 FJ 2206,Nissan Leaf (imported),car,40,CHAdeMO,Sector 18 Depot
HR 26 FJ 2201,Tata Nexon EV (LR),car,40.5,CCS2,Sector 18 Depot
HR 26 FJ 22,Tata Punch EV,car,35,CCS2,Sector 18 Depot`

export function parseCsv(text: string, existing: string[]): CsvRow[] {
  const lines = text.trim().split(/\r?\n/)
  const head = lines[0].toLowerCase().split(',').map((x) => x.trim())
  const idx = (k: string) => head.indexOf(k)
  const seen = new Set(existing.map((r) => r.replace(/\s/g, '')))
  return lines.slice(1).filter(Boolean).map((l, i) => {
    const c = l.split(',').map((x) => x.trim())
    const row: CsvRow = { line: i + 2, reg: c[idx('reg_no')] ?? '', model: c[idx('make_model')] ?? '', type: c[idx('vehicle_type')] ?? '', kwh: c[idx('battery_kwh')] ?? '', connector: c[idx('connector')] ?? '', depot: c[idx('depot')] ?? '' }
    const m = EV_MODELS.find((x) => `${x.make} ${x.model}`.toLowerCase() === row.model.toLowerCase() || row.model.toLowerCase().includes(x.model.toLowerCase().split(' (')[0]))
    row.modelId = m?.id
    const key = row.reg.replace(/\s/g, '').toUpperCase()
    if (!/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/.test(key)) row.error = 'Registration number looks invalid'
    else if (seen.has(key)) row.error = 'Duplicate registration number'
    else if (!SUPPORTED.includes(row.connector as Connector)) row.error = `Connector ${row.connector || '(blank)'} not supported by our vans`
    else if (!(+row.kwh > 0)) row.error = 'battery_kwh must be a number'
    else if (!m) row.error = 'Unknown make/model — will need manual review'
    seen.add(key)
    return row
  })
}
export function importRows(rows: CsvRow[]) {
  update((s) => {
    for (const r of rows.filter((x) => !x.error)) {
      const m = EV_MODELS.find((x) => x.id === r.modelId)!
      s.fleet.vehicles.push({ id: uid('FV'), name: `${m.make} ${m.model}`, reg: r.reg.toUpperCase(), modelId: m.id, connector: r.connector as Connector, batteryKwh: +r.kwh, depot: r.depot.includes('Udyog') ? DEPOTS[1] : DEPOTS[0], lastSoc: 30 + ((r.line * 13) % 40), kwhMonth: 0 })
    }
  })
}

export function createSchedule(opts: { depot: string; date: string; window: string; vehicleIds: string[]; targetSoc: number; kwh: number; pay: 'credit' | 'split' }) {
  let id = ''
  update((s) => {
    const p = fleetPrice(opts.kwh, opts.vehicleIds.length)
    id = 'FD-B-' + (1022 + s.fleet.schedules.length)
    const sc: Schedule = { id, createdAt: Date.now(), depot: opts.depot, date: opts.date, window: opts.window, vehicleIds: opts.vehicleIds, targetSoc: opts.targetSoc, kwh: opts.kwh, price: p, status: 'scheduled' }
    s.fleet.schedules.unshift(sc)
    const avail = s.fleet.credit.limit - s.fleet.credit.used
    s.fleet.credit.used = r2(s.fleet.credit.used + Math.min(p.total, opts.pay === 'split' ? avail : p.total))
    const first = s.fleet.vehicles.find((v) => v.id === opts.vehicleIds[0])!
    const m = EV_MODELS.find((x) => x.id === first.modelId)!
    const b: Booking = {
      id, source: 'fleet', customer: s.fleet.business?.name ?? 'Fleet', phone: '+91 98XXX XX412',
      vehicle: { id: first.id, modelId: m.id, name: `${opts.vehicleIds.length} vehicles · depot`, reg: first.reg + (opts.vehicleIds.length > 1 ? ` +${opts.vehicleIds.length - 1}` : ''), connector: first.connector, batteryKwh: first.batteryKwh, type: m.type, colour: m.colour },
      address: { id: uid('A'), label: 'Depot', line: opts.depot, pin: '122015', zoneId: 'ncr-ggn' },
      currentSoc: 30, targetSoc: opts.targetSoc, estKwh: r2(opts.kwh), powerKw: VAN_KW[first.connector], slot: { kind: 'scheduled', day: opts.date, label: opts.window, night: true },
      price: p, payMethod: 'credit', status: 'scheduled', createdAt: Date.now(), travelMs: 45000, delayMs: 0, pausedMs: 0, auto: false, flags: {}, timeline: [{ t: Date.now(), label: 'Depot session scheduled on credit' }],
    }
    s.bookings.unshift(b)
  })
  return id
}
