import { update, makeBooking, confirmPaid, assignVan, getState, resetAll, isActive, type State, type Booking } from './store'
import { uid } from './format'
import { ensureFleet } from './fleet'
import { SAMPLE_ADDRESSES, zoneForPin, EV_MODELS } from './data'

type Nav = (to: string) => void
export interface Scenario { id: string; group: 'Customer' | 'Booking & payment' | 'Live session' | 'Fleet' | 'App'; title: string; desc: string; run: (nav: Nav) => void }

const ready = (s: State) => {
  s.auth.loggedIn = true; s.auth.phone = s.auth.phone ?? '+91 98100 12345'; s.auth.name = s.auth.name ?? 'Akshat Singh'; s.auth.onboarded = true; s.locationGranted = true
  if (!s.addresses.length) { const a = SAMPLE_ADDRESSES[0]; s.addresses.push({ ...a, id: uid('A'), zoneId: zoneForPin(a.pin)?.id, parking: 'Basement B2, slot 114' }) }
  if (!s.vehicles.length) { const m = EV_MODELS[0]; s.vehicles.push({ id: uid('V'), modelId: m.id, name: `${m.make} ${m.model}`, reg: 'KA 01 MX 4521', connector: m.connector, batteryKwh: m.kwh, type: m.type, colour: m.colour }) }
  s.vehicleId = s.vehicleId ?? s.vehicles[0].id; s.addressId = s.addressId ?? s.addresses[0].id
  s.draft.vehicleId = s.vehicleId; s.draft.addressId = s.addressId
}
const activeMine = (s: State) => s.bookings.find((b) => b.source === 'me' && isActive(b))
/** Cancel stale active bookings and create a fresh one in a given state. */
const fresh = (mut: (s: State, b: Booking) => void) => {
  let id = ''
  update((s) => {
    ready(s)
    s.draft.currentSoc = 24; s.draft.targetSoc = 80; s.draft.slot = { kind: 'now' }; s.draft.payMethod = 'upi'; s.draft.coupon = undefined
    const b = makeBooking(s, 'searching'); b.flags = {}; confirmPaid(s, b); mut(s, b)
    s.bookings.filter((x) => x.source === 'me' && isActive(x)).forEach((x) => { x.status = 'cancelled'; x.supersededBy = b.id; x.timeline.push({ t: Date.now(), label: 'Cancelled (demo reset)' }) })
    s.bookings.unshift(b); id = b.id
  })
  return id
}

