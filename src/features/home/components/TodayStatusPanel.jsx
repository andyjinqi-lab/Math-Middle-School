import { BookOpenCheck, Gauge, Orbit, Zap } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'

export default function TodayStatusPanel({ summary }) {
  const progress = Math.min(100, summary.total * 2)
  const suggestion =
    summary.accuracy < 60
      ? '建议先完成 3 个基础知识点，正确率会更稳。'
      : '今天状态不错，可以挑战一组提升题。'

  return (
    <section
      className="relative min-h-full overflow-hidden rounded-3xl border border-white p-5 text-textMain"
      style={{
        background: 'linear-gradient(145deg, #EAF3FF 0%, #F5F8FF 48%, #EEF4FF 100%)',
        boxShadow: '0 24px 60px rgba(43, 83, 180, 0.12)',
      }}
    >
      <div className="absolute inset-0 math-grid opacity-70" />
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-cyan/30 bg-white/30" />
      <div className="absolute right-7 top-14 h-24 w-24 rounded-full border border-primary/10" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/55 to-transparent" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-textSub">学习驾驶舱</p>
            <h2 className="mt-1 text-xl font-black text-textMain">今日状态</h2>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white bg-white/80 text-cyan shadow-card">
            <Orbit size={22} />
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <StatCard label="累计完成" value={`${summary.total} 题`} icon={<BookOpenCheck size={22} />} />
          <StatCard label="今日正确率" value={`${summary.accuracy}%`} icon={<Gauge size={22} />} />
          <StatCard label="累计能量" value={summary.energy} icon={<Zap size={22} />} />
        </div>

        <div className="mt-5 rounded-2xl border border-white bg-white/82 p-4 shadow-card">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-textSub">能量路线</span>
            <span className="font-black text-primary">{progress}%</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan to-secondary" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-textSub">{suggestion}</p>
        </div>
      </div>
    </section>
  )
}
