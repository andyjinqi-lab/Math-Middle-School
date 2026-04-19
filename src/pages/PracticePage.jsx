import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleHelp, CircleX, Flag, Lightbulb, Star } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { difficultyOptions } from '../data/questionBank'
import { pickQuestions } from '../lib/learningStore'

const sourceOptions = ['全部', '教材真题', '教师自编', '自动生成']
const ALL_CHAPTERS_VALUE = '__all__'
const questionCountOptions = [10, 20, 30, 50]

function normalizeAnswerText(value) {
  return `${value ?? ''}`
    .trim()
    .replace(/。|，|,|：|:/g, '')
    .replace(/\s+/g, '')
    .replace(/°|度/g, '')
    .toLowerCase()
}

function parseNumberLike(value) {
  const normalized = normalizeAnswerText(value)
  if (normalized === '') return null
  const num = Number(normalized)
  return Number.isFinite(num) ? num : null
}

function getQuestionType(question) {
  if (!question) return 'choice'
  if (question.questionType) return question.questionType
  if (Array.isArray(question.options) && question.options.length) return 'choice'
  return 'fill'
}

function normalizeFreeText(value) {
  return `${value ?? ''}`
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase()
}

function getCorrectAnswerDisplay(question) {
  const type = getQuestionType(question)
  if (type === 'choice') {
    const raw = question.options?.[question.answer] ?? ''
    return `${raw}`.replace(/^[A-D]\.\s*/, '')
  }
  return `${question.answer ?? ''}`
}

function checkAnswer(question, selectedIndex, textAnswer, calcWork) {
  const type = getQuestionType(question)
  if (type === 'choice') return selectedIndex === question.answer

  if (type === 'open') {
    const answerOk = normalizeAnswerText(question.answer) === normalizeAnswerText(textAnswer)
    const keywords = Array.isArray(question.keywords) ? question.keywords : []
    const normalizedWork = normalizeFreeText(calcWork)
    const hitCount = keywords.filter((item) => normalizedWork.includes(normalizeFreeText(item))).length
    const keywordOk = keywords.length === 0 ? true : hitCount >= Math.max(1, Math.ceil(keywords.length / 2))
    return answerOk && keywordOk
  }

  const expectedNum = parseNumberLike(question.answer)
  const actualNum = parseNumberLike(textAnswer)
  if (expectedNum !== null && actualNum !== null) {
    return Math.abs(expectedNum - actualNum) < 1e-6
  }

  return normalizeAnswerText(question.answer) === normalizeAnswerText(textAnswer)
}

