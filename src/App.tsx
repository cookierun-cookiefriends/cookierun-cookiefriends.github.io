import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Guild from '@/pages/Guild';
import Patchnotes from '@/pages/Patchnotes';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* 1차 오픈: 토벌전 기록 + 패치노트 + 설정. 홈/개인화/상세는 BACKLOG.md 참고 */}
        <Route index element={<Guild />} />
        <Route path="patchnotes" element={<Patchnotes />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
