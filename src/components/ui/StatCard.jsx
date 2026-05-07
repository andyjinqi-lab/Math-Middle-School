import { cn } from '../../lib/utils'

export default function StatCard({ label, value, icon, trend, hint, variant = 'light', className }) {
  const dark = variant === 'dark'

  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        dark
          ? 'border-white/[0.12] bg-white/[0.08] text-white'
          : 'border-borderLight bg-white text-textMain shadow-card',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={cn('text-xs font-semibold', dark ? 'text-white/70' : 'text-textSub')}>{label}</p>
          <p className={cn('mt-1 text-2xl font-black tracking-wide', dark ? 'text-white' : 'text-textMain')}>
            {value}
          </p>
        </div>
        {icon ? <div className={cn(dark ? 'text-cyan' : 'text-primary')}>{icon}</div> : null}
      </div>
      {trend ? <p className={cn('mt-2 text-xs font-bold', dark ? 'text-white/75' : 'text-textSub')}>{trend}</p> : null}
      {hint ? <p className={cn('mt-2 text-xs leading-5', dark ? 'text-white/[0.68]' : 'text-textSub')}>{hint}</p> : null}
    </div>
  )
}
