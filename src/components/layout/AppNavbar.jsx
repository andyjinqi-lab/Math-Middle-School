import { Bell, Flame, Search } from 'lucide-react'
import { cn } from '../../lib/utils'

const menus = [
  { id: 'home', label: '首页' },
  { id: 'practice', label: '开始练习' },
  { id: 'wrong', label: '错题本' },
  { id: 'parent', label: '家长看板' },
  { id: 'growth', label: '我的成长' },
]

export default function AppNavbar({
  page,
  onSwitchPage,
  user,
  onLogout,
  onSearchClick,
  onNotifyClick,
}) {
  return (
    <header className="sticky top-0 z-10 h-[72px] border-b border-[rgba(148,163,184,0.18)] bg-white/82 backdrop-blur-2xl">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center gap-3 px-4 md:px-8">
        <button type="button" onClick={() => onSwitchPage('home')} className="flex items-center gap-2">
          <div className="relative grid h-11 w-11 place-items-center rounded-[18px] bg-gradient-to-br from-primary via-secondary to-cyan text-lg font-black text-white shadow-card">
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange shadow-sm" />
            Σ
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-textMain">数学星球</p>
            <p className="text-xs font-semibold text-textSub">闯关练习系统</p>
          </div>
        </button>

        <nav className="ml-3 hidden gap-1 lg:flex">
          {menus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              onClick={() => onSwitchPage(menu.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-bold transition-all duration-200',
                page === menu.id
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-card'
                  : 'text-textSub hover:bg-softBlue hover:text-textMain',
              )}
            >
              {menu.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSearchClick}
            className="hidden min-w-[240px] items-center gap-2 rounded-full border border-white bg-softBlue/90 px-3 py-2 text-left text-sm font-semibold text-textSub shadow-sm hover:bg-white md:flex"
          >
            <Search size={16} />
            <span>搜索知识点 / 题型 / 错题</span>
          </button>
          <button
            type="button"
            onClick={onNotifyClick}
            className="rounded-2xl bg-white p-2.5 text-textSub shadow-card hover:bg-softBlue"
            aria-label="查看学习提醒"
          >
            <Bell size={16} />
          </button>
          <button
            type="button"
            onClick={() => onSwitchPage('growth')}
            className="hidden items-center gap-1 rounded-full bg-orange/15 px-3 py-2 text-xs font-black text-amber-700 hover:bg-orange/20 sm:flex"
          >
            <Flame size={14} />
            连续学习 5 天
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="hidden rounded-2xl bg-white px-3 py-2 text-xs font-bold text-textSub shadow-card hover:bg-softBlue sm:block"
          >
            退出
          </button>
          <button
            type="button"
            onClick={() => onSwitchPage('growth')}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-softBlue to-softPurple text-sm font-black text-primary shadow-card hover:shadow-lift"
            aria-label="打开我的成长"
          >
            {(user?.name ?? 'U').slice(0, 1)}
          </button>
        </div>
      </div>
    </header>
  )
}
