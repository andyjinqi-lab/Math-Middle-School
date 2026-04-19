import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const client = url && anonKey ? createClient(url, anonKey) : null

export function isCloudEnabled() {
  return Boolean(client)
}

export async function pullAttemptsFromCloud(userId) {
  if (!client) throw new Error('云同步未启用：缺少 Supabase 环境变量')
  const { data, error } = await client
    .from('math_attempts')
    .select('id, ts, question_id, textbook_id, chapter_id, correct, selected, answer, difficulty')
    .eq('user_id', userId)
    .order('ts', { ascending: true })

  if (error) throw error

  return (data ?? []).map((item) => ({
    id: item.id,
    ts: item.ts,
    questionId: item.question_id,
    textbookId: item.textbook_id,
    chapterId: item.chapter_id,
    correct: item.correct,
    selected: item.selected,
    answer: item.answer,
    difficulty: item.difficulty,
  }))
}

export async function pushAttemptsToCloud(userId, attempts) {
  if (!client) throw new Error('云同步未启用：缺少 Supabase 环境变量')
  const payload = attempts.map((item) => ({
    id: item.id,
    user_id: userId,
    ts: item.ts,
    question_id: item.questionId,
    textbook_id: item.textbookId,
    chapter_id: item.chapterId,
    correct: item.correct,
    selected: item.selected,
    answer: item.answer,
    difficulty: item.difficulty,
  }))

  const { error } = await client.from('math_attempts').upsert(payload, { onConflict: 'id' })
  if (error) throw error
  return payload.length
}
