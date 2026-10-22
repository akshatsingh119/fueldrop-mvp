import { PRICE } from './data'
import { r2 } from './format'

export interface Coupon { code: string; title: string; desc: string }
// Sample coupons from PRD v2 (PAY-05).
export const COUPONS: Coupon[] = [
  { code: 'FIRSTCHARGE', title: '₹50 off the visit fee', desc: 'On your first doorstep charge' },
  { code: 'EVNIGHT', title: '10% off energy', desc: 'Scheduled slots between 10 PM and 6 AM' },
]

export interface Price {
  kwh: number; perKwh: number; energy: number; energyDiscount: number; fee: number; feeDiscount: number; feeAfter: number; taxable: number; gst: number; total: number; coupon?: string; fleet?: boolean; sessions?: number
}

export type CouponCheck = { ok: true } | { ok: false; error: string }
export const checkCoupon = (code: string, opts: { night: boolean; firstBooking: boolean }): CouponCheck => {
  const c = code.trim().toUpperCase()
  if (!c) return { ok: false, error: 'Enter a code' }
  if (c === 'FIRSTCHARGE') return opts.firstBooking ? { ok: true } : { ok: false, error: 'FIRSTCHARGE is only for your first booking.' }
  if (c === 'EVNIGHT') return opts.night ? { ok: true } : { ok: false, error: 'EVNIGHT works on scheduled slots between 10 PM and 6 AM.' }
  return { ok: false, error: `“${c}” isn’t a valid code.` }
}

/** PRD v2: energy + visit fee − coupon = taxable value; GST 18% on the whole taxable value. */
export const priceFor = (kwh: number, coupon?: string, opts: { perKwh?: number; fee?: number; sessions?: number; fleet?: boolean } = {}): Price => {
  const perKwh = opts.perKwh ?? PRICE.perKwh
  const fee = opts.fee ?? PRICE.visitFee
  const k = Math.round(kwh * 10) / 10
  const energy = r2(k * perKwh)
  const c = coupon?.toUpperCase()
  const feeDiscount = c === 'FIRSTCHARGE' ? Math.min(50, fee) : 0
  const energyDiscount = c === 'EVNIGHT' ? r2(energy * 0.1) : 0
  const feeAfter = r2(fee - feeDiscount)
  const taxable = r2(energy - energyDiscount + feeAfter)
  const gst = r2(taxable * PRICE.gst)
  const total = r2(taxable + gst)
  return { kwh: k, perKwh, energy, energyDiscount, fee, feeDiscount, feeAfter, taxable, gst, total, coupon: c, fleet: opts.fleet, sessions: opts.sessions }
}
export const FLEET = { perKwh: 19, sessionFee: 79 }
export const fleetPrice = (kwh: number, vehicles: number) => priceFor(kwh, undefined, { perKwh: FLEET.perKwh, fee: FLEET.sessionFee * vehicles, sessions: vehicles, fleet: true })

export const estimateKwh = (battery: number, from: number, to: number) => Math.max(0, Math.round(((to - from) / 100) * battery * 10) / 10)
