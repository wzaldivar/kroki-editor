import { describe, expect, it } from 'vitest'
import { buildEditableHash, buildImageUrl, parseEditableHash } from '@/lib/diagramUrl'

describe('diagramUrl', () => {
  it('builds an image url and strips trailing slash from endpoint', () => {
    expect(buildImageUrl('https://k.io/', 'plantuml', 'svg', 'ENC'))
      .toBe('https://k.io/plantuml/svg/ENC')
  })

  it('resolves a relative endpoint against the page', () => {
    expect(buildImageUrl('kroki-render', 'plantuml', 'svg', 'ENC', 'http://vader.lan/kroki/'))
      .toBe('http://vader.lan/kroki/kroki-render/plantuml/svg/ENC')
    expect(buildImageUrl('/kroki-render/', 'plantuml', 'svg', 'ENC', 'http://h/app/'))
      .toBe('http://h/kroki-render/plantuml/svg/ENC')
  })

  it('keeps an absolute endpoint as is', () => {
    expect(buildImageUrl('https://k.io', 'plantuml', 'svg', 'ENC', 'http://h/app/'))
      .toBe('https://k.io/plantuml/svg/ENC')
  })

  it('builds an editable hash', () => {
    expect(buildEditableHash('mermaid', 'ENC')).toBe('#mermaid/ENC')
  })

  it('parses an editable hash', () => {
    expect(parseEditableHash('#mermaid/ENC')).toEqual({ type: 'mermaid', encoded: 'ENC' })
  })

  it('parses a hash whose encoded part contains slashes', () => {
    expect(parseEditableHash('#plantuml/AA/BB')).toEqual({ type: 'plantuml', encoded: 'AA/BB' })
  })

  it('returns null for malformed hash', () => {
    expect(parseEditableHash('#')).toBeNull()
    expect(parseEditableHash('#nostype')).toBeNull()
    expect(parseEditableHash('')).toBeNull()
  })
})
