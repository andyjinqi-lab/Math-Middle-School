import clsx from 'clsx'

export default function Button({ children, variant = 'primary', className, ...props }) {
  const baseClass =
    'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95'

  const variants = {
    primary:
      'bg-primary text-white shadow-soft hover:scale-105 hover:shadow-md hover:brightness-105',
    secondary: 'bg-white text-textMain border border-primary/20 hover:scale-105 hover:shadow-md',
    ghost: 'bg-white/70 text-textSub hover:bg-white hover:text-textMain',
  }

  return (
    <button className={clsx(baseClass, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}
