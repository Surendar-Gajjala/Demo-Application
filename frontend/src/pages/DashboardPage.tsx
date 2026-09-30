import { useQuery } from '@tanstack/react-query';
import { Cpu, Factory, GitFork, Package, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import type { ItemResponse } from '../api/types';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { ErrorState, LoadingState } from '../components/ui/States';
import { enumLabel, formatDateTime, formatNumber } from '../lib/format';

function StatCard({ label, value, icon: Icon, to }: { label: string; value: number; icon: LucideIcon; to: string }) {
  return (
    <Link to={to} className="rounded-lg border border-line bg-white p-5 hover:border-primary">
      <div className="flex items-center justify-between text-sm text-muted">
        {label}
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="mt-2 text-3xl font-semibold text-ink">{formatNumber(value)}</div>
    </Link>
  );
}

function Breakdown({ title, counts }: { title: string; counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink">{title}</h2>
      <ul className="space-y-3">
        {Object.entries(counts).map(([key, count]) => (
          <li key={key}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{enumLabel(key)}</span>
              <span className="tabular-nums text-muted">{formatNumber(count)}</span>
            </div>
            <div className="h-2 rounded-full bg-table-header">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentItems({ title, items, field }: { title: string; items: ItemResponse[]; field: 'createdAt' | 'updatedAt' }) {
  return (
    <section className="rounded-lg border border-line bg-white">
      <h2 className="border-b border-line px-5 py-3 text-sm font-semibold text-ink">{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 border-b border-line px-5 py-2.5 last:border-b-0">
            <Link to={`/items/${item.id}`} className="w-36 shrink-0 text-link hover:underline">
              {item.itemNumber}
            </Link>
            <span className="min-w-0 flex-1 truncate">{item.itemName}</span>
            <Badge value={item.lifeCyclePhase} />
            <span className="w-40 shrink-0 text-right text-xs text-muted">{formatDateTime(item[field])}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DashboardPage() {
  const summary = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.summary });
  const data = summary.data;

  return (
    <div className="flex h-full flex-col">
      <Header title="Dashboard" subtitle="Overview of items, parts, sites and BOM structure." />
      <div className="min-h-0 flex-1 overflow-auto bg-app px-8 py-6">
        {summary.isPending && <LoadingState />}
        {summary.isError && <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />}
        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Items" value={data.totalItems} icon={Package} to="/items" />
              <StatCard label="Total Parts" value={data.totalParts} icon={Cpu} to="/parts" />
              <StatCard label="Total Sites" value={data.totalSites} icon={Factory} to="/sites" />
              <StatCard label="BOM Links" value={data.totalBomLinks} icon={GitFork} to="/hierarchy" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Breakdown title="Items by Lifecycle Phase" counts={data.itemsByLifeCyclePhase} />
              <Breakdown title="Items by Type" counts={data.itemsByType} />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <RecentItems title="Recently Created Items" items={data.recentlyCreatedItems} field="createdAt" />
              <RecentItems title="Recently Updated Items" items={data.recentlyUpdatedItems} field="updatedAt" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
