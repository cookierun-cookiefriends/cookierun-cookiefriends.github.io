import { useState, useEffect, type ComponentType } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Swords,
  Megaphone,
  Ticket,
  Coffee,
  Settings as SettingsIcon,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IconType = ComponentType<{ className?: string }>;

interface NavItem {
  to: string;
  icon: IconType;
  label: string;
  end?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ to: '/', icon: LayoutDashboard, label: '대시보드', end: true }],
  },
  {
    label: '길드 토벌전',
    items: [{ to: '/raid', icon: Swords, label: '시즌 기록' }],
  },
  {
    label: '길드 활동',
    items: [
      { to: '/notice', icon: Megaphone, label: '공지사항' },
      { to: '/coupon', icon: Ticket, label: '쿠폰' },
      { to: '/cafe', icon: Coffee, label: '카페 글' },
    ],
  },
  {
    items: [{ to: '/settings', icon: SettingsIcon, label: '설정' }],
  },
];

function BrandHeader({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="px-5 py-5 border-b border-border">
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className="flex items-center gap-2 text-base font-semibold tracking-tight"
      >
        <span className="inline-block size-2 rounded-full bg-foreground" />
        쿠키프렌즈
      </NavLink>
      <p className="mt-1 text-[11px] text-muted-foreground tracking-wide">
        Guild Dashboard
      </p>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 flex flex-col gap-5 p-3 overflow-y-auto">
      {navSections.map((section, idx) => (
        <div key={idx}>
          {section.label && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* PC/Tablet 사이드바 */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <BrandHeader />
        <SidebarNav />
      </aside>

      {/* 모바일 사이드바 (슬라이드 인) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex w-64 flex-col bg-card border-r border-border">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              aria-label="메뉴 닫기"
            >
              <X className="h-4 w-4" />
            </button>
            <BrandHeader onNavigate={() => setMobileOpen(false)} />
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 모바일 상단 헤더 */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-semibold text-sm tracking-tight">
            <span className="inline-block size-1.5 rounded-full bg-foreground" />
            쿠키프렌즈
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
