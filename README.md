# FuelDrop – doorstep EV charging web MVP (demo)

**Live demo:** https://akshatsingh119.github.io/fueldrop-mvp/
**Ops console:** https://akshatsingh119.github.io/fueldrop-mvp/#/admin

Vite + React 19 + TypeScript + Tailwind. All data is sample data held in your browser's `localStorage`. There's no backend, and no real payments, SMS or dispatch happen.

## Demo login
Tap **"Use demo number"** (or enter any Indian mobile number), then enter OTP **123456**. Any other code shows the wrong-OTP state.

## Surfaces
- `#/` customer app (primary). On desktop it sits inside a phone frame, with demo scenarios beside it.
- `#/fleet` FuelDrop for Business (early access) · `#/fleet/signup`
- `#/admin` ops console. Open it in another tab; it syncs with the customer app through localStorage.
- Demo menu: the "Demo" tab on the right edge of the phone (or the right-hand panel on desktop) triggers every edge case.

Routing uses a hash router so deep links and refreshes work on GitHub Pages. `404.html` also redirects plain paths like `/fueldrop-mvp/admin` to `#/admin`.

## Run locally
    npm install
    npm run dev                      # http://localhost:5173/fueldrop-mvp/
    npm run build                    # output in dist/ (base path /fueldrop-mvp/)
    BASE_PATH=/ npm run build        # build for hosting at a domain root

## Deploy
Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Pricing (PRD v2)
Personal: ₹21/kWh energy + ₹149 visit fee, then 18% GST on the whole taxable value (after any coupon).
Fleet sample: ₹19/kWh + ₹79 per vehicle session + 18% GST. Coupons: FIRSTCHARGE (₹50 off the visit fee, first booking) and EVNIGHT (10% off energy, 10 PM–6 AM slots).

## QA
`node qa.mjs` and `node shots.mjs` drive headless Chrome via playwright-core (`BASE=<url>`).
