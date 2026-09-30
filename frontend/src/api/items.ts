import { getPage, json, request } from './client';
import type { ItemRequest, ItemResponse, ListParams } from './types';

const BASE = '/api/items';

export const itemsApi = {
  list: (params: ListParams) => getPage<ItemResponse>(BASE, params),
  get: (id: number) => request<ItemResponse>(`${BASE}/${id}`),
  create: (body: ItemRequest) => request<ItemResponse>(BASE, { method: 'POST', body: json(body) }),
  update: (id: number, body: ItemRequest) =>
    request<ItemResponse>(`${BASE}/${id}`, { method: 'PUT', body: json(body) }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
