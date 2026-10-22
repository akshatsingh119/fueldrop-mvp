export const inr = (n: number, dp = 2) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
export const inr0 = (n: number) => inr(n, 0)
export const r2 = (n: number) => Math.round(n * 100) / 100
export const kwh = (n: number) => `${n.toLocaleString('en-IN', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} kWh`
export const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
export const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtDT = (ts: number) => `${fmtDate(ts)}, ${fmtTime(ts)}`
export const uid = (p = '') => p + Math.random().toString(36).slice(2, 8).toUpperCase()
export const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`

// GSTIN: 2-digit state code + PAN (5 letters, 4 digits, 1 letter) + entity no. + 'Z' + checksum (mod-36).
const CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const gstChecksum = (first14: string) => {
  let sum = 0
  for (let i = 0; i < 14; i++) {
    const v = CH.indexOf(first14[i]) * (i % 2 ? 2 : 1)
    sum += Math.floor(v / 36) + (v % 36)
  }
  return CH[(36 - (sum % 36)) % 36]
}
export type GstResult = { ok: true; state: string } | { ok: false; error: string }
const STATES: Record<string, string> = { '07': 'Delhi', '06': 'Haryana', '09': 'Uttar Pradesh', '29': 'Karnataka', '27': 'Maharashtra', '33': 'Tamil Nadu', '36': 'Telangana', '24': 'Gujarat' }
export const validateGstin = (raw: string): GstResult => {
  const g = raw.trim().toUpperCase()
  if (g.length !== 15) return { ok: false, error: `GSTIN must be 15 characters (you entered ${g.length}).` }
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return { ok: false, error: 'GSTIN looks invalid. A GSTIN has 15 characters (e.g. 29AAKCS1234F1Z5).' }
  const sc = parseInt(g.slice(0, 2), 10)
  if (sc < 1 || sc > 38) return { ok: false, error: 'First two digits must be a valid state code (01–38).' }
  if (gstChecksum(g.slice(0, 14)) !== g[14]) return { ok: false, error: 'Checksum digit doesn’t match. Please re-check the last character.' }
  return { ok: true, state: STATES[g.slice(0, 2)] ?? `State code ${g.slice(0, 2)}` }
}
export const SAMPLE_GSTIN = (() => { const b = '06AAKCS1234F1Z'; return b + gstChecksum(b) })()
