import { hasRemoteApi, requestJson } from './apiClient'

const SESSION_KEY = 'math_planet_session_v1'
const USERS_KEY = 'math_planet_users_v1'

function safeParse(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback
  } catch {
    return fallback
  }
}

function getUsers() {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(USERS_KEY), [])
}

function setUsers(users) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function persistSession(session) {
  if (typeof window === 'undefined') return
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY)
    return
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession() {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem(SESSION_KEY), null)
}

export function clearSession() {
  persistSession(null)
}

function toSessionUser(payload) {
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name || payload.displayName || payload.email,
  }
}

function localRegister(payload) {
  const users = getUsers()
  if (users.some((u) => u.email === payload.email)) {
    throw new Error('该邮箱已注册，请直接登录')
  }

  const user = {
    id: `u-${Date.now()}`,
    email: payload.email,
    password: payload.password,
    displayName: payload.displayName || '学员',
  }
  users.push(user)
  setUsers(users)
  const session = { user: toSessionUser(user), token: `local-${user.id}` }
  persistSession(session)
  return session
}

function localLogin(payload) {
  const user = getUsers().find((u) => u.email === payload.email && u.password === payload.password)
  if (!user) throw new Error('邮箱或密码错误')
  const session = { user: toSessionUser(user), token: `local-${user.id}` }
  persistSession(session)
  return session
}

export async function registerWithEmail(payload) {
  if (hasRemoteApi()) {
    const data = await requestJson('/api/auth/register', { payload })
    const session = { user: toSessionUser(data.user), token: data.token }
    persistSession(session)
    return session
  }
  return localRegister(payload)
}

export async function loginWithEmail(payload) {
  if (hasRemoteApi()) {
    const data = await requestJson('/api/auth/login', { payload })
    const session = { user: toSessionUser(data.user), token: data.token }
    persistSession(session)
    return session
  }
  return localLogin(payload)
}

export async function requestPasswordReset(email) {
  if (hasRemoteApi()) {
    return requestJson('/api/auth/password/request', {
      payload: {
        email,
        origin: window.location.origin,
      },
    })
  }
  throw new Error('当前为本地模式，无法发送邮件，请配置后端 API。')
}

export async function resetPasswordByToken(token, newPassword) {
  if (hasRemoteApi()) {
    return requestJson('/api/auth/password/reset', {
      payload: {
        token,
        newPassword,
      },
    })
  }
  throw new Error('当前为本地模式，无法重置密码，请配置后端 API。')
}
