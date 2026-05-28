import { useNicknameStore } from '@/stores/nickname';
import { useIndex } from '@/hooks/queries';

export default function Home() {
  const nickname = useNicknameStore((s) => s.nickname);
  const { data: index, isLoading } = useIndex();

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">로딩중...</div>;
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {nickname ? `${nickname} 님` : '쿠키프렌즈'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          최신 시즌: {index?.latestSeasonId}
        </p>
      </header>

      {!nickname && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-3">
            내 닉네임을 등록하면 개인 대시보드를 볼 수 있습니다.
          </p>
          <a
            href="setup"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            닉네임 설정
          </a>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          (Phase 3에서 구현: {nickname ? '개인 대시보드' : '길드 요약'})
        </p>
      </div>
    </div>
  );
}
