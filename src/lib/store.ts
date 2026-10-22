import { useSyncExternalStore, useEffect, useState } from 'react'
import { EV_MODELS, PARTNERS, SAMPLE_ADDRESSES, VAN_KW, zoneForPin, type Connector, type VType } from './data'
import { priceFor, type Price } from './pricing'
import { r2, uid, SAMPLE_GSTIN } from './format'

export interface Vehicle { id: string; modelId: string; name: string; reg: string; connector: Connector; batteryKwh: number; type: VType; colour: string }
export interface Address { id: string; label: string; line: string; pin: string; zoneId?: string; parking?: string }
export type Status = 'awaiting_payment' | 'scheduled' | 'searching' | 'unassigned' | 'en_route' | 'arrived' | 'connecting' | 'charging' | 'paused' | 'completed' | 'interrupted' | 'failed_handshake' | 'cancelled'
export type PayMethod = 'upi' | 'card' | 'wallet' | 'credit'
export interface Refund { amount: number; to: string; reason: string }
export interface Booking {
  id: string; source: 'me' | 'seed' | 'fleet'; customer: string; phone: string
  vehicle: Vehicle; address: Address
  currentSoc: number; targetSoc: number; estKwh: number; powerKw: number
  slot: { kind: 'now' } | { kind: 'scheduled'; day: string; label: string; night: boolean }
  price: Price; payMethod: PayMethod; status: Status
  createdAt: number; searchAt?: number; dispatchedAt?: number; travelMs: number; delayMs: number; arrivedAt?: number
  connectAt?: number; chargeStartAt?: number; pausedAt?: number; pausedMs: number; endedAt?: number
  deliveredKwh?: number; finalPrice?: Price; refund?: Refund
  vanId?: string; partnerId?: string; auto: boolean
  flags: { noPartner?: boolean; handshakeFail?: boolean; interruptAt?: number }
  rating?: number; feedback?: string; tips?: string[]; delayed?: boolean; otp?: string; supersededBy?: string
  timeline: { t: number; label: string }[]
}
export interface Van { id: string; reg: string; partnerId: string; battery: number; zoneId: string; capacityKwh: number }
export interface Txn { id: string; t: number; label: string; amount: number }
export interface FleetVehicle { id: string; name: string; reg: string; modelId: string; connector: Connector; batteryKwh: number; depot: string; lastSoc: number; kwhMonth: number }
export interface Schedule { id: string; createdAt: number; depot: string; date: string; window: string; vehicleIds: string[]; targetSoc: number; kwh: number; price: Price; status: 'scheduled' | 'completed' | 'partial'; delivered?: number; missed?: string[] }
export interface Invoice { id: string; no: string; period: string; issued: number; sessions: number; kwh: number; energy: number; fee: number; gst: number; total: number; status: 'paid' | 'due' }
export interface Member { id: string; name: string; phone: string; email: string; role: 'Admin' | 'Fleet manager' | 'Driver'; status: 'active' | 'invited' }
export interface Fleet {
  business?: { name: string; gstin: string; state: string; billing: string; size: string; depots: string[] }
  vehicles: FleetVehicle[]; schedules: Schedule[]; invoices: Invoice[]; team: Member[]
  credit: { limit: number; used: number; requested?: number }
}
export interface Demo { offline: boolean; noSlots: boolean; payFail: boolean; noPartner: boolean; handshakeFail: boolean; locationDenied: boolean; otpExpired: boolean }
export interface State {
  v: number
  auth: { phone?: string; name?: string; loggedIn: boolean; onboarded: boolean }
  locationGranted?: boolean
  vehicles: Vehicle[]; addresses: Address[]; vehicleId?: string; addressId?: string
  bookings: Booking[]; vans: Van[]; wallet: { balance: number; txns: Txn[] }
  fleet: Fleet; demo: Demo; waitlist: { pin: string; phone: string; t: number }[]
  draft: Draft; soc: Record<string, number>
}
export interface Draft { vehicleId?: string; addressId?: string; currentSoc: number; targetSoc: number; slot: Booking['slot']; coupon?: string; payMethod: PayMethod }

const KEY = 'fueldrop.state.v4'
const now = () => Date.now()

