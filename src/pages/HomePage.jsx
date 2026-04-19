import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Flame, Rocket, Star, Trophy } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { quickActions, badges } from '../data/mockData'

function Hero({ summary }) {
  return (
    <Card className="math-grid relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple/20 blur-xl" />
      <div className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Badge tone="purple">上海初中同步练习</Badge>
          <h1 className="text-3xl font-bold leading-tight text-textMain md:text-4xl">
            今天也来征服一道
            <span className="text-primary"> 数学难题 </span>
            吧！
          </h1>
          <p className="text-textSub">查漏补缺，稳步提分。再做 3 题就能点亮今日数学能量。</p>
          <div className="flex flex-wrap gap-3">
            <Button>开始今日练习</Button>
            <Button variant="secondary">查看错题本</Button>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            ['累计完成', `${summary.total} 题`],
            ['正确率', `${summary.accuracy}%`],
            ['累计能量', `${summary.energy}`],
          ].map(([k, v]) => (
            <div key={k} className="animate-float rounded-2xl bg-white/90 p-4 shadow-soft">
              <p className="text-xs text-textSub">{k}</p>
              <p className="mt-1 text-xl font-bold text-textMain">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {quickActions.map((item) => (
        <Card key={item.title} className="group">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-textMain">{item.title}</h3>
              <p className="text-sm text-textSub">{item.desc}</p>
            </div>
            <div
              className={`h-9 w-9 rounded-xl bg-gradient-to-br ${item.tone} shadow-soft transition-all duration-200 group-hover:scale-110`}
            />
          </div>
          <p className="mt-4 text-sm font-medium text-primary">{item.stat}</p>
        </Card>
      ))}
    </div>
  )
}

function Dashboard({ trendData, summary }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-1">
        <p className="text-sm text-textSub">学习完成度（阶段）</p>
        <div className="mt-4 grid place-items-center">
          <div className="grid h-40 w-40 place-items-center rounded-full border-[12px] border-primary/15">
            <p className="text-3xl font-bold text-primary">{Math.min(100, summary.total * 2)}%</p>
            <p className="text-xs text-textSub">累计完成 {summary.total} 题</p>
          </div>
        </div>
      </Card>
      <Card className="xl:col-span-2">
        <p className="mb-3 text-sm text-textSub">最近 7 天正确率趋势</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5ECF7" />
              <XAxis dataKey="day" tick={{ fill: '#6B7A90', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7A90', fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="accuracy" stroke="#4F7DF3" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="xl:col-span-3">
        <p className="mb-3 text-sm text-textSub">本周练习量（题）</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5ECF7" />
              <XAxis dataKey="day" tick={{ fill: '#6B7A90', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7A90', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#35C9A5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

function KnowledgeModules({ chapterStats, textbooks, selectedTextbookId, onSelectTextbook }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-textMain">当前教材：</p>
          {textbooks.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onSelectTextbook(book.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedTextbookId === book.id
                  ? 'bg-primary text-white'
                  : 'bg-bg text-textSub hover:bg-primary/10'
              }`}
            >
              {book.name}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chapterStats.map((module) => (
          <Card key={module.id}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-textMain">{module.title}</h3>
              <Badge tone={module.progress > 75 ? 'green' : 'orange'}>掌握度 {module.progress}%</Badge>
            </div>
            <div className="mt-3">
              <ProgressBar value={module.progress} />
            </div>
            <p className="mt-3 text-sm text-textSub">建议再练 {module.recommendCount} 题</p>
            <Button className="mt-4 w-full">继续练习</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Gamification({ summary }) {
  return (
    <Card className="bg-gradient-to-br from-white via-amber-50 to-violet-50">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-textSub">当前等级</p>
          <div className="mt-2 flex items-center gap-2 text-primary">
            <Rocket size={18} />
            <p className="font-bold">Lv.3 数学挑战者</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-textSub">能量值</p>
          <div className="mt-2 flex items-center gap-2 text-amber-600">
            <Star size={18} />
            <p className="font-bold">{summary.energy}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-textSub">连续学习</p>
          <div className="mt-2 flex items-center gap-2 text-orange-600">
            <Flame size={18} />
            <p className="font-bold">{Math.max(1, Math.floor(summary.total / 8))} 天</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-textSub">已获徽章</p>
          <div className="mt-2 flex items-center gap-2 text-purple">
            <Trophy size={18} />
            <p className="font-bold">{badges.length} 枚</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge key={badge} tone="purple">
            {badge}
          </Badge>
        ))}
      </div>
    </Card>
  )
}

export default function HomePage({
  summary,
  trendData,
  chapterStats,
  textbooks,
  selectedTextbookId,
  onSelectTextbook,
}) {
  return (
    <div className="space-y-5">
      <Hero summary={summary} />
      <QuickActions />
      <Dashboard trendData={trendData} summary={summary} />
      <KnowledgeModules
        chapterStats={chapterStats}
        textbooks={textbooks}
        selectedTextbookId={selectedTextbookId}
        onSelectTextbook={onSelectTextbook}
      />
      <Gamification summary={summary} />
    </div>
  )
}
