const USER_KEY = 'math_planet_user_v1'

function safeParse(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback
  } catch {
    return fallback
  }
}

export function loadUser() {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem(USER_KEY), null)
}

export function saveUser(user) {
  if (typeof window === 'undefined') return
  if (!user) {
    window.localStorage.removeItem(USER_KEY)
    return
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}
