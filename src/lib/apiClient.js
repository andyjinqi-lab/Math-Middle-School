const API_BASES = [
  import.meta.env.VITE_API_BASE_URL?.trim(),
  import.meta.env.VITE_API_BACKUP_BASE_URL?.trim(),
].filter(Boolean)

const REQUEST_TIMEOUT_MS = 12000

export function hasRemoteApi() {
  return API_BASES.length > 0
}

export async function requestJson(path, { method = 'POST', payload, token } = {}) {
  let lastError = null

  for (let i = 0; i < API_BASES.length; i += 1) {
    const base = API_BASES[i]
    const isLast = i === API_BASES.length - 1

    try {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      const res = await fetch(`${base}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(method === 'GET' ? {} : { body: JSON.stringify(payload ?? {}) }),
        signal: controller.signal,
      })

      window.clearTimeout(timeoutId)
      const data = await res.json().catch(() => ({}))

      // Show 4xx business errors immediately; only try backup API for server-side failures.
      if (!res.ok || data?.ok === false) {
        if (res.status >= 500 && !isLast) continue
        throw new Error(data.message || '请求失败，请稍后再试')
      }

      return data
    } catch (error) {
      lastError = error?.name === 'AbortError' ? new Error('网络请求超时，请检查网络后重试') : error
      if (isLast) break
    }
  }

  throw new Error(lastError?.message || '请求失败，请稍后再试')
}
