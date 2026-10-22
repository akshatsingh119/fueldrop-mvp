import { NavLink } from 'react-router-dom'
import { House, History, Wallet, User } from 'lucide-react'
import { cx } from './ui'

const items = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/bookings', label: 'Bookings', icon: History },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: User },
]
export function BottomNav() {
  return (
    <nav aria-label="Main" className="grid grid-cols-4 border-t border-line/70 bg-white/95 px-2 pb-4 pt-2 backdrop-blur">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} className={({ isActive }) => cx('flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition', isActive ? 'text-ev-700' : 'text-ink-3 hover:text-navy')}>
          {({ isActive }) => (<>
            <span className={cx('grid h-7 w-12 place-items-center rounded-full transition', isActive && 'bg-ev-100')}><i.icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.4 : 2} /></span>
            {i.label}
          </>)}
        </NavLink>
      ))}
    </nav>
  )
}
