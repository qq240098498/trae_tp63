import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUiStore } from '@/store/useUiStore';

export function Layout() {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