const seedVans = (): Van[] => [
  { id: 'VAN-01', reg: 'KA 05 EV 1187', partnerId: 'p1', battery: 82, zoneId: 'blr-hsr', capacityKwh: 120 },
  { id: 'VAN-02', reg: 'KA 03 EV 2240', partnerId: 'p2', battery: 64, zoneId: 'blr-kor', capacityKwh: 120 },
  { id: 'VAN-03', reg: 'KA 53 EV 0921', partnerId: 'p3', battery: 27, zoneId: 'blr-wf', capacityKwh: 120 },
  { id: 'VAN-04', reg: 'UP 16 EV 4410', partnerId: 'p4', battery: 91, zoneId: 'ncr-noida', capacityKwh: 120 },
  { id: 'VAN-05', reg: 'HR 26 EV 7302', partnerId: 'p5', battery: 46, zoneId: 'ncr-ggn', capacityKwh: 120 },
]

const mkVehicle = (modelId: string, reg: string): Vehicle => {
  const m = EV_MODELS.find((x) => x.id === modelId)!
  return { id: uid('V'), modelId, name: `${m.make} ${m.model}`, reg, connector: m.connector, batteryKwh: m.kwh, type: m.type, colour: m.colour }
}

const seedBookings = (): Booking[] => {
  const t = now()
  let n = 3980
  const mk = (name: string, phone: string, modelId: string, reg: string, line: string, pin: string, from: number, to: number, status: Status, minsAgo: number, vanId?: string): Booking => {
    const v = mkVehicle(modelId, reg); const k = Math.round(((to - from) / 100) * v.batteryKwh * 10) / 10
    const zone = zoneForPin(pin)
    return {
      id: 'FD0' + (n += 7), source: 'seed', customer: name, phone, vehicle: v, address: { id: uid('A'), label: 'Home', line, pin, zoneId: zone?.id },
      currentSoc: from, targetSoc: to, estKwh: k, powerKw: VAN_KW[v.connector], slot: { kind: 'now' }, price: priceFor(k), payMethod: 'upi', status,
      createdAt: t - minsAgo * 60000, travelMs: 45000, delayMs: 0, pausedMs: 0, vanId, partnerId: vanId ? seedVans().find((x) => x.id === vanId)?.partnerId : undefined,
      auto: status === 'charging' || status === 'en_route', flags: {}, timeline: [{ t: t - minsAgo * 60000, label: 'Booked & paid' }],
      deliveredKwh: status === 'completed' ? k : undefined, finalPrice: status === 'completed' ? priceFor(k) : undefined,
      dispatchedAt: vanId ? (status === 'en_route' ? t - 15000 : t - (minsAgo - 3) * 60000) : undefined, chargeStartAt: status === 'charging' ? t - 12000 : undefined,
    }
  }
  return [
    mk('Neha Sharma', '+91 98XXX XX310', 'nexon-ev', 'KA 01 MX 4521', 'Tower 3, Brigade Metropolis, Whitefield', '560048', 18, 80, 'charging', 34, 'VAN-03'),
    mk('Rahul Verma', '+91 99XXX XX872', 'ather-450x', 'KA 51 HK 0981', '27th Main, Sector 1, HSR Layout', '560102', 9, 90, 'en_route', 12, 'VAN-01'),
    mk('Ananya Iyer', '+91 97XXX XX455', 'zs-ev', 'KA 03 NB 7311', '80 Feet Rd, Koramangala 4th Block', '560034', 22, 85, 'searching', 3),
    mk('Karan Mehta', '+91 96XXX XX190', 'xuv400', 'UP 16 DK 2290', 'ATS One Hamlet, Sector 104, Noida', '201301', 30, 90, 'unassigned', 6),
    mk('Priya Nair', '+91 95XXX XX604', 'treo', 'KA 05 AB 9087', 'Domlur Layout, Indiranagar', '560038', 12, 100, 'completed', 95, 'VAN-02'),
    mk('Arjun Malhotra', '+91 98XXX XX733', 'creta-ev', 'HR 26 FG 1188', 'DLF Phase 2, Cyber City, Gurugram', '122002', 35, 80, 'completed', 160, 'VAN-05'),
  ]
}

