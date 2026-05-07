import { cn } from '../../lib/utils'

export default function Card({
  children,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  className,
}) {
  const variants = {
    default: 'border-borderLight bg-surface text-textMain shadow-card',
    glass: 'border-white/70 bg-white/72 text-textMain shadow-card backdrop-blur-xl',
    dark: 'border-white/12 bg-darkPanel text-white shadow-panel',
    gradient: 'border-white bg-gradient-to-br from-white via-softBlue to-softPurple text-textMain shadow-card',
  }

  const paddings = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6 md:p-8',
  }

  return (
    <section
      className={cn(
        'rounded-[var(--radius-lg)] border transition-all duration-200',
        variants[variant],
        paddings[padding],
        hoverable && 'hover:-translate-y-1 hover:border-borderPrimary hover:shadow-lift',
        className,
      )}
    >
      {children}
    </section>
  )
}
