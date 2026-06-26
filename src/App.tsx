import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Guild from '@/pages/Guild';
import Patchnotes from '@/pages/Patchnotes';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* 홈 = 개인/길드 대시보드, /guild = 토벌전 기록 (BACKLOG.md 참고) */}
        <Route index element={<Home />} />
        <Route path="guild" element={<Guild />} />
        <Route path="patchnotes" element={<Patchnotes />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