export const SCENARIOS: Scenario[] = [
  { id: 'loc', group: 'Customer', title: 'Location permission denied', desc: 'Blocked location → manual address', run: (n) => { update((s) => { s.demo.locationDenied = true }); n('/location') } },
  { id: 'area', group: 'Customer', title: 'Outside service area', desc: 'Pincode 400001 → waitlist', run: (n) => n('/address/new?pin=400001&line=Nariman%20Point%2C%20Mumbai') },
  { id: 'otp', group: 'Customer', title: 'Wrong or expired OTP', desc: 'Expired code, resend, attempts left', run: (n) => { update((s) => { s.demo.otpExpired = true }); n('/otp?phone=9810012345') } },
  { id: 'conn', group: 'Customer', title: 'Connector incompatible', desc: 'CHAdeMO car vs our CCS2/Type 2 vans', run: (n) => { update(ready); n('/vehicle/add?model=leaf') } },
  { id: 'soc', group: 'Booking & payment', title: 'Target below current charge', desc: 'Target 70% with 80% already in battery', run: (n) => { update((s) => { ready(s); s.draft.currentSoc = 80; s.draft.targetSoc = 70 }); n('/book') } },
  { id: 'small', group: 'Booking & payment', title: 'Too little energy', desc: 'Below the 5 kWh car minimum', run: (n) => { update((s) => { ready(s); s.draft.currentSoc = 72; s.draft.targetSoc = 80 }); n('/book') } },
  { id: 'slots', group: 'Booking & payment', title: 'No slots available', desc: 'Every scheduled slot is full', run: (n) => { update((s) => { ready(s); s.demo.noSlots = true; s.draft.currentSoc = 24; s.draft.targetSoc = 80; s.draft.slot = { kind: 'scheduled', day: 'Today', label: '', night: false } }); n('/book?schedule=1') } },
  { id: 'payfail', group: 'Booking & payment', title: 'Payment fails, then retry', desc: 'Next card/wallet payment is declined', run: (n) => { update((s) => { ready(s); s.demo.payFail = true; s.draft.currentSoc = 24; s.draft.targetSoc = 80; s.draft.slot = { kind: 'now' }; s.draft.payMethod = 'card' }); n('/checkout') } },
  { id: 'upi', group: 'Booking & payment', title: 'UPI pending (5-min timer)', desc: 'Approve-in-app countdown', run: (n) => {
    let id = ''; update((s) => { ready(s); s.draft.currentSoc = 24; s.draft.targetSoc = 80; s.draft.slot = { kind: 'now' }; s.draft.payMethod = 'upi'; const b = makeBooking(s, 'awaiting_payment'); s.bookings.unshift(b); id = b.id }); n(`/pay/${id}`)
  } },
  { id: 'nopartner', group: 'Live session', title: 'No partner available', desc: 'Search ends with no free van', run: (n) => { const id = fresh((_s, b) => { b.flags.noPartner = true }); n(`/track/${id}`) } },
  { id: 'delay', group: 'Live session', title: 'Partner delayed', desc: '+10 min ETA, ₹50 goodwill credit', run: (n) => {
    let id = ''
    const cur = activeMine(getState())
    const goodwill = (s: State, b: Booking) => { b.delayMs += 15000; b.delayed = true; b.timeline.push({ t: Date.now(), label: 'Van running late · +10 min · ₹50 goodwill credit added' }); s.wallet.balance += 50; s.wallet.txns.unshift({ id: uid('T'), t: Date.now(), label: `Delay goodwill credit · ${b.id}`, amount: 50 }) }
    if (cur && cur.status === 'en_route') { id = cur.id; update((s) => { goodwill(s, s.bookings.find((x) => x.id === id)!) }) }
    else id = fresh((s, b) => { assignVan(s, b); goodwill(s, b) })
    n(`/track/${id}`)
  } },
  { id: 'cancel', group: 'Live session', title: 'Cancel with refund policy', desc: 'Van on the way → ₹49 fee shown', run: (n) => { const id = fresh((s, b) => { assignVan(s, b) }); n(`/track/${id}?cancel=1`) } },
  { id: 'interrupt', group: 'Live session', title: 'Session interrupted', desc: 'Stops at ~45% → partial-kWh refund', run: (n) => { const id = fresh((s, b) => { assignVan(s, b); b.status = 'charging'; b.arrivedAt = Date.now() - 9000; b.chargeStartAt = Date.now(); b.flags.interruptAt = 0.45; b.timeline.push({ t: Date.now(), label: 'Charging started' }) }); n(`/session/${id}`) } },
  { id: 'handshake', group: 'Live session', title: 'Vehicle not accepting charge', desc: 'Handshake fails after plug-in', run: (n) => { const id = fresh((s, b) => { assignVan(s, b); b.status = 'connecting'; b.arrivedAt = Date.now() - 6000; b.connectAt = Date.now(); b.flags.handshakeFail = true; b.timeline.push({ t: Date.now(), label: 'Connector plugged in · handshaking' }) }); n(`/track/${id}`) } },
  { id: 'charging', group: 'Live session', title: 'Jump to a live session', desc: 'Watch kWh and SoC climb', run: (n) => { const id = fresh((s, b) => { assignVan(s, b); b.status = 'charging'; b.arrivedAt = Date.now() - 9000; b.chargeStartAt = Date.now(); b.timeline.push({ t: Date.now(), label: 'Charging started' }) }); n(`/session/${id}`) } },
  { id: 'gst', group: 'Fleet', title: 'Invalid GSTIN', desc: 'Checksum fails on sign-up', run: (n) => n('/fleet/signup?gst=06AAKCS1234F1Z5') },
  { id: 'credit', group: 'Fleet', title: 'Credit limit reached', desc: 'Overnight plan exceeds available credit', run: (n) => { ensureFleet(); update((s) => { s.fleet.credit.used = s.fleet.credit.limit - 3200 }); n('/fleet/schedule?big=1') } },
  { id: 'partial', group: 'Fleet', title: 'Partial fulfilment', desc: '2 vehicles missed — billed for delivered only', run: (n) => { ensureFleet(); n('/fleet/bookings') } },
  { id: 'offline', group: 'App', title: 'Toggle offline banner', desc: 'Simulates losing the network', run: () => update((s) => { s.demo.offline = !s.demo.offline }) },
  { id: 'empty', group: 'App', title: 'Empty states', desc: 'History with nothing in it', run: (n) => n('/bookings?empty=1') },
  { id: 'reset', group: 'App', title: 'Reset demo data', desc: 'Clears everything in this browser', run: (n) => { resetAll(); n('/') } },
]
