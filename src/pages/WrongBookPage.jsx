import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Tag from '../components/ui/Tag'
import Badge from '../components/ui/Badge'
import { useMemo, useState } from 'react'

const filters = ['全部', '按章节', '按错误次数', '按最近时间']

function formatTs(ts) {
  if (!ts) return '暂无'
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function getCorrectAnswerDisplay(question) {
  if (!question) return '暂无正确答案'
  const isChoice = question.questionType === 'choice' || Array.isArray(question.options)
  if (isChoice) {
    const raw = question.options?.[question.answer] ?? ''
    return `${raw}`.replace(/^[A-D]\.\s*/, '') || '暂无正确答案'
  }
  return `${question.answer ?? '暂无正确答案'}`
}

export default function WrongBookPage({ wrongQuestions, chapterNameMap, questionMap, onPracticeWrong }) {
  const [filter, setFilter] = useState(filters[0])
  const stats = useMemo(() => {
    const uniqueCount = wrongQuestions.length
    const totalWrongAttempts = wrongQuestions.reduce((sum, item) => sum + (item.count || 0), 0)
    const latestTs = wrongQuestions.reduce((max, item) => Math.max(max, item.ts || 0), 0)
    return {
      uniqueCount,
      totalWrongAttempts,
      latestDateText: formatTs(latestTs),
    }
  }, [wrongQuestions])

  const sortedList = useMemo(() => {
    const list = [...wrongQuestions]
    if (filter === '按错误次数') return list.sort((a, b) => b.count - a.count)
    if (filter === '按最近时间') return list.sort((a, b) => b.ts - a.ts)
    if (filter === '按章节') {
      return list.sort((a, b) => {
        const aName = chapterNameMap[a.chapterId] ?? a.chapterId
        const bName = chapterNameMap[b.chapterId] ?? b.chapterId
        return aName.localeCompare(bName, 'zh-Hans-CN')
      })
    }
    return list
  }, [filter, wrongQuestions, chapterNameMap])

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-br from-white via-orange-50 to-white">
        <h2 className="text-2xl font-bold text-textMain">这些题再练一练就会啦</h2>
        <p className="mt-2 text-sm text-textSub">
          当前待重练 {wrongQuestions.length} 题，先从错误次数最多的题开始最划算。
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Badge tone="orange">累计错题尝试 {stats.totalWrongAttempts} 次</Badge>
          <Badge tone="purple">去重错题 {stats.uniqueCount} 题</Badge>
          <Badge tone="blue">最近出错 {stats.latestDateText}</Badge>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-textSub">
            <SlidersHorizontal size={14} /> 筛选
          </span>
          {filters.map((item) => (
            <Tag key={item} active={filter === item} onClick={() => setFilter(item)}>
              {item}
            </Tag>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {sortedList.length === 0 ? (
          <Card>
            <p className="text-sm text-textSub">还没有错题，先去练习页做一轮题目吧。</p>
          </Card>
        ) : (
          sortedList.map((item) => {
            const question = questionMap?.[item.questionId ?? item.id]
            return (
              <Card key={item.id}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="truncate text-base font-semibold text-textMain">{item.title}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">{chapterNameMap[item.chapterId] ?? item.chapterId}</Badge>
                      <Badge tone={item.count > 3 ? 'red' : 'orange'}>错误 {item.count} 次</Badge>
                      <Badge tone="purple">{formatTs(item.ts)}</Badge>
                    </div>
                    <p className="text-sm text-textMain">
                      <span className="font-semibold">正确答案：</span>
                      {getCorrectAnswerDisplay(question)}
                    </p>
                    <p className="text-sm text-textSub">
                      <span className="font-semibold text-textMain">解题过程：</span>
                      {question?.explanation ?? '暂未提供解析。'}
                    </p>
                  </div>

                  <Button onClick={() => onPracticeWrong(item)}>
                    <span className="inline-flex items-center gap-1">
                      <RotateCcw size={14} /> 重新练习
                    </span>
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
