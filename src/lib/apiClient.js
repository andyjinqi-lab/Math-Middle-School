const API_BASES = [
  import.meta.env.VITE_API_BASE_URL?.trim(),
  import.meta.env.VITE_API_BACKUP_BASE_URL?.trim(),
].filter(Boolean)

export function hasRemoteApi() {
  return API_BASES.length > 0
}

export async function requestJson(path, { method = 'POST', payload, token } = {}) {
  let lastError = null

  for (let i = 0; i < API_BASES.length; i += 1) {
    const base = API_BASES[i]
    const isLast = i === API_BASES.length - 1

    try {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(method === 'GET' ? {} : { body: JSON.stringify(payload ?? {}) }),
      })

      const data = await res.json().catch(() => ({}))

      // 4xx 业务错误直接返回，不切备站；5xx 才尝试备站。
      if (!res.ok || data?.ok === false) {
        if (res.status >= 500 && !isLast) continue
        throw new Error(data.message || '请求失败')
      }

      return data
    } catch (error) {
      lastError = error
      if (isLast) break
    }
  }

  throw new Error(lastError?.message || '请求失败')
}