export const initialState = (): State => ({
  v: 4,
  auth: { loggedIn: false, onboarded: false },
  vehicles: [], addresses: [], bookings: seedBookings(), vans: seedVans(),
  wallet: { balance: 500, txns: [{ id: uid('T'), t: now() - 86400000 * 3, label: 'Welcome credit (demo)', amount: 500 }] },
  fleet: { vehicles: [], schedules: [], invoices: [], team: [], credit: { limit: 200000, used: 0 } },
  demo: { offline: false, noSlots: false, payFail: false, noPartner: false, handshakeFail: false, locationDenied: false, otpExpired: false },
  waitlist: [],
  draft: { currentSoc: 32, targetSoc: 80, slot: { kind: 'now' }, payMethod: 'upi' }, soc: {},
})

let state: State = load()
const listeners = new Set<() => void>()

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const s = JSON.parse(raw) as State; if (s.v === 4) return s }
  } catch { /* ignore */ }
  const s = initialState(); try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}
const emit = () => listeners.forEach((l) => l())

/** Read-modify-write on the latest persisted copy, so the admin and customer tabs stay in sync. */
export function update(fn: (s: State) => void) {
  const fresh = load()
  const next = structuredClone(fresh)
  fn(next)
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  emit()
}
export const getState = () => state
export function resetAll() { localStorage.removeItem(KEY); state = load(); emit() }

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === KEY) { state = load(); emit() } })
}
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state))
}
export function useNow(ms = 1000) {
  const [t, setT] = useState(now())
  useEffect(() => { const i = setInterval(() => setT(now()), ms); return () => clearInterval(i) }, [ms])
  return t
}

// ---------- domain helpers ----------
export const partnerOf = (b: Booking) => PARTNERS.find((p) => p.id === b.partnerId)
export const vanOf = (s: State, b: Booking) => s.vans.find((v) => v.id === b.vanId)
export const ACTIVE: Status[] = ['awaiting_payment', 'scheduled', 'searching', 'unassigned', 'en_route', 'arrived', 'connecting', 'charging', 'paused']
export const isActive = (b: Booking) => ACTIVE.includes(b.status)
export const DEMO_CHARGE_MS = 40000 // a full session plays out in 40 s

export const sessionProgress = (b: Booking, t = now()) => {
  if (b.deliveredKwh != null && !['charging', 'paused'].includes(b.status)) return b.estKwh ? b.deliveredKwh / b.estKwh : 1
  if (!b.chargeStartAt) return 0
  const end = b.status === 'paused' && b.pausedAt ? b.pausedAt : t
  return Math.min(1, Math.max(0, (end - b.chargeStartAt - b.pausedMs) / DEMO_CHARGE_MS))
}
export const travelProgress = (b: Booking, t = now()) => {
  if (!b.dispatchedAt) return 0
  if (['arrived', 'connecting', 'charging', 'paused', 'completed', 'interrupted', 'failed_handshake'].includes(b.status)) return 1
  return Math.min(1, Math.max(0, (t - b.dispatchedAt) / (b.travelMs + b.delayMs)))
}
/** Displayed ETA in "real" minutes (demo compresses travel). */
export const etaMin = (b: Booking, t = now()) => {
  const total = 14 + Math.round((b.delayMs / 15000) * 10) // +15 s demo delay = +10 min shown
  return Math.max(1, Math.ceil(total * (1 - travelProgress(b, t))))
}

const log = (b: Booking, label: string, t = now()) => b.timeline.push({ t, label })

