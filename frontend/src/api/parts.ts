import { getPage, json, request } from './client';
import type { ListParams, PartRequest, PartResponse } from './types';

const BASE = '/api/parts';

export const partsApi = {
  list: (params: ListParams) => getPage<PartResponse>(BASE, params),
  get: (id: number) => request<PartResponse>(`${BASE}/${id}`),
  create: (body: PartRequest) => request<PartResponse>(BASE, { method: 'POST', body: json(body) }),
  update: (id: number, body: PartRequest) =>
    request<PartResponse>(`${BASE}/${id}`, { method: 'PUT', body: json(body) }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
