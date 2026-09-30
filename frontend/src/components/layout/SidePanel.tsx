import clsx from 'clsx';
import { Cpu, Factory, LayoutDashboard, ListTree, Package, PanelLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const NAV = [
  { to: '/dashboard', label: 'Dashboards', icon: LayoutDashboard },
  { to: '/hierarchy', label: 'Item Hierarchy', icon: ListTree },
  { to: '/items', label: 'Items', icon: Package },
  { to: '/parts', label: 'Parts', icon: Cpu },
  { to: '/sites', label: 'Sites', icon: Factory },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidePanel({ collapsed, onToggle }: Props) {
  return (
    <aside
      className={clsx(
        'flex h-full shrink-0 flex-col border-r border-line bg-app transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-72',
      )}
    >
      <div className={clsx('px-4 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted', collapsed && 'sr-only')}>
        Home
      </div>
      <nav className="flex-1 space-y-1 px-2" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              clsx(
                'flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] text-ink',
                isActive ? 'bg-interactive-bg-secondary-hover font-medium' : 'hover:bg-interactive-bg-secondary-hover',
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-2 border-t border-line p-3">
        {!collapsed && (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-interactive-bg-secondary-hover px-2 py-1.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white text-xs font-semibold text-ink">
              DU
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm text-ink">Demo User</span>
              <span className="block truncate text-xs text-muted">Administrator</span>
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand side panel' : 'Collapse side panel'}
          className="rounded p-2 text-muted hover:bg-interactive-bg-secondary-hover hover:text-ink"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