function finalize(s: State, b: Booking, delivered: number, status: 'completed' | 'interrupted', t: number) {
  delivered = Math.round(delivered * 10) / 10
  b.deliveredKwh = delivered
  // E3/E23: a FuelDrop-side interruption waives the visit fee.
  b.finalPrice = status === 'interrupted' ? priceFor(delivered, undefined, { fee: 0 }) : priceFor(delivered, b.price.coupon)
  b.status = status; b.endedAt = t
  const diff = r2(b.price.total - b.finalPrice.total)
  if (diff > 0.009) {
    const to = b.payMethod === 'wallet' ? 'FuelDrop wallet' : b.payMethod === 'credit' ? 'Fleet credit' : b.payMethod === 'upi' ? 'original UPI account' : 'original card'
    b.refund = { amount: diff, to, reason: status === 'interrupted' ? `Charger stopped safely at ${r2(delivered)} kWh — undelivered energy refunded and visit fee waived` : delivered < b.estKwh - 0.05 ? `Stopped at ${r2(delivered)} kWh — unused part of your estimate refunded` : 'Billed on metered kWh — the unused part of your estimate is refunded' }
    if (b.source === 'me' && b.payMethod === 'wallet') { s.wallet.balance = r2(s.wallet.balance + diff); s.wallet.txns.unshift({ id: uid('T'), t, label: `Refund · ${b.id}`, amount: diff }) }
  }
  log(b, status === 'completed' ? `Charging complete · ${r2(delivered)} kWh` : `Session interrupted · ${r2(delivered)} kWh delivered`, t)
  const van = s.vans.find((v) => v.id === b.vanId)
  if (van) van.battery = Math.max(5, Math.round(van.battery - (delivered / van.capacityKwh) * 100))
}

export function assignVan(s: State, b: Booking, vanId?: string, t = now()) {
  const busy = new Set(s.bookings.filter((x) => isActive(x) && x.vanId && x.id !== b.id).map((x) => x.vanId))
  const van = vanId ? s.vans.find((v) => v.id === vanId) : (s.vans.find((v) => v.zoneId === b.address.zoneId && !busy.has(v.id) && v.battery > 30) ?? s.vans.find((v) => !busy.has(v.id) && v.battery > 30 && v.zoneId.slice(0, 3) === (b.address.zoneId ?? '').slice(0, 3)))
  if (!van) return false
  b.vanId = van.id; b.partnerId = van.partnerId; b.status = 'en_route'; b.dispatchedAt = t; b.delayMs = 0
  const p = PARTNERS.find((x) => x.id === van.partnerId)
  log(b, `${p?.name ?? 'Partner'} assigned · van ${van.reg}`, t)
  return true
}

/** Deterministic, time-based state machine. Safe to run from several tabs. */
export function tick() {
  const t = now()
  const s = state
  const due = s.bookings.some((b) => b.auto && ['awaiting_payment', 'searching', 'en_route', 'arrived', 'connecting', 'charging'].includes(b.status))
  if (!due) return
  let changed = false
  const probe = structuredClone(s)
  for (const b of probe.bookings) {
    if (!b.auto) continue
    if (b.status === 'awaiting_payment' && t - b.createdAt > 300000) { b.status = 'cancelled'; b.endedAt = t; log(b, 'UPI request expired · nothing charged', t); changed = true }
    else if (b.status === 'searching' && b.searchAt && t - b.searchAt > 3500) {
      if (b.flags.noPartner) { b.status = 'unassigned'; log(b, 'No partner available nearby', t) } else if (!assignVan(probe, b, undefined, t)) { b.status = 'unassigned'; log(b, 'No partner available nearby', t) }
      changed = true
    } else if (b.status === 'en_route' && b.dispatchedAt && t >= b.dispatchedAt + b.travelMs + b.delayMs) {
      b.status = 'arrived'; b.arrivedAt = t; log(b, 'Partner arrived at your parking spot', t); changed = true
    } else if (b.status === 'arrived' && b.arrivedAt && t - b.arrivedAt > 5000) {
      b.status = 'connecting'; b.connectAt = t; log(b, 'Connector plugged in · handshaking', t); changed = true
    } else if (b.status === 'connecting' && b.connectAt && t - b.connectAt > 3500) {
      if (b.flags.handshakeFail) {
        b.status = 'failed_handshake'; b.endedAt = t; b.deliveredKwh = 0
        b.refund = { amount: b.price.total, to: b.payMethod === 'wallet' ? 'FuelDrop wallet' : 'original payment method', reason: 'Vehicle did not accept charge — full refund, no visit fee' }
        if (b.source === 'me' && b.payMethod === 'wallet') { probe.wallet.balance = r2(probe.wallet.balance + b.price.total); probe.wallet.txns.unshift({ id: uid('T'), t, label: `Refund · ${b.id}`, amount: b.price.total }) }
        log(b, 'Vehicle did not accept charge', t)
      } else { b.status = 'charging'; b.chargeStartAt = t; b.pausedMs = 0; log(b, 'Charging started', t) }
      changed = true
    } else if (b.status === 'charging') {
      const p = sessionProgress(b, t)
      if (b.flags.interruptAt != null && p >= b.flags.interruptAt) { finalize(probe, b, b.estKwh * b.flags.interruptAt, 'interrupted', t); changed = true }
      else if (p >= 1) { finalize(probe, b, b.estKwh, 'completed', t); changed = true }
    }
  }
  if (changed) {
    update((x) => {
      // re-apply on the freshest copy by id (cheap merge)
      for (const nb of probe.bookings) { const i = x.bookings.findIndex((y) => y.id === nb.id); if (i >= 0 && JSON.stringify(x.bookings[i].status) === JSON.stringify(s.bookings.find((z) => z.id === nb.id)?.status)) x.bookings[i] = nb }
      x.vans = probe.vans; x.wallet = probe.wallet
    })
  }
}

