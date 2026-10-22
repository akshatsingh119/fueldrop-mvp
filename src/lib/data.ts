export type Connector = 'CCS2' | 'Type 2' | 'Bharat AC-001' | 'LEV' | 'CHAdeMO' | 'GB/T'
export type VType = 'car' | '2w' | '3w'
export interface EVModel {
  id: string; make: string; model: string; type: VType; connector: Connector; kwh: number; maxKw: number; colour: string
}

// Specs are approximate, for demo purposes only.
export const EV_MODELS: EVModel[] = [
  { id: 'nexon-ev', make: 'Tata', model: 'Nexon EV (LR)', type: 'car', connector: 'CCS2', kwh: 40.5, maxKw: 30, colour: '#2B6CB0' },
  { id: 'tiago-ev', make: 'Tata', model: 'Tiago EV', type: 'car', connector: 'CCS2', kwh: 24, maxKw: 25, colour: '#C53030' },
  { id: 'punch-ev', make: 'Tata', model: 'Punch EV', type: 'car', connector: 'CCS2', kwh: 35, maxKw: 30, colour: '#2F855A' },
  { id: 'zs-ev', make: 'MG', model: 'ZS EV', type: 'car', connector: 'CCS2', kwh: 50.3, maxKw: 30, colour: '#4A5568' },
  { id: 'comet', make: 'MG', model: 'Comet EV', type: 'car', connector: 'Type 2', kwh: 17.3, maxKw: 7.4, colour: '#D69E2E' },
  { id: 'xuv400', make: 'Mahindra', model: 'XUV400 EV', type: 'car', connector: 'CCS2', kwh: 39.4, maxKw: 30, colour: '#2C5282' },
  { id: 'kona', make: 'Hyundai', model: 'Kona Electric', type: 'car', connector: 'CCS2', kwh: 39.2, maxKw: 30, colour: '#E2E8F0' },
  { id: 'creta-ev', make: 'Hyundai', model: 'Creta Electric', type: 'car', connector: 'CCS2', kwh: 51.4, maxKw: 30, colour: '#718096' },
  { id: 'atto3', make: 'BYD', model: 'Atto 3', type: 'car', connector: 'CCS2', kwh: 60.5, maxKw: 30, colour: '#38A169' },
  { id: 'leaf', make: 'Nissan', model: 'Leaf (imported, 2017)', type: 'car', connector: 'CHAdeMO', kwh: 40, maxKw: 0, colour: '#A0AEC0' },
  { id: 'ather-450x', make: 'Ather', model: '450X', type: '2w', connector: 'LEV', kwh: 3.7, maxKw: 3, colour: '#1A202C' },
  { id: 'ola-s1pro', make: 'Ola', model: 'S1 Pro', type: '2w', connector: 'LEV', kwh: 4, maxKw: 3, colour: '#F7FAFC' },
  { id: 'iqube', make: 'TVS', model: 'iQube S', type: '2w', connector: 'LEV', kwh: 3.4, maxKw: 3, colour: '#319795' },
  { id: 'treo', make: 'Mahindra', model: 'Treo (e-auto)', type: '3w', connector: 'Bharat AC-001', kwh: 7.4, maxKw: 3.3, colour: '#DD6B20' },
  { id: 'piaggio-ape', make: 'Piaggio', model: 'Ape E-City FX', type: '3w', connector: 'Bharat AC-001', kwh: 8, maxKw: 3.3, colour: '#3182CE' },
]

/** Connectors our vans carry (demo). */
export const SUPPORTED: Connector[] = ['CCS2', 'Type 2', 'Bharat AC-001', 'LEV']
export const VAN_KW: Record<Connector, number> = { CCS2: 30, 'Type 2': 7.4, 'Bharat AC-001': 3.3, LEV: 3, CHAdeMO: 0, 'GB/T': 0 }

export const PRICE = { perKwh: 21, visitFee: 149, gst: 0.18, minKwhCar: 5, minKwh2w: 1, upiWindowSec: 300 }

export interface Zone { id: string; city: 'Bengaluru' | 'Delhi NCR'; name: string; pins: string[] }
export const ZONES: Zone[] = [
  { id: 'blr-hsr', city: 'Bengaluru', name: 'HSR Layout', pins: ['560102'] },
  { id: 'blr-kor', city: 'Bengaluru', name: 'Koramangala', pins: ['560034', '560095'] },
  { id: 'blr-wf', city: 'Bengaluru', name: 'Whitefield', pins: ['560066', '560048'] },
  { id: 'blr-ind', city: 'Bengaluru', name: 'Indiranagar', pins: ['560038', '560008'] },
  { id: 'ncr-noida', city: 'Delhi NCR', name: 'Noida Sec 62 / 18', pins: ['201309', '201301'] },
  { id: 'ncr-ggn', city: 'Delhi NCR', name: 'Gurugram Cyber City', pins: ['122002', '122001'] },
  { id: 'ncr-dwk', city: 'Delhi NCR', name: 'Dwarka', pins: ['110075', '110078'] },
]
export const zoneForPin = (pin: string) => ZONES.find((z) => z.pins.includes(pin.trim()))

export const SAMPLE_ADDRESSES = [
  { label: 'Home', line: 'Flat 1204, Tower B, Sobha Daffodil, Sector 2, HSR Layout', pin: '560102' },
  { label: 'Office', line: '3rd Floor, Prestige Tech Park, Outer Ring Road, Kadubeesanahalli', pin: '560103' },
  { label: 'Parents', line: 'C-48, Sector 62, Noida, Uttar Pradesh', pin: '201309' },
]

export const PARTNERS = [
  { id: 'p1', name: 'Ramesh Kumar', rating: 4.9, phone: '+91 98XXX XX214' },
  { id: 'p2', name: 'Suresh Gowda', rating: 4.8, phone: '+91 97XXX XX031' },
  { id: 'p3', name: 'Imran Shaikh', rating: 4.7, phone: '+91 99XXX XX778' },
  { id: 'p4', name: 'Pooja Yadav', rating: 4.9, phone: '+91 96XXX XX402' },
  { id: 'p5', name: 'Vikram Singh', rating: 4.6, phone: '+91 95XXX XX119' },
]

export const timeSlots = () => {
  const d = new Date(); const out: { id: string; day: string; label: string; night: boolean; left: number }[] = []
  const days = ['Today', 'Tomorrow']
  const hours = [8, 10, 12, 14, 16, 18, 20, 22]
  days.forEach((day, di) => hours.forEach((h, hi) => {
    if (di === 0 && h <= d.getHours() + 1) return
    const fmt = (x: number) => `${((x + 11) % 12) + 1}${x < 12 || x === 24 ? ' AM' : ' PM'}`
    out.push({ id: `${di}-${h}`, day, label: `${fmt(h)} – ${fmt((h + 2) % 24 || 24)}`.replace('12 AM', '12 AM'), night: h >= 22, left: ((h * 7 + di * 3 + hi) % 4) })
  }))
  return out
}
