import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled,
  className,
  ...props
}) {
  const baseClass =
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-bold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:scale-100'

  const variants = {
    primary:
      'bg-gradient-to-r from-primary to-purple text-white shadow-card hover:-translate-y-0.5 hover:shadow-lift hover:brightness-105',
    secondary:
      'border border-borderPrimary bg-white text-textMain shadow-soft hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
    ghost: 'bg-white/65 text-textSub hover:bg-white hover:text-textMain',
    link: 'rounded-none bg-transparent p-0 text-primary hover:text-primaryHover',
  }

  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  }

  return (
    <button
      className={cn(baseClass, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : iconLeft}
      {children}
      {iconRight}
    </button>
  )
}
