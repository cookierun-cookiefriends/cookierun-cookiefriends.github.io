import { Ticket } from 'lucide-react';

export default function Coupon() {
  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          쿠폰
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          게임 쿠폰 코드 모음 (만료일 표시)
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <Ticket className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">준비 중인 기능입니다</p>
        <p className="mt-1 text-xs text-muted-foreground">
          현재 유효한 쿠폰을 한 번에 복사할 수 있게 정리할 예정입니다
        </p>
      </div>
    </div>
  );
}
