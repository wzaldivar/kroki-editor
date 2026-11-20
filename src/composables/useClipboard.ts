import { ref } from 'vue'

/**
 * Copy through a hidden textarea and `execCommand('copy')`. Deprecated, but it is the
 * only way to copy on a plain-HTTP page, where `navigator.clipboard` does not exist.
 */
function legacyCopy(text: string): boolean {
  const active = document.activeElement as HTMLElement | null
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  }
  catch {
    ok = false
  }
  area.remove()
  active?.focus()
  return ok
}

/**
 * Copy text to the clipboard and track which item was just copied so the UI can
 * show a transient "Copied!" hint. `copied` holds the last key (defaults to the
 * copied text) and resets after `resetMs`; it is only set when the copy succeeded.
 */
export function useClipboard(resetMs = 1500) {
  const copied = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(text: string, key: string = text) {
    let ok = false
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        ok = true
      }
      catch {
        ok = legacyCopy(text)
      }
    }
    else {
      // Insecure context (e.g. http://host.lan): run the fallback synchronously so it
      // still counts as part of the click.
      ok = legacyCopy(text)
    }
    if (!ok)
      return
    copied.value = key
    clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = null
    }, resetMs)
  }

  return { copied, copy }
}
