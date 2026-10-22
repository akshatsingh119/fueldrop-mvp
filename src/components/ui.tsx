import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronLeft, Bike, Car, Truck, WifiOff, CircleCheck, CircleAlert, Info, X, Loader2 } from 'lucide-react'
import type { VType } from '../lib/data'
import { useStore } from '../lib/store'

export const cx = clsx

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'dark' | 'ghost' | 'ev' | 'danger' | 'soft' | 'link'; size?: 'lg' | 'md' | 'sm'; loading?: boolean; icon?: ReactNode; block?: boolean }
export function Button({ variant = 'primary', size = 'lg', loading, icon, block = true, className, children, disabled, ...rest }: BtnProps) {
  const v = {
    primary: 'bg-brand text-white shadow-cta hover:bg-brand-600',
    dark: 'bg-navy text-white hover:bg-navy-700',
    ev: 'bg-ev text-white shadow-glow hover:bg-ev-700',
    ghost: 'bg-white text-navy ring-1 ring-inset ring-line hover:ring-navy/30',
    soft: 'bg-navy-100/70 text-navy hover:bg-navy-100',
    danger: 'bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50',
    link: 'bg-transparent text-brand hover:underline shadow-none',
  }[variant]
  const s = { lg: 'h-14 px-5 text-[15px] rounded-2xl', md: 'h-11 px-4 text-sm rounded-xl', sm: 'h-9 px-3 text-[13px] rounded-lg' }[size]
  return (
    <button {...rest} disabled={disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30', v, s, block && 'w-full', className)}>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

export function IconBtn({ label, onClick, children, className, dark }: { label: string; onClick?: () => void; children: ReactNode; className?: string; dark?: boolean }) {
  return <button aria-label={label} title={label} onClick={onClick} className={cx('grid h-10 w-10 place-items-center rounded-xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30', dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-navy shadow-card hover:bg-navy-100/50', className)}>{children}</button>
}

export const Card = ({ className, children, onClick, as }: { className?: string; children: ReactNode; onClick?: () => void; as?: 'button' | 'div' }) => {
  if (onClick || as === 'button') return <button onClick={onClick} className={cx('block w-full rounded-2xl bg-white p-4 text-left shadow-card transition hover:shadow-lift active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30', className)}>{children}</button>
  return <div className={cx('rounded-2xl bg-white p-4 shadow-card', className)}>{children}</div>
}

export const Badge = ({ tone = 'navy', children, className }: { tone?: 'navy' | 'ev' | 'brand' | 'red' | 'amber' | 'grey' | 'blue'; children: ReactNode; className?: string }) => (
  <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold', {
    navy: 'bg-navy text-white', ev: 'bg-ev-100 text-ev-700', brand: 'bg-brand-100 text-brand-600', red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-700', grey: 'bg-navy-100 text-ink-2', blue: 'bg-blue-50 text-blue-700',
  }[tone], className)}>{children}</span>
)

export const Chip = ({ on, children, onClick, disabled, className }: { on?: boolean; children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
  <button type="button" aria-pressed={on} disabled={disabled} onClick={onClick}
    className={cx('whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold ring-1 ring-inset transition active:scale-95 disabled:opacity-40 disabled:line-through', on ? 'bg-navy text-white ring-navy' : 'bg-white text-navy ring-line hover:ring-navy/30', className)}>{children}</button>
)

export function TopBar({ title, back = true, onBack, right, sub, transparent }: { title?: ReactNode; back?: boolean | string; onBack?: () => void; right?: ReactNode; sub?: ReactNode; transparent?: boolean }) {
  const nav = useNavigate()
  return (
    <header className={cx('z-10 flex items-center gap-3 px-5 pb-3 pt-3', !transparent && 'bg-bg/90 backdrop-blur')}>
      {back && <IconBtn label="Back" onClick={() => (onBack ? onBack() : typeof back === 'string' ? nav(back) : nav(-1))}><ChevronLeft className="h-5 w-5" /></IconBtn>}
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-[17px] font-bold tracking-tight">{title}</h1>}
        {sub && <p className="truncate text-xs text-ink-2">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

/** A full-height screen with its own scroll area and an optional sticky footer. */
export function Screen({ children, footer, top, bottom, className, bodyClass, bg = 'bg-bg' }: { children: ReactNode; footer?: ReactNode; top?: ReactNode; bottom?: ReactNode; className?: string; bodyClass?: string; bg?: string }) {
  return (
    <div className={cx('relative flex h-full flex-col', bg, className)}>
      <OfflineBanner />
      {top}
      <main className={cx('no-scrollbar flex-1 overflow-y-auto overscroll-contain', bodyClass)}>{children}</main>
      {footer && <div className="border-t border-line/70 bg-white/95 px-5 pb-5 pt-3 backdrop-blur">{footer}</div>}
      {bottom}
    </div>
  )
}

export function OfflineBanner() {
  const demoOff = useStore((s) => s.demo.offline)
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => { const a = () => setOnline(true), b = () => setOnline(false); window.addEventListener('online', a); window.addEventListener('offline', b); return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b) } }, [])
  if (online && !demoOff) return null
  return (
    <div role="status" className="flex items-center gap-2 bg-navy px-5 py-2 text-[12px] font-medium text-white animate-fade">
      <WifiOff className="h-4 w-4 text-amber-300" aria-hidden /> You’re offline. Showing saved info — payments are paused until you reconnect.
    </div>
  )
}
export const useOffline = () => { const d = useStore((s) => s.demo.offline); return d || (typeof navigator !== 'undefined' && !navigator.onLine) }

export function Field({ label, hint, error, prefix, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string; prefix?: ReactNode }) {
  const id = rest.id ?? 'f-' + label.replace(/\W+/g, '-').toLowerCase()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-navy">{label}</label>
      <div className={cx('flex h-[52px] items-center gap-2 rounded-2xl bg-white px-4 ring-1 ring-inset transition focus-within:ring-2', error ? 'ring-red-400 focus-within:ring-red-500' : 'ring-line focus-within:ring-navy')}>
        {prefix && <span className="text-[15px] font-semibold text-ink-2">{prefix}</span>}
        <input id={id} {...rest} aria-invalid={!!error} aria-describedby={error ? id + '-e' : undefined} className="h-full w-full min-w-0 bg-transparent text-[15px] font-medium text-navy placeholder:text-ink-3 focus:outline-none" />
      </div>
      {error ? <p id={id + '-e'} className="mt-1.5 flex items-start gap-1 text-[12px] font-medium text-red-600"><CircleAlert className="mt-px h-3.5 w-3.5 flex-none" />{error}</p> : hint ? <p className="mt-1.5 text-[12px] text-ink-2">{hint}</p> : null}
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx('relative h-6 w-11 flex-none rounded-full transition', on ? 'bg-ev' : 'bg-navy-100')}>
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cx('animate-shimmer rounded-xl bg-[linear-gradient(90deg,#E9EDF5_0%,#F6F8FC_50%,#E9EDF5_100%)] bg-[length:800px_100%]', className)} />

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center animate-rise">
      <div className="mb-4 grid h-20 w-20 place-items-center rounded-[28px] bg-white text-ev shadow-card">{icon}</div>
      <h3 className="text-[17px] font-bold">{title}</h3>
      <p className="mt-1.5 max-w-[260px] text-sm leading-5 text-ink-2">{body}</p>
      {action && <div className="mt-5 w-full max-w-[260px]">{action}</div>}
    </div>
  )
}

