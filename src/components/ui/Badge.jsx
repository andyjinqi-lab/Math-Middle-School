import clsx from 'clsx'

export default function Badge({ children, tone = 'blue', className }) {
  const tones = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-secondary/15 text-secondary',
    orange: 'bg-accent/20 text-amber-700',
    purple: 'bg-purple/15 text-purple',
    red: 'bg-error/10 text-error',
  }

  return (
    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}
