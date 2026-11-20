function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '')
}

// A relative endpoint (e.g. `kroki-render` behind a path-prefixed proxy) is resolved against
// the page, so the URL still works once copied out of the editor.
export function buildImageUrl(
  endpoint: string,
  type: string,
  format: string,
  encoded: string,
  base: string | undefined = globalThis.document?.baseURI,
): string {
  const root = base ? new URL(endpoint, base).href : endpoint
  return `${stripTrailingSlash(root)}/${type}/${format}/${encoded}`
}

export function buildEditableHash(type: string, encoded: string): string {
  return `#${type}/${encoded}`
}

export function parseEditableHash(hash: string): { type: string, encoded: string } | null {
  const h = hash.replace(/^#/, '')
  const idx = h.indexOf('/')
  if (idx <= 0 || idx === h.length - 1)
    return null
  return { type: h.slice(0, idx), encoded: h.slice(idx + 1) }
}
