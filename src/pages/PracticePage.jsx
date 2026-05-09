import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleHelp, CircleX, Flag, Lightbulb, Star } from 'lucide-react'
import { useRef } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { difficultyOptions } from '../data/questionBank'
import { pickQuestions } from '../lib/learningStore'
import { answerMatches, formatMathDisplay, normalizeMathAnswer } from '../lib/mathTextFormat'

const sourceOptions = [
  { value: '全部', label: '全部题源' },
  { value: '教材真题', label: '教材同步题' },
  { value: '教师自编', label: '校本精选题' },
  { value: '自动生成', label: '智能变式题' },
  { value: 'XSL_RULE', label: '规则解析题' },
  { value: 'XSL', label: '原卷切片题' },
]

const sourceLabelMap = Object.fromEntries(sourceOptions.map((item) => [item.value, item.label]))
const ALL_CHAPTERS_VALUE = '__all__'
const questionCountOptions = [10, 20, 30, 50]

function parseNumberLike(value) {
  const normalized = normalizeMathAnswer(value)
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
  if (question?.selfCheck) {
    if (Array.isArray(question.answerRefs) && question.answerRefs.length) {
      return `参考答案候选：${question.answerRefs.join('；')}`
    }
    return '本题为截图题，请对照原卷答案自查'
  }
  const type = getQuestionType(question)
  if (type === 'choice') {
    const raw = question.options?.[question.answer] ?? ''
    return formatMathDisplay(`${raw}`.replace(/^[A-D]\.\s*/, ''))
  }
  return formatMathDisplay(question.answer)
}

function getSelfCheckReference(question) {
  const refs = Array.isArray(question?.answerRefs)
    ? question.answerRefs.filter((item) => isUsableReferenceAnswer(item, question?.stem))
    : []
  if (refs.length) {
    return formatMathDisplay(refs.join('；'))
  }
  const answer = `${question?.answer ?? ''}`.trim()
  if (answer && !answer.includes('截图题暂不自动批改') && !answer.includes('请对照参考答案')) {
    return formatMathDisplay(answer)
  }
  return ''
}

