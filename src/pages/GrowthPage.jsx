import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Award, CalendarDays, ChartColumnBig, GraduationCap } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { badges } from '../data/mockData'

export default function GrowthPage({ summary, trendData, radarData, chapterStats }) {
  const bestChapter = [...chapterStats].sort((a, b) => b.progress - a.progress)[0]
  const weakChapter = [...chapterStats].sort((a, b) => a.progress - b.progress)[0]

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="font-bold text-textMain">学习档案</p>
              <p className="text-sm text-textSub">当前教材下的阶段表现</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-textSub">
            <p className="inline-flex items-center gap-1">
              <CalendarDays size={14} /> 学习天数：{Math.max(1, Math.floor(summary.total / 8))} 天
            </p>
            <p className="inline-flex items-center gap-1">
              <ChartColumnBig size={14} /> 总做题：{summary.total} 题
            </p>
            <p>平均正确率：{summary.accuracy}%</p>
            <p>最强章节：{bestChapter?.title ?? '待练习生成'}</p>
            <p>待提升：{weakChapter?.title ?? '待练习生成'}</p>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <p className="mb-2 text-sm text-textSub">近 7 天正确率</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5ECF7" />
                <XAxis dataKey="day" tick={{ fill: '#6B7A90', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7A90', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" stroke="#A78BFA" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <p className="mb-2 text-sm text-textSub">掌握度雷达图（当前教材）</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7A90', fontSize: 12 }} />
                <Radar name="掌握度" dataKey="score" fill="#4F7DF3" fillOpacity={0.4} stroke="#4F7DF3" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm text-textSub">徽章成就</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <div key={badge} className="rounded-2xl bg-bg p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-textMain">
                  <Award className="text-accent" size={16} /> {badge}
                </p>
                <p className="mt-1 text-xs text-textSub">已达成，继续保持这个节奏。</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="green">累计正确：{summary.correct} 题</Badge>
            <Badge tone="orange">本周目标：再做 {Math.max(20, 80 - summary.total)} 题</Badge>
          </div>
        </Card>
      </div>
    </div>
  )
}
