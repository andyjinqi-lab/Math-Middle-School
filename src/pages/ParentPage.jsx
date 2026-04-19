import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from 'recharts'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function ParentPage({ user, summary, chapterStats, trendData }) {
  const weak = [...chapterStats].sort((a, b) => a.progress - b.progress)

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-br from-white via-indigo-50 to-white">
        <p className="text-sm text-textSub">家长看板 · {user.name}</p>
        <h2 className="mt-2 text-2xl font-bold text-textMain">学习监督总览</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Stat title="累计做题" value={`${summary.total} 题`} />
          <Stat title="平均正确率" value={`${summary.accuracy}%`} />
          <Stat title="累计正确" value={`${summary.correct} 题`} />
          <Stat title="学习天数" value={`${Math.max(1, Math.floor(summary.total / 8))} 天`} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm text-textSub">近 7 天学习趋势</p>
          <div className="h-64">
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
        <Card>
          <p className="mb-3 text-sm text-textSub">章节掌握度</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chapterStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5ECF7" />
                <XAxis dataKey="title" hide />
                <YAxis tick={{ fill: '#6B7A90', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="progress" fill="#35C9A5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-sm text-textSub">建议优先陪练章节</p>
        <div className="grid gap-3 md:grid-cols-2">
          {weak.map((item) => (
            <div key={item.id} className="rounded-2xl bg-bg p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-textMain">{item.title}</p>
                <Badge tone={item.progress < 60 ? 'red' : 'orange'}>{item.progress}%</Badge>
              </div>
              <p className="mt-1 text-xs text-textSub">
                建议本周额外练习 {Math.max(3, 10 - Math.floor(item.progress / 10))} 题，并复盘错题原因。
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Stat({ title, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs text-textSub">{title}</p>
      <p className="mt-1 text-xl font-bold text-textMain">{value}</p>
    </div>
  )
}
