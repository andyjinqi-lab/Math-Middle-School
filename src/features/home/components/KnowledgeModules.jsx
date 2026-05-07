import { BookOpenCheck } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import ProgressBar from '../../../components/ui/ProgressBar'

export default function KnowledgeModules({ chapterStats, textbooks, selectedTextbookId, onSelectTextbook, onStartPractice }) {
  return (
    <section className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black text-textMain">当前教材：</p>
          {textbooks.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onSelectTextbook(book.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                selectedTextbookId === book.id
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-softBlue text-textSub hover:bg-primary/10'
              }`}
            >
              {book.name}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chapterStats.map((module) => (
          <Card key={module.id} hoverable>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold leading-snug text-textMain">{module.title}</h3>
              <Badge color={module.progress > 75 ? 'green' : 'orange'}>掌握 {module.progress}%</Badge>
            </div>
            <div className="mt-3">
              <ProgressBar value={module.progress} />
            </div>
            <p className="mt-3 text-sm text-textSub">建议再练 {module.recommendCount} 题</p>
            <Button className="mt-4 w-full" onClick={onStartPractice} iconLeft={<BookOpenCheck size={16} />}>
              继续练习
            </Button>
          </Card>
        ))}
      </div>
    </section>
  )
}
