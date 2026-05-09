import { useEffect, useMemo, useState } from 'react'
import { lazy, Suspense } from 'react'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import PracticePage from './pages/PracticePage'
import { curatedQuestions, textbooks } from './data/questionBank'
import {
  calcChapterStats,
  calcSummary,
  calcTrend,
  calcWrongQuestions,
  loadAttemptsForUser,
  saveAttemptForUser,
} from './lib/learningStore'
import {
  clearSession,
  loadSession,
  loginWithEmail,
  registerWithEmail,
  requestPasswordReset,
  resetPasswordByToken,
} from './lib/authApi'

const WrongBookPage = lazy(() => import('./pages/WrongBookPage'))
const GrowthPage = lazy(() => import('./pages/GrowthPage'))
const ParentPage = lazy(() => import('./pages/ParentPage'))
const TransferPracticePage = lazy(() => import('./pages/TransferPracticePage'))

const CHAPTER_DISPLAY_NAME_MAP = {
  '6a-c1': '第1章 有理数初步',
  '6a-c2': '第2章 整式初步',
  '6a-c3': '第3章 一元一次方程入门',
  '6a-c4': '第4章 几何图形初步',
  '6a-c5': '第5章 分数与小数运算',
  '6a-c6': '第6章 比与比例基础',
  '6a-c7': '第7章 简单统计图表',
  '6a-c8': '第8章 应用题建模入门',
  '6b-c1': '第1章 分数与比例',
  '6b-c2': '第2章 线段与角',
  '6b-c3': '第3章 数据处理初步',
  '6b-c4': '第4章 综合应用',
  '6b-c5': '第5章 方程应用题',
  '6b-c6': '第6章 平面图形面积',
  '6b-c7': '第7章 立体图形初步',
  '6b-c8': '第8章 概率直观感知',
  '7a-c1': '第9章 整式与因式分解',
  '7a-c2': '第10章 第5节 可化为一元一次方程的分式方程',
  '7a-c3': '第11章 图形的运动',
  '7a-c4': '第9章 整式运算专项',
  '7a-c5': '第10章 第1-2节 分式的意义与性质',
  '7a-c6': '第10章 第3-4节 分式的运算',
  '7a-c7': '第10章 第6节 整数指数幂及其运算',
  '7a-c8': '本册综合（第9-11章）',
  '7b-c1': '第1章 不等式与不等式组',
  '7b-c2': '第2章 二元一次方程组',
  '7b-c3': '第3章 统计与概率初步',
  '7b-c4': '第4章 几何证明初步',
  '7b-c5': '第5章 整式乘法与因式分解',
  '7b-c6': '第6章 平面直角坐标系',
  '7b-c7': '第7章 三角形基础',
  '7b-c8': '第8章 章节综合训练',
  '8a-c1': '第1章 一次函数',
  '8a-c2': '第2章 全等三角形',
  '8a-c3': '第3章 因式分解',
  '8a-c4': '第4章 数据分析',
  '8a-c5': '第5章 轴对称与中心对称',
  '8a-c6': '第6章 实数与根式',
  '8a-c7': '第7章 函数图像综合',
  '8a-c8': '第8章 章节综合训练',
  '8b-c1': '第1章 分式',
  '8b-c2': '第2章 勾股定理',
  '8b-c3': '第3章 平行四边形',
  '8b-c4': '第4章 概率模型',
  '8b-c5': '第5章 一次函数与方程不等式',
  '8b-c6': '第6章 图形平移与旋转',
  '8b-c7': '第7章 数据抽样与估计',
  '8b-c8': '第8章 章节综合训练',
  '9a-c1': '第1章 二次函数',
  '9a-c2': '第2章 相似三角形',
  '9a-c3': '第3章 圆',
  '9a-c4': '第4章 综合建模',
  '9a-c5': '第5章 一元二次方程',
  '9a-c6': '第6章 二次函数最值与应用',
  '9a-c7': '第7章 圆与直线位置关系',
  '9a-c8': '第8章 章节综合训练',
  '9b-c1': '第1章 锐角三角函数',
  '9b-c2': '第2章 统计与概率进阶',
  '9b-c3': '第3章 中考综合训练',
  '9b-c4': '第4章 压轴题策略',
  '9b-c5': '第5章 图形变换综合',
  '9b-c6': '第6章 函数与几何综合',
  '9b-c7': '第7章 代数几何压轴',
  '9b-c8': '第8章 中考真题演练',
}

const DISPLAY_TEXTBOOKS = textbooks.map((book) => ({
  ...book,
  chapters: book.chapters.map((chapter) => ({
    ...chapter,
    name: CHAPTER_DISPLAY_NAME_MAP[chapter.id] ?? chapter.name,
  })),
}))