// ---------- actions ----------
export const actions = {
  login(phone: string) { update((s) => { s.auth.phone = phone; s.auth.loggedIn = true; s.auth.name = s.auth.name ?? 'Akshat Singh' }) },
  logout() { update((s) => { s.auth.loggedIn = false }) },
  addVehicle(modelId: string, reg: string, connector?: Connector) {
    let id = ''
    update((s) => { const v = mkVehicle(modelId, reg.toUpperCase()); if (connector) v.connector = connector; id = v.id; s.vehicles.push(v); s.vehicleId = v.id })
    return id
  },
  addAddress(a: Omit<Address, 'id' | 'zoneId'>) {
    let id = ''
    update((s) => { const z = zoneForPin(a.pin); const ad = { ...a, id: uid('A'), zoneId: z?.id }; id = ad.id; s.addresses.push(ad); s.addressId = ad.id })
    return id
  },
  seedMe() {
    update((s) => {
      if (!s.addresses.length) { const a = SAMPLE_ADDRESSES[0]; const z = zoneForPin(a.pin); const ad = { ...a, id: uid('A'), zoneId: z?.id, parking: 'Basement B2, slot 114' }; s.addresses.push(ad); s.addressId = ad.id }
      if (!s.vehicles.length) { const v = mkVehicle('nexon-ev', 'KA 01 MX 4521'); s.vehicles.push(v); s.vehicleId = v.id }
      s.auth.onboarded = true
    })
  },
}
export { SAMPLE_GSTIN }

export const draftVehicle = (s: State) => s.vehicles.find((v) => v.id === (s.draft.vehicleId ?? s.vehicleId)) ?? s.vehicles[0]
export const draftAddress = (s: State) => s.addresses.find((a) => a.id === (s.draft.addressId ?? s.addressId)) ?? s.addresses[0]
export const draftKwh = (s: State) => { const v = draftVehicle(s); return v ? Math.max(0, Math.round(((s.draft.targetSoc - s.draft.currentSoc) / 100) * v.batteryKwh * 10) / 10) : 0 }