export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [open, onClose])
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Dialog'}>
      <button aria-label="Close" className="absolute inset-0 bg-navy/45 animate-fade" onClick={onClose} />
      <div className="relative max-h-[88%] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-6 pt-3 animate-sheet no-scrollbar">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-navy-100" />
        {title && <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold tracking-tight">{title}</h2><button aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-navy-100/70"><X className="h-4 w-4" /></button></div>}
        {children}
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  )
}

// ---------- toasts ----------
type T = { id: number; text: string; tone: 'ok' | 'err' | 'info' }
let tlist: T[] = []; const tl = new Set<(t: T[]) => void>()
export const toast = (text: string, tone: T['tone'] = 'ok') => {
  const t = { id: Math.random(), text, tone }; tlist = [...tlist.slice(-1), t]; tl.forEach((l) => l(tlist))
  setTimeout(() => { tlist = tlist.filter((x) => x.id !== t.id); tl.forEach((l) => l(tlist)) }, 2400)
}
export function Toaster() {
  const [list, set] = useState<T[]>(tlist)
  useEffect(() => { tl.add(set); return () => { tl.delete(set) } }, [])
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-28 z-50 flex flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-[360px] items-center gap-2.5 rounded-2xl bg-navy px-4 py-3 text-[13px] font-medium text-white shadow-lift animate-rise">
          {t.tone === 'ok' ? <CircleCheck className="h-[18px] w-[18px] flex-none text-ev-400" /> : t.tone === 'err' ? <CircleAlert className="h-[18px] w-[18px] flex-none text-red-400" /> : <Info className="h-[18px] w-[18px] flex-none text-sky-300" />}
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function Logo({ size = 32, light }: { size?: number; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="18" fill={light ? '#fff' : '#0F1B3D'} />
        <path d="M32 9S16 27 16 38a16 16 0 0 0 32 0C48 27 32 9 32 9z" fill="#16A34A" />
        <path d="M34.5 23 24.5 39h7.5l-2.5 12 10-16.5h-7.5z" fill="#fff" />
      </svg>
      <span className={cx('font-extrabold tracking-tight', light ? 'text-white' : 'text-navy')} style={{ fontSize: size * 0.62 }}>Fuel<span className="text-ev">Drop</span></span>
    </span>
  )
}

export function VehicleGlyph({ type, colour = '#16A34A', className }: { type: VType; colour?: string; className?: string }) {
  const I = type === 'car' ? Car : type === '2w' ? Bike : Truck
  return <div className={cx('grid h-12 w-12 flex-none place-items-center rounded-2xl', className)} style={{ background: `linear-gradient(135deg, ${colour}22, ${colour}44)` }}><I className="h-6 w-6 text-navy" aria-hidden /></div>
}

export function Bar({ value, tone = 'ev', className }: { value: number; tone?: 'ev' | 'brand' | 'navy' | 'red' | 'amber'; className?: string }) {
  const c = { ev: 'bg-ev', brand: 'bg-brand', navy: 'bg-navy', red: 'bg-red-500', amber: 'bg-amber-500' }[tone]
  return <div className={cx('h-2 overflow-hidden rounded-full bg-navy-100', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><div className={cx('h-full rounded-full transition-all duration-700', c)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
}

export const Row = ({ k, v, strong, tone }: { k: ReactNode; v: ReactNode; strong?: boolean; tone?: 'ev' | 'red' }) => (
  <div className={cx('flex items-start justify-between gap-4 py-1.5 text-[14px]', strong ? 'font-bold text-navy' : 'text-ink-2')}>
    <span>{k}</span><span className={cx('text-right tabular-nums', strong ? 'text-navy' : 'font-medium text-navy', tone === 'ev' && '!text-ev-700', tone === 'red' && '!text-red-600')}>{v}</span>
  </div>
)

export const SectionTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-2.5 mt-6 flex items-center justify-between"><h2 className="text-[15px] font-bold tracking-tight">{children}</h2>{action}</div>
)
