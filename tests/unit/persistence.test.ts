import { describe, it, expect } from 'vitest'
import { normalize, type PersistedData } from '../../src/main/persistence'

function baseData(overrides: Partial<PersistedData> = {}): PersistedData {
  return {
    version: 1,
    rootPath: null,
    readStatus: {},
    lastRead: null,
    windowBounds: null,
    favorites: {},
    libraryViewMode: 'grid',
    seriesViewMode: 'list',
    importedSeries: {},
    ...overrides
  }
}

describe('normalize', () => {
  it('passes through a well-formed readStatus entry unchanged', () => {
    const data = baseData({ readStatus: { 'Saga:::Saga #001.cbz': { read: true, page: 8, total: 8 } } })
    expect(normalize(data).readStatus['Saga:::Saga #001.cbz']).toEqual({ read: true, page: 8, total: 8 })
  })

  it('coerces a malformed readStatus entry instead of crashing', () => {
    const data = baseData({ readStatus: { key: { read: 'yes', page: 'three' } as never } })
    expect(normalize(data).readStatus.key).toEqual({ read: true, page: 0, total: 0 })
  })

  it('drops a non-object readStatus entry', () => {
    const data = baseData({ readStatus: { key: 'garbage' as never } })
    expect(normalize(data).readStatus.key).toBeUndefined()
  })

  it('passes through a well-formed lastRead', () => {
    const lastRead = { issueKey: 'k', seriesName: 'Saga', issueName: 'Saga #1', page: 3, total: 8 }
    expect(normalize(baseData({ lastRead })).lastRead).toEqual(lastRead)
  })

  it('coerces a malformed lastRead to null', () => {
    expect(normalize(baseData({ lastRead: { issueKey: 'k' } as never })).lastRead).toBeNull()
  })

  it('passes through well-formed windowBounds', () => {
    const data = baseData({ windowBounds: { x: 10, y: 20, width: 1280, height: 800 } })
    expect(normalize(data).windowBounds).toEqual({ x: 10, y: 20, width: 1280, height: 800 })
  })

  it('coerces malformed windowBounds to null', () => {
    expect(normalize(baseData({ windowBounds: { width: 1280 } as never })).windowBounds).toBeNull()
  })

  it('passes through a well-formed rootPath', () => {
    expect(normalize(baseData({ rootPath: '/Users/me/Comics' })).rootPath).toBe('/Users/me/Comics')
  })

  it('coerces a malformed rootPath to null', () => {
    expect(normalize(baseData({ rootPath: 42 as never })).rootPath).toBeNull()
  })

  it('passes through well-formed favorites', () => {
    const data = baseData({ favorites: { Saga: true } })
    expect(normalize(data).favorites).toEqual({ Saga: true })
  })

  it('drops falsy favorites entries', () => {
    const data = baseData({ favorites: { Saga: true, Elsewhere: false } as never })
    expect(normalize(data).favorites).toEqual({ Saga: true })
  })

  it('defaults libraryViewMode to grid for anything but "list"', () => {
    expect(normalize(baseData({ libraryViewMode: 'nonsense' as never })).libraryViewMode).toBe(
      'grid'
    )
    expect(normalize(baseData({ libraryViewMode: 'list' })).libraryViewMode).toBe('list')
  })

  it('defaults seriesViewMode to list for anything but "card"', () => {
    expect(normalize(baseData({ seriesViewMode: 'nonsense' as never })).seriesViewMode).toBe(
      'list'
    )
    expect(normalize(baseData({ seriesViewMode: 'card' })).seriesViewMode).toBe('card')
  })

  it('passes through well-formed importedSeries and drops falsy entries', () => {
    const data = baseData({ importedSeries: { Saga: true, Elsewhere: false } as never })
    expect(normalize(data).importedSeries).toEqual({ Saga: true })
  })
})
