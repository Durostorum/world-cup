import puppeteer from 'puppeteer'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const mockDir = path.join(root, 'mock')
const outDir = path.join(root, 'mock-screenshots')

const pages = [
  { file: 'home.html', name: 'home' },
  { file: 'matches.html', name: 'matches' },
  { file: 'match-detail.html', name: 'match-detail' },
  { file: 'my-bets.html', name: 'my-bets' },
  { file: 'leaderboard.html', name: 'leaderboard' },
  { file: 'profile.html', name: 'profile' },
  { file: 'auth.html', name: 'auth' },
]

const viewports = [
  { suffix: 'desktop', width: 1280, height: 800 },
  { suffix: 'mobile', width: 390, height: 844 },
]

const homeDesktopViewport = { suffix: 'desktop', width: 1440, height: 900 }

async function waitForImages(page) {
  await page.waitForFunction(() =>
    [...document.images].every((img) => img.complete && img.naturalHeight > 0),
    { timeout: 15000 },
  ).catch(() => {})
}

await mkdir(outDir, { recursive: true })

const browser = await puppeteer.launch({ headless: true })

for (const pageDef of pages) {
  const fileUrl = pathToFileURL(path.join(mockDir, pageDef.file)).href
  const pageViewports =
    pageDef.name === 'home'
      ? [homeDesktopViewport, viewports.find((v) => v.suffix === 'mobile')]
      : viewports

  for (const vp of pageViewports) {
    const page = await browser.newPage()
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 })
    await page.goto(fileUrl, { waitUntil: 'networkidle0' })
    await page.evaluate(() => document.fonts?.ready)
    await waitForImages(page)

    const outPath = path.join(outDir, `${pageDef.name}-${vp.suffix}.png`)
    await page.screenshot({ path: outPath, fullPage: true })
    console.log(`Saved ${outPath}`)
    await page.close()
  }
}

await browser.close()
console.log(`\nDone — ${pages.length * viewports.length} screenshots in mock-screenshots/`)
