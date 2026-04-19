import { hasRemoteApi, requestJson } from './apiClient'

const ATTEMPTS_KEY = 'math_planet_attempts_v1'

export function loadAttempts() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(ATTEMPTS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAttempts(attempts) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
}

function createLocalAttempt(payload) {
  return {
    id: `${payload.questionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    ...payload,
  }
}

export function appendAttempt(attempts, payload) {
  const next = [...attempts, createLocalAttempt(payload)]
  saveAttempts(next)
  return next
}

export async function loadAttemptsForUser({ userId, token }) {
  if (hasRemoteApi() && token) {
    const data = await requestJson('/api/attempts', {
      method: 'GET',
      token,
    })
    return Array.isArray(data.attempts) ? data.attempts : []
  }

  return loadAttempts().filter((item) => item.userId === userId)
}

export async function saveAttemptForUser({ payload, userId, token }) {
  if (hasRemoteApi() && token) {
    const data = await requestJson('/api/attempts', {
      method: 'POST',
      token,
      payload,
    })
    return data.attempt
  }

  const all = loadAttempts()
  const attempt = createLocalAttempt({ ...payload, userId })
  saveAttempts([...all, attempt])
  return attempt
}

export function calcTrend(attempts, days = 7) {
  const result = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000
    const dayAttempts = attempts.filter((item) => item.ts >= dayStart && item.ts < dayEnd)
    const total = dayAttempts.length
    const correct = dayAttempts.filter((item) => item.correct).length
    result.push({
      day: `${d.getMonth() + 1}/${d.getDate()}`,
      count: total,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
    })
  }
  return result
}

export function calcSummary(attempts) {
  const total = attempts.length
  const correct = attempts.filter((item) => item.correct).length
  const accuracy = total ? Math.round((correct / total) * 100) : 0
  const energy = correct * 5
  return { total, correct, accuracy, energy }
}

export function calcChapterStats(textbooks, questions, attempts) {
  const chapterMap = new Map()
  textbooks.forEach((book) => {
    book.chapters.forEach((chapter) => {
      chapterMap.set(chapter.id, {
        id: chapter.id,
        textbookId: book.id,
        title: chapter.name,
        done: 0,
        correct: 0,
        totalQuestionCount: questions.filter((q) => q.chapterId === chapter.id).length,
      })
    })
  })

  attempts.forEach((attempt) => {
    const chapter = chapterMap.get(attempt.chapterId)
    if (!chapter) return
    chapter.done += 1
    if (attempt.correct) chapter.correct += 1
  })

  return Array.from(chapterMap.values())
    .filter((item) => item.totalQuestionCount > 0)
    .map((item) => ({
      ...item,
      progress: item.done ? Math.round((item.correct / item.done) * 100) : 0,
      recommendCount: Math.max(0, 8 - item.correct),
    }))
}

export function calcWrongQuestions(questions, attempts) {
  const wrongAttempts = attempts.filter((item) => !item.correct)
  const byQuestionId = new Map()

  wrongAttempts.forEach((attempt) => {
    const question = questions.find((q) => q.id === attempt.questionId)
    if (!question) return

    const prev = byQuestionId.get(question.id)
    if (!prev) {
      byQuestionId.set(question.id, {
        id: question.id,
        questionId: question.id,
        title: question.stem,
        chapterId: question.chapterId,
        textbookId: question.textbookId,
        count: 1,
        ts: attempt.ts,
      })
      return
    }

    prev.count += 1
    if (attempt.ts > prev.ts) prev.ts = attempt.ts
  })

  return Array.from(byQuestionId.values()).sort((a, b) => b.ts - a.ts)
}

export function pickQuestions({ questions, textbookId, chapterId, difficulty, source, count = 10 }) {
  const filtered = questions.filter((item) => {
    if (textbookId && item.textbookId !== textbookId) return false
    if (chapterId && item.chapterId !== chapterId) return false
    if (difficulty && item.difficulty !== difficulty) return false
    if (source && source !== '全部' && item.source !== source) return false
    return true
  })

  const shuffled = [...filtered].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
