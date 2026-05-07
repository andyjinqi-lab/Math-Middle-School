import { Map } from 'lucide-react'
import Card from '../../../components/ui/Card'
import ProgressBar from '../../../components/ui/ProgressBar'

export default function LearningProgressCard({ summary }) {
  const progress = Math.min(100, summary.total * 2)
  const completed = Math.min(10, Math.round(summary.total / 3))
  const pending = Math.max(0, 10 - completed)

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-textMain">学习完成度</p>
          <p className="mt-1 text-sm text-textSub">今日任务路径</p>
        </div>
        <Map className="text-primary" size={22} />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center">
        <div
          className="grid h-36 w-36 place-items-center rounded-full"
          style={{ background: `conic-gradient(#5B6CFF ${progress}%, #EEF4FF ${progress}% 100%)` }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-card">
            <div className="text-center">
              <p className="text-3xl font-black text-primary">{progress}%</p>
              <p className="text-xs font-bold text-textSub">阶段推进</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-bold text-textMain">今日任务</span>
              <span className="font-black text-primary">{completed}/10</span>
            </div>
            <ProgressBar value={completed * 10} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-softBlue p-3">
              <p className="text-xs font-bold text-textSub">已完成</p>
              <p className="mt-1 text-xl font-black text-textMain">{completed} 题</p>
            </div>
            <div className="rounded-2xl bg-softPurple p-3">
              <p className="text-xs font-bold text-textSub">待完成</p>
              <p className="mt-1 text-xl font-black text-textMain">{pending} 题</p>
            </div>
          </div>
          <p className="rounded-2xl bg-orange/10 px-3 py-2 text-sm font-semibold text-amber-700">
            建议下一步：先完成同步练习，再进入专项突破。
          </p>
        </div>
      </div>
    </Card>
  )
}
