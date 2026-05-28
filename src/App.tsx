import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Setup from '@/pages/Setup';
import Guild from '@/pages/Guild';
import Season from '@/pages/Season';
import Player from '@/pages/Player';
import Notice from '@/pages/Notice';
import Coupon from '@/pages/Coupon';
import Cafe from '@/pages/Cafe';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="setup" element={<Setup />} />

        {/* 길드 토벌전 도메인 */}
        <Route path="raid" element={<Guild />} />
        <Route path="raid/season/:id" element={<Season />} />
        <Route path="raid/player/:nickname" element={<Player />} />

        {/* 길드 활동 도메인 (placeholder, 향후 구현) */}
        <Route path="notice" element={<Notice />} />
        <Route path="coupon" element={<Coupon />} />
        <Route path="cafe" element={<Cafe />} />

        <Route path="settings" element={<Settings />} />

        {/* 옛 path 리다이렉트 */}
        <Route path="guild" element={<Navigate to="/raid" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
