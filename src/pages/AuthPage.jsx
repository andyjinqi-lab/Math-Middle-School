import { useEffect, useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

function getResetTokenFromUrl() {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  return params.get('reset_token') || ''
}

export default function AuthPage({ onAuthSubmit, onRequestReset, onResetByToken, loading, errorMsg }) {
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    resetPassword: '',
    resetConfirmPassword: '',
  })

  const tokenInUrl = useMemo(() => getResetTokenFromUrl(), [])

  useEffect(() => {
    if (tokenInUrl) setMode('reset')
  }, [tokenInUrl])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAuthSubmit() {
    if (!form.email || !form.password) return
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setMessage('两次密码不一致，请检查。')
      return
    }

    setMessage('')
    await onAuthSubmit({
      mode,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      displayName: form.displayName.trim(),
    })
  }

  async function handleRequestReset() {
    if (!form.email) {
      setMessage('请先输入注册邮箱。')
      return
    }
    setMessage('')
    const result = await onRequestReset(form.email.trim().toLowerCase())
    if (result?.message) setMessage(result.message)
  }

  async function handleResetByToken() {
    if (!tokenInUrl) {
      setMessage('重置链接无效。')
      return
    }
    if (!form.resetPassword || form.resetPassword !== form.resetConfirmPassword) {
      setMessage('两次新密码不一致，请检查。')
      return
    }

    setMessage('')
    const result = await onResetByToken(tokenInUrl, form.resetPassword)
    if (result?.message) {
      setMessage(result.message)
      setMode('login')
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('reset_token')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-10">
      <Card className="math-grid overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 p-8">
        <p className="text-sm text-textSub">欢迎来到数学星球</p>
        <h1 className="mt-2 text-3xl font-bold text-textMain">邮箱注册/登录后开始学习</h1>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === 'login' ? 'bg-primary text-white' : 'bg-white text-textSub'
            }`}
          >
            邮箱登录
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === 'register' ? 'bg-primary text-white' : 'bg-white text-textSub'
            }`}
          >
            邮箱注册
          </button>
          <button
            type="button"
            onClick={() => setMode('forgot')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === 'forgot' ? 'bg-primary text-white' : 'bg-white text-textSub'
            }`}
          >
            忘了密码
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mode !== 'reset' ? (
            <label className="text-sm text-textSub md:col-span-2">
              邮箱
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="例如：student@demo.com"
                className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
              />
            </label>
          ) : null}

          {mode === 'login' || mode === 'register' ? (
            <label className="text-sm text-textSub md:col-span-2">
              密码
              <input
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder="请输入密码"
                className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
              />
            </label>
          ) : null}

          {mode === 'register' ? (
            <>
              <label className="text-sm text-textSub md:col-span-2">
                确认密码
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  placeholder="请再次输入密码"
                  className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
                />
              </label>
              <label className="text-sm text-textSub md:col-span-2">
                昵称（可选）
                <input
                  value={form.displayName}
                  onChange={(e) => setField('displayName', e.target.value)}
                  placeholder="例如：小明"
                  className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
                />
              </label>
            </>
          ) : null}

          {mode === 'reset' ? (
            <>
              <label className="text-sm text-textSub md:col-span-2">
                新密码
                <input
                  type="password"
                  value={form.resetPassword}
                  onChange={(e) => setField('resetPassword', e.target.value)}
                  placeholder="请输入新密码"
                  className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
                />
              </label>
              <label className="text-sm text-textSub md:col-span-2">
                确认新密码
                <input
                  type="password"
                  value={form.resetConfirmPassword}
                  onChange={(e) => setField('resetConfirmPassword', e.target.value)}
                  placeholder="请再次输入新密码"
                  className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
                />
              </label>
            </>
          ) : null}
        </div>

        {(errorMsg || message) ? (
          <p className={`mt-4 text-sm ${errorMsg ? 'text-error' : 'text-textSub'}`}>{errorMsg || message}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {(mode === 'login' || mode === 'register') ? (
            <Button onClick={handleAuthSubmit} className="disabled:opacity-60" disabled={loading}>
              {loading ? '处理中...' : mode === 'register' ? '注册并进入' : '登录进入'}
            </Button>
          ) : null}

          {mode === 'forgot' ? (
            <Button onClick={handleRequestReset} className="disabled:opacity-60" disabled={loading}>
              {loading ? '发送中...' : '发送重置链接'}
            </Button>
          ) : null}

          {mode === 'reset' ? (
            <Button onClick={handleResetByToken} className="disabled:opacity-60" disabled={loading}>
              {loading ? '重置中...' : '确认重置密码'}
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
