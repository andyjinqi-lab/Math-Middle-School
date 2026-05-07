import { cn } from '../../lib/utils'

export default function SectionHeader({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-wide text-primary">{eyebrow}</p> : null}
        <h2 className="mt-1 text-xl font-black text-textMain md:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-textSub">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