function QuestionFigure({ figure }) {
  if (!figure) return null

  if (figure.type === 'line-angle') {
    const ox = 160
    const oy = 120
    const rayLength = 86
    const known = Number(figure.known) || 0
    const theta = (Math.PI / 180) * (180 - known)
    const cx = ox + rayLength * Math.cos(theta)
    const cy = oy - rayLength * Math.sin(theta)

    return (
      <svg viewBox="0 0 320 180" className="h-44 w-full rounded-2xl bg-bg/70">
        <line x1="40" y1="120" x2="280" y2="120" stroke="#334155" strokeWidth="3" />
        <line x1={ox} y1={oy} x2={cx} y2={cy} stroke="#4F7DF3" strokeWidth="3" />
        <text x="65" y="114" fill="#24324A" fontSize="14">{figure.labels?.left ?? 'A'}</text>
        <text x="283" y="114" fill="#24324A" fontSize="14">{figure.labels?.right ?? 'B'}</text>
        <text x={cx + 6} y={cy - 6} fill="#24324A" fontSize="14">{figure.labels?.top ?? 'C'}</text>
        <text x="164" y="136" fill="#24324A" fontSize="14">{figure.labels?.center ?? 'O'}</text>
      </svg>
    )
  }

  if (figure.type === 'triangle-angles') {
    return (
      <svg viewBox="0 0 320 200" className="h-48 w-full rounded-2xl bg-bg/70">
        <polygon points="50,160 270,160 150,40" fill="none" stroke="#334155" strokeWidth="3" />
        <text x="40" y="175" fill="#24324A" fontSize="14">{figure.labels?.A ?? 'A'}</text>
        <text x="272" y="175" fill="#24324A" fontSize="14">{figure.labels?.B ?? 'B'}</text>
        <text x="146" y="32" fill="#24324A" fontSize="14">{figure.labels?.C ?? 'C'}</text>
        <text x="84" y="151" fill="#D97706" fontSize="13">{figure.a}°</text>
        <text x="226" y="151" fill="#D97706" fontSize="13">{figure.b}°</text>
      </svg>
    )
  }

  if (figure.type === 'isosceles') {
    return (
      <svg viewBox="0 0 320 200" className="h-48 w-full rounded-2xl bg-bg/70">
        <polygon points="60,160 260,160 160,40" fill="none" stroke="#334155" strokeWidth="3" />
        <text x="156" y="32" fill="#24324A" fontSize="14">{figure.labels?.A ?? 'A'}</text>
        <text x="48" y="176" fill="#24324A" fontSize="14">{figure.labels?.B ?? 'B'}</text>
        <text x="264" y="176" fill="#24324A" fontSize="14">{figure.labels?.C ?? 'C'}</text>
        <text x="100" y="96" fill="#4F7DF3" fontSize="12">AB = AC</text>
        <text x="153" y="74" fill="#D97706" fontSize="13">{figure.vertex}°</text>
      </svg>
    )
  }

  if (figure.type === 'right-triangle') {
    const hiddenText = figure.hidden === 0 ? 'AB=?' : figure.hidden === 1 ? 'BC=?' : 'AC=?'
    return (
      <svg viewBox="0 0 320 200" className="h-48 w-full rounded-2xl bg-bg/70">
        <polygon points="70,160 250,160 250,70" fill="none" stroke="#334155" strokeWidth="3" />
        <rect x="238" y="148" width="12" height="12" fill="none" stroke="#334155" strokeWidth="2" />
        <text x="58" y="176" fill="#24324A" fontSize="14">{figure.labels?.A ?? 'A'}</text>
        <text x="252" y="176" fill="#24324A" fontSize="14">{figure.labels?.B ?? 'B'}</text>
        <text x="252" y="66" fill="#24324A" fontSize="14">{figure.labels?.C ?? 'C'}</text>
        <text x="145" y="176" fill="#D97706" fontSize="13">{figure.hidden === 0 ? hiddenText : `AB=${figure.a}`}</text>
        <text x="257" y="116" fill="#D97706" fontSize="13">{figure.hidden === 1 ? hiddenText : `BC=${figure.b}`}</text>
        <text x="142" y="110" fill="#D97706" fontSize="13">{figure.hidden === 2 ? hiddenText : `AC=${figure.c}`}</text>
      </svg>
    )
  }

  return null
}

