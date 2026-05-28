import { useNavigate } from 'react-router-dom';
import { useIndex } from '@/hooks/queries';
import { useNicknameStore } from '@/stores/nickname';

export default function Setup() {
  const navigate = useNavigate();
  const { data: index, isLoading } = useIndex();
  const setNickname = useNicknameStore((s) => s.setNickname);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">로딩중...</div>;
  }

  const pick = (nickname: string) => {
    setNickname(nickname);
    navigate('/');
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          내 닉네임 선택
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          길드원 목록에서 본인을 선택해주세요. 쿠키에 저장됩니다.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {index?.players.map((p) => (
          <button
            key={p}
            onClick={() => pick(p)}
            className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-secondary/50 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
