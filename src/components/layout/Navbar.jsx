import { Bell, Flame, Search } from 'lucide-react'
import clsx from 'clsx'

const menus = [
  { id: 'home', label: '首页' },
  { id: 'practice', label: '开始练习' },
  { id: 'wrong', label: '错题本' },
  { id: 'parent', label: '家长看板' },
  { id: 'growth', label: '我的成长' },
]

export default function Navbar({ page, onSwitchPage, user, onLogout }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-purple text-white">
            Σ
          </div>
          <div>
            <p className="text-sm font-bold text-textMain">数学星球</p>
            <p className="text-xs text-textSub">Shanghai Edition</p>
          </div>
        </div>

        <nav className="ml-3 hidden gap-2 md:flex">
          {menus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              onClick={() => onSwitchPage(menu.id)}
              className={clsx(
                'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                page === menu.id ? 'bg-primary text-white shadow-soft' : 'text-textSub hover:bg-bg',
              )}
            >
              {menu.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm text-textSub md:flex">
            <Search size={16} />
            搜索知识点
          </div>
          <button type="button" className="rounded-xl bg-bg p-2.5 text-textSub hover:bg-primary/10">
            <Bell size={16} />
          </button>
          <div className="hidden items-center gap-1 rounded-xl bg-accent/20 px-2.5 py-2 text-xs font-semibold text-amber-700 sm:flex">
            <Flame size={14} />
            连续学习 5 天
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="hidden rounded-xl bg-bg px-3 py-2 text-xs text-textSub hover:bg-primary/10 sm:block"
          >
            退出
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-sm font-bold text-primary">
            {(user?.name ?? 'U').slice(0, 1)}
          </div>
        </div>
      </div>
    </header>
  )
}
