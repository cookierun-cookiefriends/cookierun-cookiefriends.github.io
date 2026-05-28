import { Megaphone } from 'lucide-react';

export default function Notice() {
  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          공지사항
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          길드 운영, 이벤트, 일정 안내
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <Megaphone className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">준비 중인 기능입니다</p>
        <p className="mt-1 text-xs text-muted-foreground">
          길드 공지/이벤트/일정을 한 곳에서 관리할 예정입니다
        </p>
      </div>
    </div>
  );
}