function App() {
  const [session, setSession] = useState(() => loadSession())
  const [page, setPage] = useState('home')
  const [attempts, setAttempts] = useState([])
  const [questions, setQuestions] = useState(() => curatedQuestions)
  const [questionBankReady, setQuestionBankReady] = useState(false)
  const [questionBankLoading, setQuestionBankLoading] = useState(false)
  const [questionBankError, setQuestionBankError] = useState('')
  const [attemptError, setAttemptError] = useState('')
  const [appNotice, setAppNotice] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const [selection, setSelection] = useState({
    textbookId: DISPLAY_TEXTBOOKS[2]?.id ?? DISPLAY_TEXTBOOKS[0]?.id,
    chapterId: DISPLAY_TEXTBOOKS[2]?.chapters?.[0]?.id ?? DISPLAY_TEXTBOOKS[0]?.chapters?.[0]?.id,
    difficulty: '提升',
    source: '全部',
    questionCount: 10,
  })

  const user = session?.user ?? null
  const shouldLoadFullQuestionBank = user && ['practice', 'wrong', 'transfer'].includes(page)

  const summary = useMemo(() => calcSummary(attempts), [attempts])
  const trendData = useMemo(() => calcTrend(attempts, 7), [attempts])
  const chapterStatsAll = useMemo(
    () => calcChapterStats(DISPLAY_TEXTBOOKS, questions, attempts),
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
    DISPLAY_TEXTBOOKS.forEach((book) => {
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

    async function loadQuestionBank() {
      if (!user) {
        setQuestions(curatedQuestions)
        setQuestionBankReady(false)
        setQuestionBankLoading(false)
        setQuestionBankError('')
        return
      }

      if (!shouldLoadFullQuestionBank || questionBankReady) return

      setQuestionBankLoading(true)
      setQuestionBankError('')

      try {
        const questionGeneratorModule = await import('./lib/questionGenerator')

        if (cancelled) return

        const generatedQuestions = questionGeneratorModule.buildGeneratedQuestions(DISPLAY_TEXTBOOKS, 100)
        const mergedQuestions = questionGeneratorModule.mergeQuestionBank(
          curatedQuestions,
          generatedQuestions,
        )

        setQuestions(mergedQuestions)
        setQuestionBankReady(true)
      } catch (error) {
        if (!cancelled) {
          setQuestions(curatedQuestions)
          setQuestionBankReady(false)
          setQuestionBankError(error.message || '题库加载失败，当前仅显示基础题。')
        }
      } finally {
        if (!cancelled) setQuestionBankLoading(false)
      }
    }

    loadQuestionBank()

    return () => {
      cancelled = true
    }
  }, [questionBankReady, shouldLoadFullQuestionBank, user])

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

  function handleSearchEntry() {
    setAppNotice('已进入练习页：可通过教材、章节、难度和来源筛选知识点 / 题型 / 错题。')
    setPage('practice')
  }

  function handleNotifyEntry() {
    setAppNotice('今日提醒：建议先完成同步练习，再处理错题本中的高频错题。')
    setPage('home')
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

  const renderPageContent = (node, useSuspense = true) =>
    useSuspense ? (
      <Suspense
        fallback={
          <div className="rounded-[28px] border border-primary/10 bg-white p-8 text-sm font-semibold text-textSecondary shadow-card">
            正在加载页面...
          </div>
        }
      >
        {node}
      </Suspense>
    ) : (
      node
    )

  const withAttemptBanner = (node, options = {}) => (
    <div className="space-y-3">
      {questionBankLoading ? (
        <div className="rounded-2xl border border-primary/15 bg-softBlue px-4 py-2 text-sm font-semibold text-primary">
          正在准备练习题，马上就好。
        </div>
      ) : null}
      {questionBankError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          题库提示：{questionBankError}
        </div>
      ) : null}
      {appNotice ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-softBlue px-4 py-2 text-sm font-semibold text-primary">
          <span>{appNotice}</span>
          <button type="button" className="text-xs font-black text-primaryHover" onClick={() => setAppNotice('')}>
            知道了
          </button>
        </div>
      ) : null}
      {attemptError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          记录服务提示：{attemptError}
        </div>
      ) : null}
      {renderPageContent(node, options.suspense ?? true)}
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
          textbooks={DISPLAY_TEXTBOOKS}
          questions={questions}
          selection={selection}
          setSelection={setSelection}
          onSubmitAttempt={handleSubmitAttempt}
          onAfterSubmit={() => setPage('wrong')}
          summary={summary}
        />,
        { suspense: false },
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

    if (page === 'transfer') {
      return withAttemptBanner(
        <TransferPracticePage questions={questions} onStartPractice={() => setPage('practice')} />,
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
        textbooks={DISPLAY_TEXTBOOKS}
        selectedTextbookId={selection.textbookId}
        onSelectTextbook={(textbookId) => {
          const nextBook = DISPLAY_TEXTBOOKS.find((item) => item.id === textbookId)
          if (!nextBook) return
          setSelection((prev) => ({
            ...prev,
            textbookId,
            chapterId: nextBook.chapters[0]?.id ?? prev.chapterId,
          }))
        }}
        onStartPractice={() => setPage('practice')}
        onOpenWrongBook={() => setPage('wrong')}
        onOpenTransfer={() => setPage('transfer')}
        onOpenGrowth={() => setPage('growth')}
      />,
      { suspense: false },
    )
  })()

  return (
    <AppShell
      page={page}
      onSwitchPage={setPage}
      user={user}
      onLogout={handleLogout}
      onSearchClick={handleSearchEntry}
      onNotifyClick={handleNotifyEntry}
    >
      {currentPage}
    </AppShell>
  )
}

export default App
