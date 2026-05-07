import { ArrowRight, BookOpenCheck, RotateCcw } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import TodayStatusPanel from './TodayStatusPanel'

function FloatingMathSymbols() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-primary/15">
      <span className="absolute left-[8%] top-[18%] text-3xl font-black">π</span>
      <span className="absolute left-[32%] top-[10%] text-xl font-black">x²</span>
      <span className="absolute bottom-[18%] left-[46%] text-2xl font-black">√</span>
      <span className="absolute right-[34%] top-[28%] text-3xl font-black">Σ</span>
      <span className="absolute bottom-[12%] right-[18%] text-xl font-black">∠</span>
    </div>
  )
}

export default function HomeHero({ summary, onStartPractice, onOpenWrongBook }) {
  return (
    <section className="math-grid relative overflow-hidden rounded-[var(--radius-xl)] border border-white bg-gradient-to-br from-white via-softBlue to-softPurple shadow-card">
      <FloatingMathSymbols />
      <div className="relative grid gap-6 p-5 lg:grid-cols-[minmax(0,0.62fr)_minmax(360px,0.38fr)] md:p-8">
        <div className="flex min-h-[330px] flex-col justify-center">
          <div className="flex flex-wrap gap-2">
            <Badge color="purple">上海初中同步练习</Badge>
            <Badge color="orange">今日推荐</Badge>
            <Badge color="green">AI 已生成路线</Badge>
          </div>
          <div className="mt-5 max-w-3xl space-y-4">
            <h1 className="text-4xl font-black leading-tight text-textMain md:text-5xl">
              今天从 10 道题开始，稳稳拿下薄弱点
            </h1>
            <p className="max-w-2xl text-base leading-8 text-textSub">
              根据你的错题和课本进度，系统已生成今日专属练习路线。
            </p>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={onStartPractice} iconLeft={<BookOpenCheck size={17} />}>
              开始今日练习
            </Button>
            <Button size="lg" variant="secondary" onClick={onOpenWrongBook} iconLeft={<RotateCcw size={17} />}>
              查看错题本
            </Button>
            <Button variant="link" onClick={onStartPractice} iconRight={<ArrowRight size={15} />}>
              继续上次进度
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {['函数图像', '方程应用题', '几何证明'].map((item) => (
              <span key={item} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-textSub">
                推荐复习：{item}
              </span>
            ))}
          </div>
        </div>
        <TodayStatusPanel summary={summary} />
      </div>
    </section>
  )
}
