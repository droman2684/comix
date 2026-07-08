import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { seriesColor, scanLibrary } from '../../src/main/library'

const dirsToClean: string[] = []

function makeLibrary(structure: Record<string, string[]>): string {
  const root = mkdtempSync(join(tmpdir(), 'comics-test-'))
  dirsToClean.push(root)
  for (const [seriesName, files] of Object.entries(structure)) {
    const seriesPath = join(root, seriesName)
    mkdirSync(seriesPath, { recursive: true })
    for (const file of files) {
      writeFileSync(join(seriesPath, file), '')
    }
  }
  return root
}

afterEach(() => {
  while (dirsToClean.length) {
    const dir = dirsToClean.pop()
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
})

describe('seriesColor', () => {
  it('is deterministic for the same name', () => {
    expect(seriesColor('Saga')).toBe(seriesColor('Saga'))
  })

  it('returns one of the documented palette colors', () => {
    const COLORS = [
      '#4A9BE8', '#E8943A', '#48B87A', '#5A8FD4', '#8B5CF6', '#E05C5C',
      '#06B6D4', '#D97706', '#84CC16', '#F43F5E', '#A855F7', '#14B8A6'
    ]
    expect(COLORS).toContain(seriesColor('The Walking Dead'))
  })
})

describe('scanLibrary', () => {
  it('treats each top-level subfolder as a series and only counts .cbz/.cbr files', () => {
    const root = makeLibrary({
      Saga: ['Saga #001.cbz', 'Saga #002.cbz', 'notes.txt'],
      'The Walking Dead': ['TWD #001.cbr']
    })
    const library = scanLibrary(root)
    expect(library.map((s) => s.name)).toEqual(['Saga', 'The Walking Dead'])
    expect(library[0].issues).toHaveLength(2)
    expect(library[1].issues[0].isCBR).toBe(true)
  })

  it('sorts issues in natural (numeric) order, not lexicographic order', () => {
    const root = makeLibrary({
      Saga: ['Saga #2.cbz', 'Saga #10.cbz', 'Saga #1.cbz']
    })
    const library = scanLibrary(root)
    expect(library[0].issues.map((i) => i.name)).toEqual([
      'Saga #1.cbz',
      'Saga #2.cbz',
      'Saga #10.cbz'
    ])
  })

  it('builds the issue key as "SeriesName:::filename.ext"', () => {
    const root = makeLibrary({ Saga: ['Saga #001.cbz'] })
    const library = scanLibrary(root)
    expect(library[0].issues[0].key).toBe('Saga:::Saga #001.cbz')
  })

  it('skips series folders that contain no readable comic files', () => {
    const root = makeLibrary({ Empty: ['cover.jpg'], Saga: ['Saga #001.cbz'] })
    const library = scanLibrary(root)
    expect(library.map((s) => s.name)).toEqual(['Saga'])
  })
})
