import { useNavigate } from 'react-router-dom';
import { useNicknameStore } from '@/stores/nickname';

export default function Settings() {
  const navigate = useNavigate();
  const nickname = useNicknameStore((s) => s.nickname);
  const clearNickname = useNicknameStore((s) => s.clearNickname);

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          설정
        </h1>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-medium">내 닉네임</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {nickname ?? '설정되지 않음'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/setup')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {nickname ? '변경' : '설정'}
          </button>
          {nickname && (
            <button
              onClick={() => clearNickname()}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/50"
            >
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
