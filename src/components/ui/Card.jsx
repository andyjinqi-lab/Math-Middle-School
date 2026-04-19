import clsx from 'clsx'

export default function Card({ children, className }) {
  return (
    <section
      className={clsx(
        'rounded-3xl border border-white/80 bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      {children}
    </section>
  )
}
