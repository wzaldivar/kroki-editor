import { afterEach, describe, expect, it, vi } from 'vitest'
import { useClipboard } from '@/composables/useClipboard'

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

describe('useClipboard', () => {
  afterEach(() => {
    setClipboard(undefined)
    vi.restoreAllMocks()
  })

  it('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    const { copied, copy } = useClipboard()
    await copy('http://x/svg/ENC', 'image')
    expect(writeText).toHaveBeenCalledWith('http://x/svg/ENC')
    expect(copied.value).toBe('image')
  })

  it('falls back to execCommand without the Clipboard API (insecure context)', async () => {
    setClipboard(undefined)
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec
    const { copied, copy } = useClipboard()
    await copy('http://x/svg/ENC', 'image')
    expect(exec).toHaveBeenCalledWith('copy')
    expect(copied.value).toBe('image')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('does not flash the hint when copying fails', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn().mockReturnValue(false)
    const { copied, copy } = useClipboard()
    await copy('text', 'image')
    expect(copied.value).toBeNull()
  })
})
