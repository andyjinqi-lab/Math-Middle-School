import { cn } from '../../lib/utils'

const colorClasses = {
  blue: 'from-primary to-blue-400',
  green: 'from-secondary to-emerald-400',
  orange: 'from-accent to-orange-400',
  cyan: 'from-cyan to-sky-400',
  purple: 'from-purple to-indigo-500',
  red: 'from-error to-rose-400',
}

const sizeClasses = {
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-12 w-12 rounded-2xl',
  lg: 'h-14 w-14 rounded-2xl',
}

export default function IconBox({ icon, color = 'blue', size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-grid place-items-center bg-gradient-to-br text-white shadow-card',
        colorClasses[color],
        sizeClasses[size],
        className,
      )}
    >
      {icon}
    </span>
  )
}