function compactForCompare(value) {
  return `${value ?? ''}`
    .replace(/^\s*\d{1,3}[.、)]\s*/, '')
    .replace(/[，。,.；;：:（）()【】[\]"'“”‘’\s]/g, '')
    .toLowerCase()
}

function isUsableReferenceAnswer(answer, stem) {
  const raw = `${answer ?? ''}`.trim()
  if (!raw) return false
  const compactAnswer = compactForCompare(raw)
  const compactStem = compactForCompare(stem)
  if (!compactAnswer) return false
  if (compactAnswer.length <= 8) return true

  const prefixLength = Math.min(24, compactStem.length, compactAnswer.length)
  if (
    prefixLength >= 10 &&
    (compactAnswer.startsWith(compactStem.slice(0, prefixLength)) ||
      compactStem.startsWith(compactAnswer.slice(0, prefixLength)))
  ) {
    return false
  }
  if (/\bA[.．、].*\bB[.．、].*\bC[.．、]/.test(raw) && !/^\s*[A-D][.．、]?\s*(?:$|提示|解|[:：])/.test(raw)) {
    return false
  }
  if ((raw.includes('（ ）') || raw.includes('( )') || raw.includes('____')) && compactAnswer.length > 18) {
    return false
  }
  return true
}

function checkAnswer(question, selectedIndex, textAnswer, calcWork) {
  if (question?.selfCheck) return false
  const type = getQuestionType(question)
  if (type === 'choice') return selectedIndex === question.answer

  if (type === 'open') {
    const answerOk = answerMatches(question.answer, textAnswer)
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

  return answerMatches(question.answer, textAnswer)
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
  questionBankLoading = false,
  questionBankReady = false,
}) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [calcWork, setCalcWork] = useState('')
  const [jumpInput, setJumpInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [submitHint, setSubmitHint] = useState('')
  const [poolHint, setPoolHint] = useState('')
  const [showSelfCheckReference, setShowSelfCheckReference] = useState(false)
  const [recordedQuestionIds, setRecordedQuestionIds] = useState({})
  const recordedQuestionIdsRef = useRef({})
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState({})
  const answeredQuestionIdsRef = useRef({})
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [sessionQuestions, setSessionQuestions] = useState([])
  const practiceQuestions = useMemo(
    () =>
      questions.filter((item) => {
        if (item.source === 'SB') return false
        if (item.source === 'XSL_AUTO') return false
        if (item.source !== 'XSL') return true

        const hasImage =
          Boolean(item.imageUrl) || (Array.isArray(item.imageUrls) && item.imageUrls.length > 0)
        const hasReference =
          Array.isArray(item.answerRefs) &&
          item.answerRefs.some((answer) => isUsableReferenceAnswer(answer, item.stem))
        return hasImage && hasReference
      }),
    [questions],
  )

  const currentBook = textbooks.find((item) => item.id === selection.textbookId) ?? textbooks[0]
  const chapters = currentBook?.chapters ?? []
  const isAllChapters = selection.chapterId === ALL_CHAPTERS_VALUE
  const currentChapter = isAllChapters
    ? null
    : chapters.find((item) => item.id === selection.chapterId) ?? chapters[0]
  const current = sessionQuestions[index]
  const currentImageUrls = current
    ? Array.isArray(current.imageUrls) && current.imageUrls.length
      ? current.imageUrls
      : current.imageUrl
        ? [current.imageUrl]
        : []
    : []
  const currentQuestionChapterName =
    chapters.find((item) => item.id === current?.chapterId)?.name ?? currentChapter?.name ?? '章节'

  useEffect(() => {
    if (!currentBook) return
    const baseParams = {
      questions: practiceQuestions,
      textbookId: currentBook.id,
      chapterId: isAllChapters ? null : currentChapter?.id,
      difficulty: selection.source === 'XSL_RULE' ? null : selection.difficulty,
      source: selection.source,
      count: selection.questionCount,
    }

    let next = pickQuestions(baseParams)
    let nextHint = ''

    if (next.length === 0 && !isAllChapters && questionBankLoading) {
      nextHint = '正在生成当前章节练习题，请稍等。'
    }

    if (next.length === 0 && !questionBankLoading && selection.source === 'XSL' && selection.difficulty) {
      next = pickQuestions({ ...baseParams, difficulty: null })
      if (next.length) nextHint = 'XSL 当前按切题质量筛选，已自动忽略难度继续抽取 XSL 题。'
    }

    if (next.length === 0 && !questionBankLoading && selection.source === 'XSL_RULE' && selection.difficulty) {
      next = pickQuestions({ ...baseParams, difficulty: null })
      if (next.length) nextHint = 'XSL_RULE 题库按规则求解题抽取，已自动忽略难度筛选。'
    }

    if (next.length === 0 && !questionBankLoading && selection.source !== '全部' && selection.source !== 'XSL_RULE') {
      next = pickQuestions({ ...baseParams, chapterId: baseParams.chapterId, source: '全部' })
      if (next.length) nextHint = `当前题源“${sourceLabelMap[selection.source] ?? selection.source}”暂无题目，已自动放宽为“全部题源”。`
    }

    if (next.length === 0 && !questionBankLoading && isAllChapters && selection.source !== 'XSL_RULE') {
      next = pickQuestions({
        questions: practiceQuestions,
        textbookId: currentBook.id,
        chapterId: null,
        difficulty: null,
        source: selection.source,
        count: selection.questionCount,
      })
      if (next.length) nextHint = '已自动放宽为“本教材全部难度”。'
    }

    if (next.length === 0 && !questionBankLoading && isAllChapters && selection.source !== 'XSL_RULE') {
      next = pickQuestions({
        questions: practiceQuestions,
        textbookId: currentBook.id,
        chapterId: null,
        difficulty: null,
        source: '全部',
        count: selection.questionCount,
      })
      if (next.length) nextHint = '已自动放宽为“本教材全部难度 + 全部来源”。'
    }

    if (next.length === 0 && !questionBankLoading && !isAllChapters) {
      nextHint = questionBankReady
        ? '当前章节暂未入库符合条件的题目，请切换难度、来源，或选择“所有章节”。'
        : '正在生成当前章节练习题，请稍等。'
    }

    if (next.length === 0 && !questionBankLoading && selection.source === 'XSL_RULE') {
      nextHint = 'XSL_RULE 当前章节暂未入库题目，请切换章节或选择“所有章节”。'
    }

    setPoolHint(nextHint)
    setSessionQuestions(next)
    setIndex(0)
    setSelected(null)
    setTextAnswer('')
    setCalcWork('')
    setJumpInput('')
    setStatus('idle')
    setSubmitHint('')
    setShowSelfCheckReference(false)
    recordedQuestionIdsRef.current = {}
    answeredQuestionIdsRef.current = {}
    setRecordedQuestionIds({})
    setAnsweredQuestionIds({})
    setShowSubmitConfirm(false)
  }, [
    practiceQuestions,
    selection.textbookId,
    selection.chapterId,
    selection.difficulty,
    selection.source,
    selection.questionCount,
    currentBook,
    currentChapter,
    isAllChapters,
    questionBankLoading,
    questionBankReady,
  ])

  const questionType = getQuestionType(current)
  const isSelfCheckQuestion = Boolean(current?.selfCheck)
  const selfCheckReference = getSelfCheckReference(current)
  const isRight = useMemo(() => {
    if (!current) return false
    if (questionType === 'choice' && selected === null) return false
    if (questionType !== 'choice' && !normalizeMathAnswer(textAnswer)) return false
    return checkAnswer(current, selected, textAnswer, calcWork)
  }, [selected, current, questionType, textAnswer, calcWork])

  const progress = sessionQuestions.length ? ((index + 1) / sessionQuestions.length) * 100 : 0
  const isLastQuestion = index >= sessionQuestions.length - 1
  const answeredCount = sessionQuestions.filter((item) => answeredQuestionIds[item.id]).length
  const recordedCount = sessionQuestions.filter((item) => recordedQuestionIds[item.id]).length
  const pendingCount = Math.max(0, sessionQuestions.length - answeredCount)
  const similarQuestions = useMemo(() => {
    if (!current) return []
    const currentType = getQuestionType(current)
    const sameChapter = practiceQuestions.filter(
      (item) =>
        item.id !== current.id &&
        item.textbookId === current.textbookId &&
        item.chapterId === current.chapterId &&
        getQuestionType(item) === currentType,
    )
    const sameBook = practiceQuestions.filter(
      (item) =>
        item.id !== current.id &&
        item.textbookId === current.textbookId &&
        item.chapterId !== current.chapterId &&
        getQuestionType(item) === currentType,
    )
    return [...sameChapter, ...sameBook].slice(0, 2)
  }, [current, practiceQuestions])

  function getCurrentAttemptMeta(options = {}) {
    const { overrideCorrect } = options
    if (!current) return { hasAnswered: false, correct: false, selectedValue: null }

    if (isSelfCheckQuestion && typeof overrideCorrect === 'boolean') {
      return {
        hasAnswered: true,
        correct: overrideCorrect,
        selectedValue: JSON.stringify({
          finalAnswer: textAnswer,
          work: calcWork,
          selfCheck: true,
        }),
      }
    }
    if (isSelfCheckQuestion) {
      return { hasAnswered: false, correct: false, selectedValue: null }
    }

    const hasAnswered = (() => {
      if (questionType === 'choice') return selected !== null
      if (questionType === 'open') {
        return Boolean(normalizeMathAnswer(textAnswer) || normalizeFreeText(calcWork))
      }
      return Boolean(normalizeMathAnswer(textAnswer))
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
    const { force = false, overrideCorrect } = options
    if (!current) return { saved: false, hasAnswered: false, correct: false }

    const { hasAnswered, correct, selectedValue } = getCurrentAttemptMeta({ overrideCorrect })
    if (!hasAnswered) return { saved: false, hasAnswered: false, correct: false }
    answeredQuestionIdsRef.current = { ...answeredQuestionIdsRef.current, [current.id]: true }
    setAnsweredQuestionIds((prev) => ({ ...prev, [current.id]: true }))
    if (!force && (recordedQuestionIdsRef.current[current.id] || recordedQuestionIds[current.id])) {
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
    recordedQuestionIdsRef.current = { ...recordedQuestionIdsRef.current, [current.id]: true }
    setRecordedQuestionIds((prev) => ({ ...prev, [current.id]: true }))
    return { saved: true, hasAnswered: true, correct }
  }

  function onSubmit() {
    if (!current) return
    if (isSelfCheckQuestion) {
      setSubmitHint('请先写出你的答案，再点击“查看参考答案”。')
      return
    }
    const result = recordCurrentAttempt()
    if (!result.hasAnswered) {
      setSubmitHint('请先选择答案或填写结果，再提交。')
      return
    }
    setStatus(result.correct ? 'right' : 'wrong')
    if (isLastQuestion) {
      setSubmitHint('')
      setShowSubmitConfirm(true)
      return
    }
    setSubmitHint('本题已记录，请继续下一题；完成最后一题后会统一进入错题本。')
  }

  function onRevealSelfCheckReference() {
    if (!current) return
    if (!normalizeMathAnswer(textAnswer) && !normalizeFreeText(calcWork)) {
      setSubmitHint('请先写出你的答案或过程，再查看参考答案。')
      return
    }
    setShowSelfCheckReference(true)
    setSubmitHint('')
  }

  function onSelfCheck(correct) {
    if (!current) return
    if (!showSelfCheckReference) {
      setSubmitHint('请先查看参考答案，再判断自己是否做对。')
      return
    }
    const result = recordCurrentAttempt({ overrideCorrect: correct })
    if (!result.hasAnswered) {
      setSubmitHint('请先填写你的答案或过程，再进行自评。')
      return
    }
    setStatus(correct ? 'right' : 'wrong')
    if (isLastQuestion) {
      setSubmitHint('')
      setShowSubmitConfirm(true)
      return
    }
    setSubmitHint('本题已记录，请继续下一题；完成最后一题后会统一进入错题本。')
  }

  function onConfirmSubmitSession() {
    recordCurrentAttempt()
    setShowSubmitConfirm(false)
    if (onAfterSubmit) onAfterSubmit()
  }

  function onContinueSession() {
    setShowSubmitConfirm(false)
    setSubmitHint('可以继续检查或跳转补做未完成题。')
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
    setShowSelfCheckReference(false)
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
    setShowSelfCheckReference(false)
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
    setShowSelfCheckReference(false)
    setIndex(target - 1)
  }

  function onPracticeSimilar() {
    if (!similarQuestions.length) {
      setSubmitHint('当前题库暂未找到同类题，可以切换到“所有章节”扩大范围。')
      return
    }

    setSessionQuestions(similarQuestions)
    setIndex(0)
    setSelected(null)
    setTextAnswer('')
    setCalcWork('')
    setJumpInput('')
    setStatus('idle')
    setSubmitHint('已进入举一反三加练：这组题和刚才的题型、章节尽量保持接近。')
    setShowSelfCheckReference(false)
    setShowSubmitConfirm(false)
    recordedQuestionIdsRef.current = {}
    answeredQuestionIdsRef.current = {}
    setRecordedQuestionIds({})
    setAnsweredQuestionIds({})
  }

  function onFavoriteCurrent() {
    if (!current) return
    setSubmitHint('已收藏本题。后续可在错题本/收藏题模块统一复习。')
  }

  if (!currentBook || !current) {
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
                  <option key={source.value} value={source.value}>
                    {source.label}
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
          <p className="text-sm text-textSub">
            当前筛选暂无题目，请调整教材、章节、难度或来源。
          </p>
        </Card>
      </div>
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
                <option key={source.value} value={source.value}>
                  {source.label}
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
        {poolHint ? <p className="mt-3 text-sm text-amber-600">{poolHint}</p> : null}
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
          <Badge tone="green">{sourceLabelMap[current.source] ?? current.source ?? '校本精选题'}</Badge>
          <div className="ml-auto flex items-center gap-1 text-sm font-semibold text-amber-600">
            <Star size={16} />
            当前能量值：{summary.energy}
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>
      </Card>

      <Card className="space-y-4 p-5 md:p-6">
        <h2 className="text-lg font-bold leading-snug text-textMain md:text-xl">{formatMathDisplay(current.stem)}</h2>
        {currentImageUrls.length ? (
          <div className={currentImageUrls.length > 1 ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'}>
            {currentImageUrls.map((imageUrl, imageIndex) => (
              <div key={`${imageUrl}-${imageIndex}`} className="overflow-hidden rounded-xl border border-primary/10 bg-white/80 p-2">
                <img
                  src={imageUrl}
                  alt={`原卷配图 ${imageIndex + 1}`}
                  loading="lazy"
                  className={`mx-auto w-auto max-w-full rounded-lg object-contain md:max-w-[560px] ${
                    currentImageUrls.length > 1 ? 'max-h-[220px]' : 'max-h-[300px]'
                  }`}
                />
              </div>
            ))}
          </div>
        ) : null}
        {isSelfCheckQuestion ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
            PDF截图题暂按“自评题”处理：先写出过程和结论，再点“查看参考答案”，最后根据比对结果选择“我答对了”或“我答错了”。
            {selfCheckReference
              ? ' 本题已匹配参考答案，作答后会在下方展开用于比对。'
              : ' 本题暂未匹配参考答案，请先自查。'}
          </div>
        ) : null}
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
                  {formatMathDisplay(option)}
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
              {isSelfCheckQuestion ? '最终结论（选项 / 结果 / 证明结论）' : questionType === 'open' ? '最终结论' : '最终答案'}
              <input
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder={isSelfCheckQuestion ? '如 A、42、∠ABC=50°，或写“已证明”' : '请输入最终结果，如 24 或 45°'}
                className="mt-1 w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm text-textMain"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {isSelfCheckQuestion ? (
            <>
              <Button onClick={onRevealSelfCheckReference}>查看参考答案</Button>
              <Button variant="secondary" onClick={() => onSelfCheck(true)}>
                我答对了
              </Button>
              <Button variant="secondary" onClick={() => onSelfCheck(false)}>
                我答错了（加入错题本）
              </Button>
            </>
          ) : (
            <Button onClick={onSubmit}>{isLastQuestion ? '完成并查看错题' : '提交本题'}</Button>
          )}
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
          <Button variant="ghost" onClick={onFavoriteCurrent}>
            <span className="inline-flex items-center gap-1">
              <Flag size={14} /> 收藏
            </span>
          </Button>
        </div>
        {submitHint ? <p className="text-sm text-amber-600">{submitHint}</p> : null}
        {isSelfCheckQuestion && showSelfCheckReference ? (
          <details open className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-emerald-800">
              查看参考答案 / 解析比对
            </summary>
            {selfCheckReference ? (
              <p className="mt-2 text-sm leading-6 text-textMain">{formatMathDisplay(selfCheckReference)}</p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-textSub">
                暂无参考答案。你可以先根据自己的过程自评；等答案册匹配完成后，这里会显示可比对的参考答案。
              </p>
            )}
          </details>
        ) : null}
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
                {formatMathDisplay(current.explanation)}
              </p>
              {!isSelfCheckQuestion ? (
                <p className="mt-2 text-sm font-medium text-textMain">
                  标准答案：{getCorrectAnswerDisplay(current)}
                </p>
              ) : null}
              <div className="mt-3 rounded-lg border border-primary/10 bg-primary/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    <Lightbulb size={14} /> 举一反三
                  </p>
                  <span className="text-sm text-textSub">
                    {similarQuestions.length
                      ? `已找到 ${similarQuestions.length} 道同类题`
                      : '当前筛选下暂未找到同类题'}
                  </span>
                </div>
                {similarQuestions.length ? (
                  <div className="mt-2 grid gap-2">
                    {similarQuestions.map((item, similarIndex) => (
                      <p key={item.id} className="truncate text-sm text-textMain">
                        {similarIndex + 1}. {formatMathDisplay(item.stem)}
                      </p>
                    ))}
                  </div>
                ) : null}
                <Button variant="secondary" className="mt-3" onClick={onPracticeSimilar}>
                  <Lightbulb size={15} /> 练这组同类题
                </Button>
              </div>
              {questionType === 'open' && current.referenceSteps?.length ? (
                <div className="mt-3 rounded-xl bg-bg/70 p-3 text-sm text-textSub">
                  <p className="mb-1 font-semibold text-textMain">参考步骤：</p>
                  {current.referenceSteps.map((step, i) => (
                    <p key={`${step}-${i}`}>{i + 1}. {formatMathDisplay(step)}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      )}

      {showSubmitConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-textMain">确认提交本组练习？</h3>
            <p className="mt-2 text-sm leading-6 text-textSub">
              本组共 {sessionQuestions.length} 题，已作答 {answeredCount} 题，未作答 {pendingCount} 题，已记录 {recordedCount} 题。
            </p>
            {pendingCount > 0 ? (
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                还有题目未完成。确认提交后，系统只会根据已作答题目归集错题。
              </p>
            ) : (
              <p className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                所有题目都已作答，可以提交并查看错题本。
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={onContinueSession}>
                继续检查
              </Button>
              <Button onClick={onConfirmSubmitSession}>
                确认提交
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
