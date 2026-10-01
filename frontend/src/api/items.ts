import { getPage, json, request } from './client';
import type { ItemRequest, ItemResponse, ListParams, PartResponse } from './types';

const BASE = '/api/items';

export const itemsApi = {
  list: (params: ListParams) => getPage<ItemResponse>(BASE, params),
  get: (id: number) => request<ItemResponse>(`${BASE}/${id}`),
  create: (body: ItemRequest) => request<ItemResponse>(BASE, { method: 'POST', body: json(body) }),
  update: (id: number, body: ItemRequest) =>
    request<ItemResponse>(`${BASE}/${id}`, { method: 'PUT', body: json(body) }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  /** Parts that belong to the item (Item 1 : N Part). */
  parts: (itemId: number, params: ListParams) => getPage<PartResponse>(`${BASE}/${itemId}/parts`, params),
  /** Parts that can be attached: not assigned to any item. */
  partCandidates: (itemId: number, params: ListParams) =>
    getPage<PartResponse>(`${BASE}/${itemId}/parts/candidates`, params),
  addPart: (itemId: number, partId: number) =>
    request<PartResponse>(`${BASE}/${itemId}/parts`, { method: 'POST', body: json({ partId }) }),
  /** Unlinks the part; the part itself is kept. */
  removePart: (itemId: number, partId: number) =>
    request<void>(`${BASE}/${itemId}/parts/${partId}`, { method: 'DELETE' }),
};
