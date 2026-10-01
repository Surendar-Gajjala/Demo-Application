import { getPage, json, request } from './client';
import type { ListParams, PartRequest, PartResponse, SiteResponse } from './types';

const BASE = '/api/parts';

export const partsApi = {
  list: (params: ListParams) => getPage<PartResponse>(BASE, params),
  get: (id: number) => request<PartResponse>(`${BASE}/${id}`),
  create: (body: PartRequest) => request<PartResponse>(BASE, { method: 'POST', body: json(body) }),
  update: (id: number, body: PartRequest) =>
    request<PartResponse>(`${BASE}/${id}`, { method: 'PUT', body: json(body) }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  /** Sites linked to the part (Part N : N Site). */
  sites: (partId: number, params: ListParams) => getPage<SiteResponse>(`${BASE}/${partId}/sites`, params),
  /** Sites not linked to the part yet. */
  siteCandidates: (partId: number, params: ListParams) =>
    getPage<SiteResponse>(`${BASE}/${partId}/sites/candidates`, params),
  addSite: (partId: number, siteId: number) =>
    request<void>(`${BASE}/${partId}/sites/${siteId}`, { method: 'POST' }),
  removeSite: (partId: number, siteId: number) =>
    request<void>(`${BASE}/${partId}/sites/${siteId}`, { method: 'DELETE' }),
};
