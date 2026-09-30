import { request } from './client';
import type { DashboardSummary } from './types';

export const dashboardApi = {
  summary: () => request<DashboardSummary>('/api/dashboard/summary'),
};
