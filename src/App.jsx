import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/layout/Navbar'
import HomePage from './pages/HomePage'
import PracticePage from './pages/PracticePage'
import WrongBookPage from './pages/WrongBookPage'
import GrowthPage from './pages/GrowthPage'
import ParentPage from './pages/ParentPage'
import AuthPage from './pages/AuthPage'
import { curatedQuestions, textbooks } from './data/questionBank'
import {
  calcChapterStats,
  calcSummary,
  calcTrend,
  calcWrongQuestions,
  loadAttemptsForUser,
  saveAttemptForUser,
} from './lib/learningStore'
import { buildGeneratedQuestions, mergeQuestionBank } from './lib/questionGenerator'
import {
  clearSession,
  loadSession,
  loginWithEmail,
  registerWithEmail,
  requestPasswordReset,
  resetPasswordByToken,
} from './lib/authApi'

function App() {
  const [session, setSession] = useState(() => loadSession())
  const [page, setPage] = useState('home')
  const [attempts, setAttempts] = useState([])
  const [attemptError, setAttemptError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const [selection, setSelection] = useState({
    textbookId: textbooks[2]?.id ?? textbooks[0]?.id,
    chapterId: textbooks[2]?.chapters?.[0]?.id ?? textbooks[0]?.chapters?.[0]?.id,
    difficulty: '提升',
    source: '全部',
    questionCount: 10,
  })

  const user = session?.user ?? null

  const generatedQuestions = useMemo(() => buildGeneratedQuestions(textbooks, 100), [])
  const questions = useMemo(
    () => mergeQuestionBank(curatedQuestions, generatedQuestions),
    [generatedQuestions],
  )

  const summary = useMemo(() => calcSummary(attempts), [attempts])
  const trendData = useMemo(() => calcTrend(attempts, 7), [attempts])
  const chapterStatsAll = useMemo(
    () => calcChapterStats(textbooks, questions, attempts),
    [questions, attempts],
  )
  const chapterStatsBySelectedTextbook = useMemo(
    () => chapterStatsAll.filter((item) => item.textbookId === selection.textbookId),
    [chapterStatsAll, selection.textbookId],
  )

  const wrongQuestionsAll = useMemo(() => calcWrongQuestions(questions, attempts), [questions, attempts])
  const wrongQuestionsBySelectedTextbook = useMemo(
    () => wrongQuestionsAll.filter((item) => item.textbookId === selection.textbookId),
    [wrongQuestionsAll, selection.textbookId],
  )

  const chapterNameMap = useMemo(() => {
    const map = {}
    textbooks.forEach((book) => {
      book.chapters.forEach((chapter) => {
        map[chapter.id] = chapter.name
      })
    })
    return map
  }, [])

  const questionMap = useMemo(() => {
    const map = {}
    questions.forEach((item) => {
      map[item.id] = item
    })
    return map
  }, [questions])

  const radarData = useMemo(
    () =>
      chapterStatsBySelectedTextbook.map((item) => ({
        subject: item.title.replace('与', '/'),
        score: item.progress,
      })),
    [chapterStatsBySelectedTextbook],
  )

  useEffect(() => {
    let cancelled = false

    async function hydrateAttempts() {
      if (!user) {
        if (!cancelled) setAttempts([])
        return
      }

      try {
        const list = await loadAttemptsForUser({
          userId: user.id,
          token: session?.token,
        })
        if (!cancelled) {
          setAttempts(Array.isArray(list) ? list : [])
          setAttemptError('')
        }
      } catch (error) {
        if (!cancelled) {
          setAttemptError(error.message || '加载练习记录失败')
        }
      }
    }

    hydrateAttempts()

    return () => {
      cancelled = true
    }
  }, [user?.id, session?.token])

  async function handleAuthSubmit(payload) {
    setAuthLoading(true)
    setAuthError('')
    try {
      const nextSession =
        payload.mode === 'register'
          ? await registerWithEmail(payload)
          : await loginWithEmail(payload)

      setSession(nextSession)
      setPage('home')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleRequestReset(email) {
    setAuthLoading(true)
    setAuthError('')
    try {
      return await requestPasswordReset(email)
    } catch (error) {
      setAuthError(error.message)
      return null
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleResetByToken(token, newPassword) {
    setAuthLoading(true)
    setAuthError('')
    try {
      return await resetPasswordByToken(token, newPassword)
    } catch (error) {
      setAuthError(error.message)
      return null
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    setSession(null)
    setAttempts([])
    clearSession()
  }

  async function handleSubmitAttempt(payload) {
    if (!user) return
    setAttemptError('')
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const optimisticAttempt = {
      id: optimisticId,
      ts: Date.now(),
      ...payload,
      userId: user.id,
    }
    setAttempts((prev) => [...prev, optimisticAttempt])

    try {
      const saved = await saveAttemptForUser({
        payload: {
          ...payload,
          userId: user.id,
        },
        userId: user.id,
        token: session?.token,
      })
      setAttempts((prev) => prev.map((item) => (item.id === optimisticId ? saved : item)))
    } catch (error) {
      setAttempts((prev) => prev.filter((item) => item.id !== optimisticId))
      setAttemptError(error.message || '做题记录保存失败')
    }
  }

  function handlePracticeWrong(item) {
    setSelection((prev) => ({
      ...prev,
      textbookId: item.textbookId,
      chapterId: item.chapterId,
    }))
    setPage('practice')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg/70 px-4 md:px-6">
        <AuthPage
          onAuthSubmit={handleAuthSubmit}
          onRequestReset={handleRequestReset}
          onResetByToken={handleResetByToken}
          loading={authLoading}
          errorMsg={authError}
        />
      </div>
    )
  }

  const withAttemptBanner = (node) => (
    <div className="space-y-3">
      {attemptError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          记录服务提示：{attemptError}
        </div>
      ) : null}
      {node}
    </div>
  )

  const currentPage = (() => {
    if (page === 'parent') {
      return withAttemptBanner(
        <ParentPage
          user={user}
          summary={summary}
          chapterStats={chapterStatsBySelectedTextbook}
          trendData={trendData}
        />, 
      )
    }

    if (page === 'practice') {
      return withAttemptBanner(
        <PracticePage
          textbooks={textbooks}
          questions={questions}
          selection={selection}
          setSelection={setSelection}
          onSubmitAttempt={handleSubmitAttempt}
          onAfterSubmit={() => setPage('wrong')}
          summary={summary}
        />,
      )
    }

    if (page === 'wrong') {
      return withAttemptBanner(
        <WrongBookPage
          wrongQuestions={wrongQuestionsBySelectedTextbook}
          chapterNameMap={chapterNameMap}
          questionMap={questionMap}
          onPracticeWrong={handlePracticeWrong}
        />,
      )
    }

    if (page === 'growth') {
      return withAttemptBanner(
        <GrowthPage
          summary={summary}
          trendData={trendData}
          radarData={radarData}
          chapterStats={chapterStatsBySelectedTextbook}
        />,
      )
    }

    return withAttemptBanner(
      <HomePage
        summary={summary}
        trendData={trendData}
        chapterStats={chapterStatsBySelectedTextbook}
        textbooks={textbooks}
        selectedTextbookId={selection.textbookId}
        onSelectTextbook={(textbookId) => {
          const nextBook = textbooks.find((item) => item.id === textbookId)
          if (!nextBook) return
          setSelection((prev) => ({
            ...prev,
            textbookId,
            chapterId: nextBook.chapters[0]?.id ?? prev.chapterId,
          }))
        }}
      />,
    )
  })()

  return (
    <div className="min-h-screen bg-bg/70">
      <Navbar page={page} onSwitchPage={setPage} user={user} onLogout={handleLogout} />
      <main className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-6">{currentPage}</main>
    </div>
  )
}

export default App
