require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { Resend } = require('resend')

let Pool = null
try {
  ;({ Pool } = require('pg'))
} catch {
  Pool = null
}

const app = express()
const port = Number(process.env.PORT || 3001)
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me'
const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173'
const appOrigins = appOrigin
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
const resendKey = process.env.RESEND_API_KEY || ''
const mailFrom = process.env.MAIL_FROM || ''
const databaseUrl = process.env.DATABASE_URL || ''

const dataDir = path.join(__dirname, 'data')
const usersFile = path.join(dataDir, 'users.json')
const resetFile = path.join(dataDir, 'password_resets.json')
const attemptsFile = path.join(dataDir, 'attempts.json')

const storageMode = databaseUrl && Pool ? 'postgresql' : 'json-file'
const pool = storageMode === 'postgresql' ? new Pool({ connectionString: databaseUrl }) : null
const resend = resendKey ? new Resend(resendKey) : null

function ensureLocalStorage() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8')
  if (!fs.existsSync(resetFile)) fs.writeFileSync(resetFile, '[]', 'utf8')
  if (!fs.existsSync(attemptsFile)) fs.writeFileSync(attemptsFile, '[]', 'utf8')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8')
}

async function initPostgres() {
  if (!pool) return

  async function getColumnType(tableName, columnName) {
    const { rows } = await pool.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name=$2
       LIMIT 1`,
      [tableName, columnName],
    )
    return rows[0]?.data_type || null
  }

  async function ensureBigintTimeColumn(tableName, columnName) {
    const dataType = await getColumnType(tableName, columnName)
    if (!dataType || dataType === 'bigint') return

    if (dataType === 'timestamp without time zone' || dataType === 'timestamp with time zone' || dataType === 'date') {
      await pool.query(
        `ALTER TABLE ${tableName}
         ALTER COLUMN ${columnName} TYPE BIGINT
         USING (
           CASE
             WHEN ${columnName} IS NULL THEN NULL
             ELSE (EXTRACT(EPOCH FROM ${columnName}) * 1000)::BIGINT
           END
         )`,
      )
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT
    );
  `)
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS id TEXT;')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at BIGINT;')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at BIGINT;')
  await pool.query('ALTER TABLE users ALTER COLUMN updated_at DROP NOT NULL;')
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      used_at BIGINT
    );
  `)
  await pool.query('ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS user_id TEXT;')
  await pool.query('ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS email TEXT;')
  await pool.query('ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS token TEXT;')
  await pool.query('ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS used BOOLEAN NOT NULL DEFAULT FALSE;')
  await pool.query('ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS expires_at BIGINT;')
  await pool.query('ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS created_at BIGINT;')
  await pool.query('ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS used_at BIGINT;')
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_password_resets_token_unique ON password_resets(token);')
  await ensureBigintTimeColumn('password_resets', 'expires_at')
  await ensureBigintTimeColumn('password_resets', 'created_at')
  await ensureBigintTimeColumn('password_resets', 'used_at')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      textbook_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      correct BOOLEAN NOT NULL,
      selected TEXT,
      answer TEXT,
      difficulty TEXT,
      ts BIGINT NOT NULL,
      created_at BIGINT NOT NULL
    );
  `)
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS user_id TEXT;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS question_id TEXT;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS textbook_id TEXT;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS chapter_id TEXT;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS correct BOOLEAN NOT NULL DEFAULT FALSE;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS selected TEXT;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS answer TEXT;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS difficulty TEXT;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS ts BIGINT;')
  await pool.query('ALTER TABLE attempts ADD COLUMN IF NOT EXISTS created_at BIGINT;')
  await ensureBigintTimeColumn('attempts', 'ts')
  await ensureBigintTimeColumn('attempts', 'created_at')

  await ensureBigintTimeColumn('users', 'created_at')
  await ensureBigintTimeColumn('users', 'updated_at')

  await pool.query('CREATE INDEX IF NOT EXISTS idx_attempts_user_ts ON attempts(user_id, ts DESC);')
}

function signToken(user) {
  return jwt.sign({ uid: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' })
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
  }
}

function normalizeUserRow(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash || row.passwordHash,
    displayName: row.display_name || row.displayName || '学员',
    createdAt: Number(row.created_at || row.createdAt || Date.now()),
    updatedAt: row.updated_at || row.updatedAt ? Number(row.updated_at || row.updatedAt) : undefined,
  }
}

async function getUserByEmail(email) {
  const normalizedEmail = String(email).trim().toLowerCase()

  if (storageMode === 'postgresql') {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1 LIMIT 1', [normalizedEmail])
    return normalizeUserRow(rows[0])
  }

  const users = readJson(usersFile)
  return normalizeUserRow(users.find((u) => u.email === normalizedEmail))
}

async function getUserById(id) {
  if (storageMode === 'postgresql') {
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [id])
    return normalizeUserRow(rows[0])
  }

  const users = readJson(usersFile)
  return normalizeUserRow(users.find((u) => u.id === id))
}

