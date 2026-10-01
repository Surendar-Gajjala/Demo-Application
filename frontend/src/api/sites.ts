import { getPage, json, request } from './client';
import type { ListParams, PartResponse, SiteRequest, SiteResponse } from './types';

const BASE = '/api/sites';

export const sitesApi = {
  list: (params: ListParams) => getPage<SiteResponse>(BASE, params),
  get: (id: number) => request<SiteResponse>(`${BASE}/${id}`),
  create: (body: SiteRequest) => request<SiteResponse>(BASE, { method: 'POST', body: json(body) }),
  update: (id: number, body: SiteRequest) =>
    request<SiteResponse>(`${BASE}/${id}`, { method: 'PUT', body: json(body) }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  /** Parts linked to the site (Part N : N Site). */
  parts: (siteId: number, params: ListParams) => getPage<PartResponse>(`${BASE}/${siteId}/parts`, params),
  /** Parts not linked to the site yet. */
  partCandidates: (siteId: number, params: ListParams) =>
    getPage<PartResponse>(`${BASE}/${siteId}/parts/candidates`, params),
  addPart: (siteId: number, partId: number) =>
    request<void>(`${BASE}/${siteId}/parts/${partId}`, { method: 'POST' }),
  removePart: (siteId: number, partId: number) =>
    request<void>(`${BASE}/${siteId}/parts/${partId}`, { method: 'DELETE' }),
};