/** Build a booking from the current draft (does not save it). */
export function makeBooking(s: State, status: Status, extra: Partial<Booking> = {}): Booking {
  const v = draftVehicle(s)!; const a = draftAddress(s)!; const k = draftKwh(s); const t = now()
  return {
    id: 'FD' + String(4000 + s.bookings.length * 7 + Math.floor(Math.random() * 6)).padStart(5, '0'), source: 'me', customer: s.auth.name ?? 'Akshat Singh', phone: s.auth.phone ?? '+91 98100 00000',
    vehicle: v, address: a, currentSoc: s.draft.currentSoc, targetSoc: s.draft.targetSoc, estKwh: k, powerKw: VAN_KW[v.connector],
    slot: s.draft.slot, price: priceFor(k, s.draft.coupon), payMethod: s.draft.payMethod, status, createdAt: t,
    travelMs: 45000, delayMs: 0, pausedMs: 0, auto: true, otp: String(1000 + Math.floor(Math.random() * 9000)), flags: { noPartner: s.demo.noPartner, handshakeFail: s.demo.handshakeFail },
    timeline: [{ t, label: status === 'awaiting_payment' ? 'Booking created · awaiting payment' : 'Booked & paid' }], ...extra,
  }
}
/** Mark a booking paid and start the right next step. */
export function confirmPaid(s: State, b: Booking, t = now()) {
  b.timeline.push({ t, label: `Payment received · ${b.payMethod.toUpperCase()}` })
  if (b.payMethod === 'wallet' && b.source === 'me') { s.wallet.balance = r2(s.wallet.balance - b.price.total); s.wallet.txns.unshift({ id: uid('T'), t, label: `Charge booking · ${b.id}`, amount: -b.price.total }) }
  if (b.slot.kind === 'scheduled') { b.status = 'scheduled'; b.timeline.push({ t, label: `Scheduled · ${b.slot.day}, ${b.slot.label}` }) }
  else { b.status = 'searching'; b.searchAt = t }
  s.demo.noPartner = false; s.demo.handshakeFail = false
}
export function refundTo(s: State, b: Booking, amount: number, reason: string) {
  const to = b.payMethod === 'wallet' ? 'FuelDrop wallet' : b.payMethod === 'credit' ? 'Fleet credit' : b.payMethod === 'upi' ? 'original UPI account' : 'original card'
  b.refund = { amount: r2(amount), to, reason }
  if (b.source === 'me' && b.payMethod === 'wallet' && amount > 0) { s.wallet.balance = r2(s.wallet.balance + amount); s.wallet.txns.unshift({ id: uid('T'), t: now(), label: `Refund · ${b.id}`, amount: r2(amount) }) }
}
/** Cancellation policy (demo): free before dispatch; ₹49 after dispatch; visit fee + GST once the van has arrived. */
export function cancelCharge(b: Booking) {
  if (['awaiting_payment', 'scheduled', 'searching', 'unassigned'].includes(b.status)) return { fee: 0, label: 'Free cancellation — before a van is dispatched' }
  if (b.status === 'en_route') return { fee: 49, label: '₹49 — a van is already on the way' }
  return { fee: r2(b.price.feeAfter * 1.18), label: 'Visit fee + GST — the van has reached you' }
}
export function cancelBooking(id: string, reason: string) {
  update((s) => {
    const b = s.bookings.find((x) => x.id === id); if (!b) return
    const paid = b.status !== 'awaiting_payment'
    const fee = cancelCharge(b).fee
    b.status = 'cancelled'; b.endedAt = now(); b.timeline.push({ t: now(), label: `Cancelled · ${reason}` })
    if (paid) refundTo(s, b, b.price.total - fee, fee ? `Cancelled — ${fee === 49 ? '₹49 cancellation fee' : 'visit fee + GST'} retained` : 'Cancelled — full refund')
  })
}

export const sessionActions = {
  pause(id: string) { update((s) => { const b = s.bookings.find((x) => x.id === id); if (b?.status === 'charging') { b.status = 'paused'; b.pausedAt = now(); log(b, 'Paused by you') } }) },
  resume(id: string) { update((s) => { const b = s.bookings.find((x) => x.id === id); if (b?.status === 'paused' && b.pausedAt) { b.pausedMs += now() - b.pausedAt; b.pausedAt = undefined; b.status = 'charging'; log(b, 'Resumed') } }) },
  stop(id: string) { update((s) => { const b = s.bookings.find((x) => x.id === id); if (b && ['charging', 'paused'].includes(b.status)) { const p = sessionProgress(b); finalize(s, b, Math.max(0.1, b.estKwh * p), 'completed', now()); log(b, 'Stopped early by you') } }) },
  interrupt(id: string) { update((s) => { const b = s.bookings.find((x) => x.id === id); if (b && ['charging', 'paused'].includes(b.status)) { const p = sessionProgress(b); finalize(s, b, Math.max(0.1, b.estKwh * p), 'interrupted', now()) } }) },
  complete(id: string) { update((s) => { const b = s.bookings.find((x) => x.id === id); if (b && ['charging', 'paused', 'connecting', 'arrived'].includes(b.status)) finalize(s, b, b.estKwh, 'completed', now()) }) },
  rate(id: string, rating: number, feedback: string, tips: string[]) { update((s) => { const b = s.bookings.find((x) => x.id === id); if (b) { b.rating = rating; b.feedback = feedback; b.tips = tips } }) },
}
