import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'

const fallbackTrend = [
  { day: 'D1', accuracy: 42 },
  { day: 'D2', accuracy: 55 },
  { day: 'D3', accuracy: 48 },
  { day: 'D4', accuracy: 63 },
  { day: 'D5', accuracy: 58 },
  { day: 'D6', accuracy: 71 },
  { day: 'D7', accuracy: 76 },
]

export default function AccuracyTrendCard({ trendData }) {
  const data = Array.isArray(trendData) && trendData.length ? trendData : fallbackTrend

  return (
    <Card className="xl:col-span-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-textMain">最近 7 天正确率趋势</p>
          <p className="mt-1 text-sm text-textSub">观察最近练习稳定性</p>
        </div>
        <Badge color="blue">Recharts</Badge>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5ECF7" />
            <XAxis dataKey="day" tick={{ fill: '#61708A', fontSize: 12 }} />
            <YAxis tick={{ fill: '#61708A', fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#5B6CFF"
              strokeWidth={3}
              dot={{ r: 4, fill: '#7C5CFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
