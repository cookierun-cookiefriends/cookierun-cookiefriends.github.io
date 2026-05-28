import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Setup from '@/pages/Setup';
import Guild from '@/pages/Guild';
import Season from '@/pages/Season';
import Player from '@/pages/Player';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="setup" element={<Setup />} />
        <Route path="guild" element={<Guild />} />
        <Route path="season/:id" element={<Season />} />
        <Route path="player/:nickname" element={<Player />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
