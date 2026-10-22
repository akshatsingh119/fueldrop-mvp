import { chromium } from 'playwright-core'
const BASE = 'http://localhost:4173', OUT = '/workspace/fuel-app/web-shots'
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'en-IN', timezoneId: 'Asia/Kolkata' })).newPage()
const shot = async (n) => { await m.mouse.move(5, 5); await m.waitForTimeout(250); await m.screenshot({ path: `${OUT}/${n}.png` }); console.log(n) }
const demo = async (title) => { await m.getByRole('button', { name: 'Open demo scenarios' }).click(); await m.waitForTimeout(300); await m.getByRole('button', { name: new RegExp('^' + title) }).click(); await m.waitForTimeout(900) }
// onboard quickly
await m.goto(BASE + '/login'); await m.getByRole('button', { name: 'Use demo number' }).click(); await m.getByRole('button', { name: 'Send OTP' }).click(); await m.waitForURL('**/otp**')
await m.getByLabel('Digit 1').fill('123456'); await m.waitForURL('**/location'); await m.getByRole('button', { name: 'Allow location access' }).click(); await m.waitForTimeout(1400); await m.getByRole('button', { name: 'Confirm this location' }).click()
await m.getByLabel('Flat / house no. & building').fill('Flat 1204, Tower B, Sobha Daffodil'); await m.getByLabel(/Parking spot/).fill('Basement B2, slot 114'); await m.getByRole('button', { name: 'Save address' }).click()
await m.getByText('Tata Nexon EV (LR)').click(); await m.getByLabel('Registration number').fill('KA 01 MX 4521'); await m.getByRole('button', { name: 'Save vehicle' }).click(); await m.waitForURL('**/home'); await m.waitForTimeout(2800)
await shot('01-home')
await m.getByRole('button', { name: /Charge now/ }).click(); await m.waitForTimeout(2600); await shot('02-booking')
await m.getByRole('button', { name: 'Continue' }).click(); await m.getByRole('button', { name: /Apply a coupon/ }).click(); await m.waitForTimeout(300); await m.getByRole('button', { name: 'Apply', exact: true }).nth(1).click(); await m.waitForTimeout(2700)
await m.evaluate(() => document.querySelector('main')?.scrollTo(0, 330)); await shot('03-checkout')
await m.getByRole('radio', { name: /Card/ }).click(); await m.getByRole('button', { name: /^Pay / }).click(); await m.waitForURL('**/booked/**'); await m.getByRole('button', { name: 'Track your van' }).click()
await m.waitForTimeout(16000); await shot('04-live-tracking')
await demo('Jump to a live session'); await m.waitForTimeout(14000); await shot('05-charging-session')
await demo('Session interrupted'); await m.waitForTimeout(21000); await shot('08-edge-session-interrupted')
await demo('Payment fails'); await m.getByRole('button', { name: /^Pay / }).click(); await m.waitForTimeout(2000); await shot('09-edge-payment-failed')
const state = await m.evaluate(() => localStorage.getItem('fueldrop.state.v4'))
const d = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'en-IN', timezoneId: 'Asia/Kolkata' })).newPage()
await d.goto(BASE + '/'); await d.evaluate((s) => localStorage.setItem('fueldrop.state.v4', s), state)
await d.goto(BASE + '/fleet/signup'); await d.getByRole('button', { name: 'Use sample GSTIN' }).click(); await d.getByLabel('Registered business name').fill('Swift Mobility Pvt Ltd'); await d.getByLabel('Billing address').fill('Plot 42, Sector 18, Gurugram, Haryana 122015'); await d.getByRole('button', { name: 'Create business account' }).click(); await d.waitForURL('**/fleet')
await d.goto(BASE + '/fleet/schedule'); await d.getByRole('button', { name: /Schedule on credit/ }).click(); await d.waitForTimeout(500)
await d.goto(BASE + '/fleet'); await d.waitForTimeout(1500); await d.mouse.move(5, 5); await d.screenshot({ path: `${OUT}/06-fleet-dashboard.png` }); console.log('fleet')
await d.goto(BASE + '/admin'); await d.waitForTimeout(1500); await d.mouse.move(5, 5); await d.screenshot({ path: `${OUT}/07-admin.png` }); console.log('admin')
await d.goto(BASE + '/home'); await d.waitForTimeout(1500); await d.mouse.move(5, 5); await d.screenshot({ path: `${OUT}/10-desktop-customer.png` }); console.log('desk')
await b.close()