async function createUser({ email, passwordHash, displayName }) {
  const user = {
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: String(email).trim().toLowerCase(),
    passwordHash,
    displayName: displayName || '学员',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  if (storageMode === 'postgresql') {
    await pool.query(
      `INSERT INTO users(id, email, password_hash, display_name, created_at, updated_at)
       VALUES($1, $2, $3, $4, $5, $6)`,
      [user.id, user.email, user.passwordHash, user.displayName, user.createdAt, user.updatedAt],
    )
    return user
  }

  const users = readJson(usersFile)
  users.push(user)
  writeJson(usersFile, users)
  return user
}

async function updateUserPassword(userId, passwordHash) {
  const now = Date.now()

  if (storageMode === 'postgresql') {
    await pool.query('UPDATE users SET password_hash=$1, updated_at=$2 WHERE id=$3', [passwordHash, now, userId])
    return
  }

  const users = readJson(usersFile)
  const target = users.find((u) => u.id === userId)
  if (!target) return
  target.passwordHash = passwordHash
  target.updatedAt = now
  writeJson(usersFile, users)
}

async function listActiveResets() {
  const now = Date.now()
  if (storageMode === 'postgresql') {
    const { rows } = await pool.query(
      'SELECT * FROM password_resets WHERE used=FALSE AND expires_at > $1 ORDER BY created_at DESC',
      [now],
    )
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      token: row.token,
      used: row.used,
      expiresAt: Number(row.expires_at),
      createdAt: Number(row.created_at),
      usedAt: row.used_at ? Number(row.used_at) : undefined,
    }))
  }

  return readJson(resetFile).filter((item) => item.expiresAt > now && !item.used)
}

async function saveResetItem(item) {
  if (storageMode === 'postgresql') {
    await pool.query(
      `INSERT INTO password_resets(id, user_id, email, token, used, expires_at, created_at, used_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         user_id=EXCLUDED.user_id,
         email=EXCLUDED.email,
         token=EXCLUDED.token,
         used=EXCLUDED.used,
         expires_at=EXCLUDED.expires_at,
         created_at=EXCLUDED.created_at,
         used_at=EXCLUDED.used_at`,
      [
        item.id,
        item.userId,
        item.email,
        item.token,
        item.used,
        item.expiresAt,
        item.createdAt,
        item.usedAt || null,
      ],
    )
    return
  }

  const items = readJson(resetFile)
  const idx = items.findIndex((x) => x.id === item.id)
  if (idx >= 0) items[idx] = item
  else items.push(item)
  writeJson(resetFile, items)
}

async function findResetByToken(token) {
  if (storageMode === 'postgresql') {
    const { rows } = await pool.query('SELECT * FROM password_resets WHERE token=$1 LIMIT 1', [token])
    const row = rows[0]
    if (!row) return null
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      token: row.token,
      used: row.used,
      expiresAt: Number(row.expires_at),
      createdAt: Number(row.created_at),
      usedAt: row.used_at ? Number(row.used_at) : undefined,
    }
  }

  const items = readJson(resetFile)
  return items.find((item) => item.token === token) || null
}

async function markResetUsed(token) {
  const usedAt = Date.now()

  if (storageMode === 'postgresql') {
    await pool.query('UPDATE password_resets SET used=TRUE, used_at=$1 WHERE token=$2', [usedAt, token])
    return
  }

  const items = readJson(resetFile)
  const target = items.find((item) => item.token === token)
  if (!target) return
  target.used = true
  target.usedAt = usedAt
  writeJson(resetFile, items)
}

function normalizeAttemptRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    questionId: row.question_id || row.questionId,
    textbookId: row.textbook_id || row.textbookId,
    chapterId: row.chapter_id || row.chapterId,
    correct: typeof row.correct === 'boolean' ? row.correct : Boolean(row.correct),
    selected: row.selected ?? null,
    answer: row.answer ?? null,
    difficulty: row.difficulty ?? null,
    ts: Number(row.ts),
  }
}

async function listAttemptsByUser(userId) {
  if (storageMode === 'postgresql') {
    const { rows } = await pool.query('SELECT * FROM attempts WHERE user_id=$1 ORDER BY ts ASC', [userId])
    return rows.map(normalizeAttemptRow)
  }

  return readJson(attemptsFile)
    .filter((item) => item.userId === userId)
    .sort((a, b) => Number(a.ts) - Number(b.ts))
}

