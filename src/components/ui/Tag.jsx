import clsx from 'clsx'

export default function Tag({ children, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
        active
          ? 'bg-primary text-white shadow-soft'
          : 'bg-white text-textSub hover:-translate-y-0.5 hover:text-textMain hover:shadow-sm',
      )}
    >
      {children}
    </button>
  )
}
