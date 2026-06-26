import { Outlet, NavLink } from 'react-router-dom';
import { Home as HomeIcon, Swords, ScrollText, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { NoticeBanner } from '@/components/NoticeBanner';

const navItems = [
  { to: '/', icon: HomeIcon, label: '홈' },
  { to: '/guild', icon: Swords, label: '토벌전' },
  { to: '/patchnotes', icon: ScrollText, label: '패치노트' },
  { to: '/settings', icon: SettingsIcon, label: '설정' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <div className="p-6">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="inline-block size-2 rounded-full bg-primary" />
            쿠키프렌즈
          </NavLink>
          <p className="mt-1 text-xs text-muted-foreground">길드 대시보드</p>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/15 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border flex justify-center">
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-card">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <NoticeBanner />
    </div>
  );
}
