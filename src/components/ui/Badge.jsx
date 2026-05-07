import { cn } from '../../lib/utils'

export default function Badge({ children, tone, color = tone ?? 'blue', size = 'sm', className }) {
  const colors = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-secondary/15 text-emerald-700',
    orange: 'bg-accent/20 text-amber-700',
    purple: 'bg-purple/15 text-purple',
    red: 'bg-error/10 text-error',
    gray: 'bg-slate-100 text-textSub',
  }

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  }

  return (
    <span className={cn('inline-flex items-center rounded-full font-bold', sizes[size], colors[color], className)}>
      {children}
    </span>
  )
}
