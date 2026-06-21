import {
  LayoutDashboard,
  PackagePlus,
  Tag,
  ShoppingCart,
  RefreshCw,
  BookOpen,
  Menu,
  X,
  BookMarked,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUiStore } from '@/store/useUiStore';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/inventory', label: '库存管理', icon: BookOpen },
  { path: '/stock-in', label: '旧书入库', icon: PackagePlus },
  { path: '/pricing', label: '定价上架', icon: Tag },
  { path: '/sales', label: '销售出库', icon: ShoppingCart },
  { path: '/trade-in', label: '以旧换新', icon: RefreshCw },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-brown-800 text-white transition-all duration-300 z-40 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-brown-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <BookMarked className="w-7 h-7 text-amber-400" />
            <span className="font-serif font-bold text-lg">旧书店</span>
          </div>
        )}
        {sidebarCollapsed && (
          <BookMarked className="w-7 h-7 text-amber-400 mx-auto" />
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-brown-700 transition-colors"
        >
          {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border-l-2 border-amber-400'
                      : 'text-brown-200 hover:bg-brown-700/50 hover:text-white'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {!sidebarCollapsed && (
        <div className="p-4 border-t border-brown-700">
          <div className="text-xs text-brown-400 text-center">
            二手书店管理系统 v1.0
          </div>
        </div>
      )}
    </aside>
  );
}
