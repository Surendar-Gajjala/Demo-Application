import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidePanel } from './SidePanel';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-app font-sans text-sm text-ink">
      <SidePanel collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <Outlet />
      </main>
    </div>
  );
}
