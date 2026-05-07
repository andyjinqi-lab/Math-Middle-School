import { cn } from '../../lib/utils'

export default function ProgressBar({ value, className, barClassName }) {
  return (
    <div className={cn('h-2.5 overflow-hidden rounded-full bg-primary/10', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r from-primary to-purple transition-all duration-500', barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
