import { ArrowRight } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import IconBox from '../../../components/ui/IconBox'
import { cn } from '../../../lib/utils'

const borderHover = {
  blue: 'hover:border-primary/35',
  green: 'hover:border-secondary/45',
  orange: 'hover:border-accent/45',
  cyan: 'hover:border-cyan/45',
  purple: 'hover:border-purple/45',
  red: 'hover:border-error/45',
}

export default function FeatureCard({ feature, onClick }) {
  const Icon = feature.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-lg)] border border-borderLight bg-white p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift',
        borderHover[feature.color],
      )}
    >
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-softBlue/70 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <IconBox color={feature.color} icon={<Icon size={22} />} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black text-textMain">{feature.title}</h3>
            <ArrowRight className="mt-1 shrink-0 text-textMuted transition group-hover:translate-x-1 group-hover:text-primary" size={18} />
          </div>
          <p className="mt-1 text-sm leading-6 text-textSub">{feature.desc}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge color={feature.color === 'cyan' ? 'blue' : feature.color}>{feature.status}</Badge>
            <span className="text-xs font-black text-textMuted">{feature.action}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