export default function PracticePage({
  textbooks,
  questions,
  selection,
  setSelection,
  onSubmitAttempt,
  onAfterSubmit,
  summary,
}) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [calcWork, setCalcWork] = useState('')
  const [jumpInput, setJumpInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [submitHint, setSubmitHint] = useState('')
  const [recordedQuestionIds, setRecordedQuestionIds] = useState({})
  const [sessionQuestions, setSessionQuestions] = useState([])

  const currentBook = textbooks.find((item) => item.id === selection.textbookId) ?? textbooks[0]
  const chapters = currentBook?.chapters ?? []
  const isAllChapters = selection.chapterId === ALL_CHAPTERS_VALUE
  const currentChapter = isAllChapters
    ? null
    : chapters.find((item) => item.id === selection.chapterId) ?? chapters[0]
  const current = sessionQuestions[index]
  const currentQuestionChapterName =
    chapters.find((item) => item.id === current?.chapterId)?.name ?? currentChapter?.name ?? '章节'

  useEffect(() => {
    if (!currentBook) return
    const next = pickQuestions({
      questions,
      textbookId: currentBook.id,
      chapterId: isAllChapters ? null : currentChapter?.id,
      difficulty: selection.difficulty,
      source: selection.source,
      count: selection.questionCount,
    })
    setSessionQuestions(next)
    setIndex(0)
    setSelected(null)
    setTextAnswer('')
    setCalcWork('')
    setJumpInput('')
    setStatus('idle')
    setSubmitHint('')
    setRecordedQuestionIds({})
  }, [
    questions,
    selection.textbookId,
    selection.chapterId,
    selection.difficulty,
    selection.source,
    selection.questionCount,
    currentBook,
    currentChapter,
    isAllChapters,
  ])

  const questionType = getQuestionType(current)
  const isRight = useMemo(() => {
    if (!current) return false
    if (questionType === 'choice' && selected === null) return false
    if (questionType !== 'choice' && !normalizeAnswerText(textAnswer)) return false
    return checkAnswer(current, selected, textAnswer, calcWork)
  }, [selected, current, questionType, textAnswer, calcWork])

  const progress = sessionQuestions.length ? ((index + 1) / sessionQuestions.length) * 100 : 0

  function getCurrentAttemptMeta() {
    if (!current) return { hasAnswered: false, correct: false, selectedValue: null }
    const hasAnswered = (() => {
      if (questionType === 'choice') return selected !== null
      if (questionType === 'open') {
        return Boolean(normalizeAnswerText(textAnswer) || normalizeFreeText(calcWork))
      }
      return Boolean(normalizeAnswerText(textAnswer))
    })()
    const correct = hasAnswered ? checkAnswer(current, selected, textAnswer, calcWork) : false
    const selectedValue =
      questionType === 'choice'
        ? selected
        : JSON.stringify({
            finalAnswer: textAnswer,
            work: calcWork,
          })
    return { hasAnswered, correct, selectedValue }
  }

  function recordCurrentAttempt(options = {}) {
    const { force = false } = options
    if (!current) return { saved: false, hasAnswered: false, correct: false }

    const { hasAnswered, correct, selectedValue } = getCurrentAttemptMeta()
    if (!hasAnswered) return { saved: false, hasAnswered: false, correct: false }
    if (!force && recordedQuestionIds[current.id]) {
      return { saved: false, hasAnswered: true, correct }
    }

    onSubmitAttempt({
      questionId: current.id,
      textbookId: current.textbookId,
      chapterId: current.chapterId,
      correct,
      selected: selectedValue,
      answer: current.answer,
      difficulty: current.difficulty,
    })
    setRecordedQuestionIds((prev) => ({ ...prev, [current.id]: true }))
    return { saved: true, hasAnswered: true, correct }
  }

  function onSubmit() {
    if (!current) return
    const result = recordCurrentAttempt({ force: true })
    if (!result.hasAnswered) {
      setSubmitHint('请先选择答案或填写结果，再提交。')
      return
    }
    setStatus(result.correct ? 'right' : 'wrong')
    setSubmitHint('')
    if (onAfterSubmit) onAfterSubmit()
  }

  function onNext() {
    if (sessionQuestions.length === 0) return
    recordCurrentAttempt()
    if (index >= sessionQuestions.length - 1) {
      setSubmitHint('已是最后一题，请直接提交本题。')
      return
    }
    setSelected(null)
    setTextAnswer('')
    setCalcWork('')
    setJumpInput('')
    setStatus('idle')
    setSubmitHint('')
    setIndex((v) => v + 1)
  }

  function onPrev() {
    recordCurrentAttempt()
    setSelected(null)
    setTextAnswer('')
    setCalcWork('')
    setJumpInput('')
    setStatus('idle')
    setSubmitHint('')
    setIndex((v) => {
      if (sessionQuestions.length === 0) return 0
      return (v - 1 + sessionQuestions.length) % sessionQuestions.length
    })
  }

  function onJump() {
    const target = Number(jumpInput)
    if (!Number.isInteger(target)) return
    if (target < 1 || target > sessionQuestions.length) return

    recordCurrentAttempt()
    setSelected(null)
    setTextAnswer('')
    setCalcWork('')
    setJumpInput('')
    setStatus('idle')
    setSubmitHint('')
    setIndex(target - 1)
  }

  if (!currentBook || !current) {
    return (
      <Card>
        <p className="text-sm text-textSub">当前章节暂无题目，请切换教材、章节或难度后重试。</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-sm text-textSub">
            教材
            <select
              value={selection.textbookId}
              onChange={(e) => {
                const nextBook = textbooks.find((item) => item.id === e.target.value)
                setSelection((prev) => ({
                  ...prev,
                  textbookId: e.target.value,
                  chapterId:
                    prev.chapterId === ALL_CHAPTERS_VALUE
                      ? ALL_CHAPTERS_VALUE
                      : nextBook?.chapters?.[0]?.id ?? prev.chapterId,
                }))
              }}
              className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
            >
              {textbooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-textSub">
            章节
            <select
              value={selection.chapterId}
              onChange={(e) => setSelection((prev) => ({ ...prev, chapterId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
            >
              <option value={ALL_CHAPTERS_VALUE}>所有章节</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-textSub">
            难度
            <select
              value={selection.difficulty}
              onChange={(e) => setSelection((prev) => ({ ...prev, difficulty: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
            >
              {difficultyOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-textSub">
            来源
            <select
              value={selection.source}
              onChange={(e) => setSelection((prev) => ({ ...prev, source: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
            >
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-textSub">
            题量
            <select
              value={selection.questionCount}
              onChange={(e) =>
                setSelection((prev) => ({ ...prev, questionCount: Number(e.target.value) || 10 }))
              }
              className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm text-textMain"
            >
              {questionCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count} 题
                </option>
              ))}
            </select>
          </label>

        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-semibold text-textMain">
            第 {index + 1} 题 / 共 {sessionQuestions.length} 题
          </p>
          <Badge
            tone={
              questionType === 'choice'
                ? 'blue'
                : questionType === 'fill'
                  ? 'purple'
                  : questionType === 'open'
                    ? 'green'
                    : 'orange'
            }
          >
            {questionType === 'choice'
              ? '选择题'
              : questionType === 'fill'
                ? '填空题'
                : questionType === 'open'
                  ? '问答题'
                  : questionType === 'composite'
                    ? '综合计算题'
                    : '计算题'}
          </Badge>
          <Badge tone={current.difficulty === '挑战' ? 'purple' : 'orange'}>{current.difficulty}</Badge>
          <Badge tone="blue">{isAllChapters ? currentQuestionChapterName : currentChapter?.name ?? '章节'}</Badge>
          <Badge tone="green">{current.source ?? '教师自编'}</Badge>
          <div className="ml-auto flex items-center gap-1 text-sm font-semibold text-amber-600">
            <Star size={16} />
            当前能量值：{summary.energy}
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-bold text-textMain md:text-2xl">{current.stem}</h2>
        <QuestionFigure figure={current.figure} />
        {questionType === 'choice' ? (
          <div className="grid gap-3">
            {current.options.map((option, i) => {
              const selectedNow = selected === i
              const showResult = status !== 'idle'
              const rightOption = current.answer === i
              let extraClass = 'border-gray-100'
              if (selectedNow) extraClass = 'border-primary bg-primary/5'
              if (showResult && rightOption) extraClass = 'border-success bg-green-50'
              if (showResult && selectedNow && !rightOption) extraClass = 'border-error bg-red-50'

              return (
                <button
                  key={`${option}-${i}`}
                  type="button"
                  onClick={() => status === 'idle' && setSelected(i)}
                  className={`rounded-2xl border bg-white px-4 py-3 text-left text-sm font-medium text-textMain transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${extraClass}`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {(questionType === 'calculation' || questionType === 'composite' || questionType === 'open') && (
              <label className="block text-sm text-textSub">
                {questionType === 'open' ? '解题过程（建议写清思路）' : '计算过程'}
                <textarea
                  value={calcWork}
                  onChange={(e) => setCalcWork(e.target.value)}
                  rows={4}
                  placeholder="在这里写你的计算步骤（可选）"
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-textMain"
                />
              </label>
            )}
            <label className="block text-sm text-textSub">
              {questionType === 'open' ? '最终结论' : '最终答案'}
              <input
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="请输入最终结果，如 24 或 45°"
                className="mt-1 w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm text-textMain"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSubmit}>提交答案</Button>
          <Button variant="secondary" onClick={onPrev}>
            上一题
          </Button>
          <Button
            variant="secondary"
            onClick={onNext}
            disabled={index >= sessionQuestions.length - 1}
          >
            下一题
          </Button>
          <label className="inline-flex items-center gap-2 rounded-xl border border-primary/20 px-3 py-1.5 text-sm text-textSub">
            跳转到
            <input
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value.replace(/[^\d]/g, ''))}
              className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-center text-textMain"
              placeholder="题号"
            />
            题
            <Button variant="ghost" className="px-2 py-1 text-sm" onClick={onJump}>
              跳转
            </Button>
          </label>
          <Button variant="ghost">
            <span className="inline-flex items-center gap-1">
              <Flag size={14} /> 收藏
            </span>
          </Button>
        </div>
        {submitHint ? <p className="text-sm text-amber-600">{submitHint}</p> : null}
      </Card>

      {status !== 'idle' && (
        <Card className="animate-pop">
          <div className="flex items-start gap-3">
            {status === 'right' ? (
              <CheckCircle2 className="mt-0.5 text-success" />
            ) : (
              <CircleX className="mt-0.5 text-error" />
            )}
            <div>
              <p className="font-semibold text-textMain">
                {status === 'right' ? '回答正确，太棒了！ +5 能量值' : '这题有点难，再看看解题思路吧～'}
              </p>
              <p className="mt-2 text-sm text-textSub">
                <span className="mr-1 inline-flex items-center gap-1">
                  <CircleHelp size={14} /> 解析：
                </span>
                {current.explanation}
              </p>
              <p className="mt-2 text-sm font-medium text-textMain">
                标准答案：{getCorrectAnswerDisplay(current)}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-primary">
                <Lightbulb size={14} /> 类似题推荐：同类题再练 2 题
              </p>
              {questionType === 'open' && current.referenceSteps?.length ? (
                <div className="mt-3 rounded-xl bg-bg/70 p-3 text-sm text-textSub">
                  <p className="mb-1 font-semibold text-textMain">参考步骤：</p>
                  {current.referenceSteps.map((step, i) => (
                    <p key={`${step}-${i}`}>{i + 1}. {step}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
