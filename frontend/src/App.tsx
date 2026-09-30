import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ItemHierarchyPage } from './pages/ItemHierarchyPage';
import { ItemsPage } from './pages/ItemsPage';
import { PartDetailPage } from './pages/PartDetailPage';
import { PartsPage } from './pages/PartsPage';
import { SiteDetailPage } from './pages/SiteDetailPage';
import { SitesPage } from './pages/SitesPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="hierarchy" element={<ItemHierarchyPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
        <Route path="parts" element={<PartsPage />} />
        <Route path="parts/:id" element={<PartDetailPage />} />
        <Route path="sites" element={<SitesPage />} />
        <Route path="sites/:id" element={<SiteDetailPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
