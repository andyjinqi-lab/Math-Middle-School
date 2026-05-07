import { cn } from '../../lib/utils'

export default function PageContainer({ children, className }) {
  return (
    <main className={cn('mx-auto w-full max-w-[1440px] px-4 py-5 md:px-8 md:py-6', className)}>
      {children}
    </main>
  )
}
