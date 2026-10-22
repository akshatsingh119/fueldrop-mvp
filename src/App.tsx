import { useEffect, type ReactNode } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PhoneShell } from './components/PhoneShell'
import { Splash, Login, Otp, Location, AddressNew, Waitlist } from './screens/customer/Onboarding'
import { VehicleAdd } from './screens/customer/Vehicle'
import { Home } from './screens/customer/Home'
import { Book } from './screens/customer/Book'
import { Checkout, UpiPending, Booked } from './screens/customer/Checkout'
import { Track } from './screens/customer/Track'
import { Session, Receipt } from './screens/customer/Session'
import { Bookings, Wallet, Profile, Vehicles, Addresses, Support } from './screens/customer/Account'
import { FleetShell } from './screens/fleet/FleetShell'
import { FleetSignup, FleetDashboard, FleetVehicles, FleetSchedule, FleetBookings, FleetInvoices, FleetTeam, FleetCredit } from './screens/fleet/Fleet'
import { Admin } from './screens/admin/Admin'
import { PrintReceipt, PrintInvoice } from './screens/Print'
import { tick, useStore } from './lib/store'

function Auth({ children }: { children: ReactNode }) {
  const ok = useStore((s) => s.auth.loggedIn)
  return ok ? <>{children}</> : <Navigate to="/login" replace />
}
function Title() {
  const loc = useLocation()
  useEffect(() => {
    const p = loc.pathname
    document.title = p.startsWith('/admin') ? 'FuelDrop · Ops console' : p.startsWith('/fleet') ? 'FuelDrop for Business' : 'FuelDrop · Doorstep EV charging'
  }, [loc.pathname])
  return null
}

export default function App() {
  useEffect(() => { const i = setInterval(tick, 1000); return () => clearInterval(i) }, [])
  const A = (el: ReactNode) => <Auth>{el}</Auth>
  return (
    <HashRouter>
      <Title />
      <Routes>
        <Route element={<PhoneShell />}>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/location" element={A(<Location />)} />
          <Route path="/address/new" element={A(<AddressNew />)} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/vehicle/add" element={A(<VehicleAdd />)} />
          <Route path="/home" element={A(<Home />)} />
          <Route path="/book" element={A(<Book />)} />
          <Route path="/checkout" element={A(<Checkout />)} />
          <Route path="/pay/:id" element={A(<UpiPending />)} />
          <Route path="/booked/:id" element={A(<Booked />)} />
          <Route path="/track/:id" element={A(<Track />)} />
          <Route path="/session/:id" element={A(<Session />)} />
          <Route path="/receipt/:id" element={A(<Receipt />)} />
          <Route path="/bookings" element={A(<Bookings />)} />
          <Route path="/wallet" element={A(<Wallet />)} />
          <Route path="/profile" element={A(<Profile />)} />
          <Route path="/profile/vehicles" element={A(<Vehicles />)} />
          <Route path="/profile/addresses" element={A(<Addresses />)} />
          <Route path="/support" element={<Support />} />
        </Route>
        <Route path="/fleet/signup" element={<FleetSignup />} />
        <Route element={<FleetShell />}>
          <Route path="/fleet" element={<FleetDashboard />} />
          <Route path="/fleet/vehicles" element={<FleetVehicles />} />
          <Route path="/fleet/schedule" element={<FleetSchedule />} />
          <Route path="/fleet/bookings" element={<FleetBookings />} />
          <Route path="/fleet/invoices" element={<FleetInvoices />} />
          <Route path="/fleet/team" element={<FleetTeam />} />
          <Route path="/fleet/credit" element={<FleetCredit />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
        <Route path="/print/receipt/:id" element={<PrintReceipt />} />
        <Route path="/print/invoice/:id" element={<PrintInvoice />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
