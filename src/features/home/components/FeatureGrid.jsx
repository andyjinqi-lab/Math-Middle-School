import { BookOpen, LineChart, RotateCcw, Sparkles } from 'lucide-react'
import FeatureCard from './FeatureCard'

const features = [
  {
    title: '开始练习',
    desc: '按教材、章节、难度生成一组练习',
    status: '今日建议 10 题',
    action: '去练习',
    color: 'blue',
    icon: BookOpen,
    target: 'practice',
  },
  {
    title: '错题重练',
    desc: '把错题变成你的加分题',
    status: '错题本持续更新',
    action: '立即重练',
    color: 'orange',
    icon: RotateCcw,
    target: 'wrong',
  },
  {
    title: '举一反三',
    desc: '上传错题，解析后练会一类题',
    status: '支持输入 / 上传',
    action: '开始解析',
    color: 'cyan',
    icon: Sparkles,
    target: 'transfer',
  },
  {
    title: '学习成长',
    desc: '查看正确率、能量值和掌握度变化',
    status: '成长轨迹',
    action: '查看成长',
    color: 'purple',
    icon: LineChart,
    target: 'growth',
  },
]

export default function FeatureGrid({ onStartPractice, onOpenWrongBook, onOpenTransfer, onOpenGrowth }) {
  function getAction(feature) {
    if (feature.target === 'wrong') return onOpenWrongBook
    if (feature.target === 'transfer') return onOpenTransfer
    if (feature.target === 'growth') return onOpenGrowth
    return onStartPractice
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {features.map((feature) => (
        <FeatureCard key={feature.title} feature={feature} onClick={getAction(feature)} />
      ))}
    </section>
  )
}
