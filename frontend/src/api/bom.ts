import { getPage, json, request, toQuery } from './client';
import type { BomLinkRequest, BomNode, ItemResponse, ListParams } from './types';

export const bomApi = {
  /** Top-level hierarchy rows: items with children and no parent. */
  roots: (params: ListParams) => getPage<BomNode>('/api/items/bom-roots', params),
  /** Direct children, for lazy expand. */
  children: (itemId: number) => request<BomNode[]>(`/api/items/${itemId}/bom/children`),
  /** Full multi-level explosion, for "expand all". */
  explode: (itemId: number, maxDepth = 20) =>
    request<BomNode>(`/api/items/${itemId}/bom${toQuery({ maxDepth })}`),
  whereUsed: (itemId: number, maxDepth = 20) =>
    request<BomNode>(`/api/items/${itemId}/bom/where-used${toQuery({ maxDepth })}`),
  /** Items that may be added under parentId (not itself, not already a child, not an ancestor). */
  candidates: (parentId: number, params: ListParams) =>
    getPage<ItemResponse>(`/api/items/${parentId}/bom/candidates`, params),
  /** Adds childId under parentId; returns the new child node. */
  addChild: (parentId: number, body: BomLinkRequest) =>
    request<BomNode>(`/api/items/${parentId}/bom`, { method: 'POST', body: json(body) }),
};
