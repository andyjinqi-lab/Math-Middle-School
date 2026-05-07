import { Flame, Rocket, Star, Trophy } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { badges } from '../../../data/mockData'

export default function GrowthBadges({ summary }) {
  return (
    <Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['当前等级', 'Lv.3 数学挑战者', Rocket, 'text-primary', 'bg-softBlue'],
          ['能量值', summary.energy, Star, 'text-amber-600', 'bg-amber-50'],
          ['连续学习', `${Math.max(1, Math.floor(summary.total / 8))} 天`, Flame, 'text-orange-600', 'bg-orange-50'],
          ['已获徽章', `${badges.length} 枚`, Trophy, 'text-purple', 'bg-softPurple'],
        ].map(([label, value, Icon, tone, bg]) => (
          <div key={label} className={`rounded-2xl ${bg} p-4`}>
            <p className="text-sm text-textSub">{label}</p>
            <div className={`mt-2 flex items-center gap-2 ${tone}`}>
              <Icon size={18} />
              <p className="font-black">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge key={badge} color="purple">
            {badge}
          </Badge>
        ))}
      </div>
    </Card>
  )
}
