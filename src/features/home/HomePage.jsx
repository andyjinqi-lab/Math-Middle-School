import AccuracyTrendCard from './components/AccuracyTrendCard'
import FeatureGrid from './components/FeatureGrid'
import GrowthBadges from './components/GrowthBadges'
import HomeHero from './components/HomeHero'
import KnowledgeModules from './components/KnowledgeModules'
import LearningProgressCard from './components/LearningProgressCard'

export default function HomePage({
  summary,
  trendData,
  chapterStats,
  textbooks,
  selectedTextbookId,
  onSelectTextbook,
  onStartPractice,
  onOpenWrongBook,
  onOpenTransfer,
  onOpenGrowth,
}) {
  return (
    <div className="space-y-6">
      <HomeHero summary={summary} onStartPractice={onStartPractice} onOpenWrongBook={onOpenWrongBook} />
      <FeatureGrid
        onStartPractice={onStartPractice}
        onOpenWrongBook={onOpenWrongBook}
        onOpenTransfer={onOpenTransfer}
        onOpenGrowth={onOpenGrowth}
      />
      <section className="grid gap-5 xl:grid-cols-3">
        <LearningProgressCard summary={summary} />
        <AccuracyTrendCard trendData={trendData} />
      </section>
      <KnowledgeModules
        chapterStats={chapterStats}
        textbooks={textbooks}
        selectedTextbookId={selectedTextbookId}
        onSelectTextbook={onSelectTextbook}
        onStartPractice={onStartPractice}
      />
      <GrowthBadges summary={summary} />
    </div>
  )
}