async function createAttempt(payload) {
  const now = Date.now()
  const attempt = {
    id: `a-${now}-${Math.random().toString(36).slice(2, 8)}`,
    userId: payload.userId,
    questionId: payload.questionId,
    textbookId: payload.textbookId,
    chapterId: payload.chapterId,
    correct: Boolean(payload.correct),
    selected: payload.selected == null ? null : String(payload.selected),
    answer: payload.answer == null ? null : String(payload.answer),
    difficulty: payload.difficulty == null ? null : String(payload.difficulty),
    ts: Number(payload.ts || now),
    createdAt: now,
  }

  if (storageMode === 'postgresql') {
    await pool.query(
      `INSERT INTO attempts(id, user_id, question_id, textbook_id, chapter_id, correct, selected, answer, difficulty, ts, created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        attempt.id,
        attempt.userId,
        attempt.questionId,
        attempt.textbookId,
        attempt.chapterId,
        attempt.correct,
        attempt.selected,
        attempt.answer,
        attempt.difficulty,
        attempt.ts,
        attempt.createdAt,
      ],
    )
    return normalizeAttemptRow(attempt)
  }

  const items = readJson(attemptsFile)
  items.push(attempt)
  writeJson(attemptsFile, items)
  return normalizeAttemptRow(attempt)
}

function safeOrigin(origin) {
  const value = String(origin || '').trim()
  if (/^https?:\/\//i.test(value) && appOrigins.includes(value.replace(/\/$/, ''))) {
    return value.replace(/\/$/, '')
  }
  return appOrigins[0] || 'http://localhost:5173'
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    return res.status(401).json({ ok: false, message: '未登录或 token 缺失' })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.auth = decoded
    return next()
  } catch {
    return res.status(401).json({ ok: false, message: '登录状态已失效，请重新登录' })
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || appOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('cors_origin_not_allowed'))
    },
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: storageMode, auth: 'jwt', mail: resend ? 'resend' : 'disabled' })
})

app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: '缺少必填字段' })
  }

  const existed = await getUserByEmail(email)
  if (existed) {
    return res.status(409).json({ message: '该邮箱已注册' })
  }

  const passwordHash = await bcrypt.hash(String(password), 10)
  const user = await createUser({ email, passwordHash, displayName })

  const token = signToken(user)
  return res.json({ ok: true, token, user: toPublicUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: '请输入邮箱和密码' })
  }

  const user = await getUserByEmail(email)
  if (!user) return res.status(401).json({ message: '邮箱或密码错误' })

  const ok = await bcrypt.compare(String(password), user.passwordHash)
  if (!ok) return res.status(401).json({ message: '邮箱或密码错误' })

  const token = signToken(user)
  return res.json({ ok: true, token, user: toPublicUser(user) })
})

app.post('/api/auth/password/request', async (req, res) => {
  const { email, origin } = req.body || {}
  const message = '如果邮箱已注册，我们会发送一封密码重置邮件。'
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return res.json({ ok: true, message })

  const user = await getUserByEmail(normalizedEmail)
  if (!user) return res.json({ ok: true, message })

  const token = crypto.randomBytes(24).toString('hex')
  const resetItem = {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    email: user.email,
    token,
    used: false,
    expiresAt: Date.now() + 30 * 60 * 1000,
    createdAt: Date.now(),
  }

  await saveResetItem(resetItem)

  const resetLink = `${safeOrigin(origin)}/?reset_token=${encodeURIComponent(token)}`

  if (resend && mailFrom) {
    try {
      await resend.emails.send({
        from: mailFrom,
        to: [user.email],
        subject: '【数学星球】密码重置链接',
        text: `请在 30 分钟内打开以下链接重置密码：\n${resetLink}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h3>密码重置</h3><p>请在 30 分钟内点击以下链接重置密码：</p><p><a href="${resetLink}">${resetLink}</a></p></div>`,
      })
    } catch (error) {
      return res.status(500).json({ ok: false, message: `邮件发送失败：${error.message}` })
    }
  } else {
    console.log('[auth] resend 未配置，重置链接：', resetLink)
  }

  return res.json({ ok: true, message })
})

app.post('/api/auth/password/reset', async (req, res) => {
  const { token, newPassword } = req.body || {}
  if (!token || !newPassword) {
    return res.status(400).json({ ok: false, message: '缺少 token 或新密码' })
  }

  const target = await findResetByToken(token)
  if (!target || target.used || target.expiresAt < Date.now()) {
    return res.status(400).json({ ok: false, message: '重置链接无效或已过期' })
  }

  const user = await getUserById(target.userId)
  if (!user) {
    return res.status(400).json({ ok: false, message: '用户不存在' })
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 10)
  await updateUserPassword(user.id, passwordHash)
  await markResetUsed(token)

  return res.json({ ok: true, message: '密码已重置，请使用新密码登录' })
})

app.get('/api/attempts', authRequired, async (req, res) => {
  const userId = req.auth.uid
  const attempts = await listAttemptsByUser(userId)
  res.json({ ok: true, attempts })
})

app.post('/api/attempts', authRequired, async (req, res) => {
  const { questionId, textbookId, chapterId, correct, selected, answer, difficulty, ts } = req.body || {}
  if (!questionId || !textbookId || !chapterId) {
    return res.status(400).json({ ok: false, message: '缺少做题记录字段' })
  }

  const attempt = await createAttempt({
    userId: req.auth.uid,
    questionId,
    textbookId,
    chapterId,
    correct,
    selected,
    answer,
    difficulty,
    ts,
  })

  res.json({ ok: true, attempt })
})

async function bootstrap() {
  if (storageMode === 'json-file') ensureLocalStorage()
  if (storageMode === 'postgresql') await initPostgres()

  app.listen(port, () => {
    console.log(`Auth server listening on http://localhost:${port}`)
    console.log(`Storage mode: ${storageMode}`)
  })
}

bootstrap().catch((error) => {
  console.error('[bootstrap] failed:', error)
  process.exit(1)
})
