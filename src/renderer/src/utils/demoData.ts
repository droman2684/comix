import type { Series, Issue, ReadStatus, LastRead } from '@shared/types'
import { seriesColor } from './seriesColor'

// "Try Demo" on the Welcome screen (per README section 2) needs sample data
// without any real .cbz files on disk. Demo issue keys are prefixed "DEMO:::"
// so the reader/library layers can special-case them (see readerSlice.openIssue)
// instead of asking the main process to decompress a real archive.
export const DEMO_PREFIX = 'DEMO:::'

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function canvasDataUrl(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): string {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  draw(ctx)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export function generateDemoCover(seriesName: string, issueNum: number, color: string): string {
  const W = 400
  const H = 580
  return canvasDataUrl(W, H, (ctx) => {
    const [r, g, b] = hexToRgb(color)
    const grad = ctx.createLinearGradient(0, 0, W * 0.6, H)
    grad.addColorStop(0, color)
    grad.addColorStop(1, `rgb(${Math.max(r - 70, 0)},${Math.max(g - 70, 0)},${Math.max(b - 70, 0)})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    const dark = ctx.createLinearGradient(0, H * 0.45, 0, H)
    dark.addColorStop(0, 'rgba(0,0,0,0)')
    dark.addColorStop(1, 'rgba(0,0,0,0.72)')
    ctx.fillStyle = dark
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 3
    ctx.strokeRect(10, 10, W - 20, H - 20)
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 10
    const fs = seriesName.length > 14 ? 22 : seriesName.length > 10 ? 26 : 30
    ctx.font = `bold ${fs}px sans-serif`
    ctx.fillStyle = '#fff'
    ctx.fillText(seriesName, W / 2, H - 54)
    ctx.font = '13px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.fillText(`Issue ${issueNum}`, W / 2, H - 28)
    ctx.shadowBlur = 0
  })
}

export function generateDemoPage(
  pageNum: number,
  seriesName: string,
  issueNum: number,
  color: string
): string {
  const W = 800
  const H = 1120
  return canvasDataUrl(W, H, (ctx) => {
    ctx.fillStyle = '#f5f4ee'
    ctx.fillRect(0, 0, W, H)
    const m = 18
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2.5
    ctx.fillStyle = `${color}22`
    ctx.fillRect(m, m, W - m * 2, H - m * 2)
    ctx.strokeRect(m, m, W - m * 2, H - m * 2)

    if (pageNum === 1) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = color
      ctx.font = 'bold 54px sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 8
      ctx.fillText(seriesName, W / 2, H / 2 - 48)
      ctx.shadowBlur = 0
      ctx.fillStyle = '#333'
      ctx.font = '28px sans-serif'
      ctx.fillText(`Issue #${issueNum}`, W / 2, H / 2 + 16)
      ctx.fillStyle = '#aaa'
      ctx.font = '14px sans-serif'
      ctx.fillText('DEMO PREVIEW', W / 2, H / 2 + 64)
    } else {
      ctx.fillStyle = color
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('DEMO PAGE', W / 2, H / 2)
    }

    ctx.fillStyle = '#bbb'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(String(pageNum), W / 2, H - 4)
  })
}

interface DemoSeriesDef {
  name: string
  issues: number
  readCount: number
  inProgressIdx?: number
  inProgressPage?: number
}

const DEMO_SERIES_DEFS: DemoSeriesDef[] = [
  { name: 'Neon City Blues', issues: 6, readCount: 1, inProgressIdx: 2, inProgressPage: 4 },
  { name: 'Starfall', issues: 10, readCount: 4 },
  { name: 'Iron Covenant', issues: 12, readCount: 0 },
  { name: 'The Pale Garden', issues: 4, readCount: 2 }
]

const DEMO_PAGE_TOTAL = 8

export interface DemoLibraryResult {
  library: Series[]
  readStatus: ReadStatus
  lastRead: LastRead | null
  covers: Record<string, string>
}

export function buildDemoLibrary(): DemoLibraryResult {
  const library: Series[] = []
  const readStatus: ReadStatus = {}
  const covers: Record<string, string> = {}
  let lastRead: LastRead | null = null

  for (const def of DEMO_SERIES_DEFS) {
    const color = seriesColor(def.name)
    const issues: Issue[] = []
    for (let i = 1; i <= def.issues; i++) {
      const fname = `${def.name} #${String(i).padStart(3, '0')}.cbz`
      const key = `${DEMO_PREFIX}${def.name}:::${fname}`
      const displayName = `${def.name} #${i}`
      issues.push({ name: fname, displayName, key, isCBR: false })
      covers[key] = generateDemoCover(def.name, i, color)

      if (i <= def.readCount) {
        readStatus[key] = { read: true, page: DEMO_PAGE_TOTAL, total: DEMO_PAGE_TOTAL }
      } else if (def.inProgressIdx && i === def.inProgressIdx) {
        readStatus[key] = { read: false, page: def.inProgressPage ?? 0, total: DEMO_PAGE_TOTAL }
        lastRead = {
          issueKey: key,
          seriesName: def.name,
          issueName: displayName,
          page: def.inProgressPage ?? 0,
          total: DEMO_PAGE_TOTAL
        }
      }
    }
    library.push({ name: def.name, color, issues })
  }

  return { library, readStatus, lastRead, covers }
}

export function demoIssuePages(seriesName: string, issue: Issue, color: string): string[] {
  const issueNum = parseInt(issue.displayName.match(/\d+/)?.[0] ?? '1', 10)
  const pages: string[] = []
  for (let p = 1; p <= DEMO_PAGE_TOTAL; p++) {
    pages.push(generateDemoPage(p, seriesName, issueNum, color))
  }
  return pages
}
