import { Coffee } from 'lucide-react';

export default function Cafe() {
  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          카페 글
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          공식 카페·커뮤니티에서 길드원이 알면 좋을 글 모음
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <Coffee className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">준비 중인 기능입니다</p>
        <p className="mt-1 text-xs text-muted-foreground">
          공식/비공식 카페 주요 글을 큐레이션해 공유할 예정입니다
        </p>
      </div>
    </div>
  );
}
