import { getPage, json, request } from './client';
import type { ListParams, SiteRequest, SiteResponse } from './types';

const BASE = '/api/sites';

export const sitesApi = {
  list: (params: ListParams) => getPage<SiteResponse>(BASE, params),
  get: (id: number) => request<SiteResponse>(`${BASE}/${id}`),
  create: (body: SiteRequest) => request<SiteResponse>(BASE, { method: 'POST', body: json(body) }),
  update: (id: number, body: SiteRequest) =>
    request<SiteResponse>(`${BASE}/${id}`, { method: 'PUT', body: json(body) }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
