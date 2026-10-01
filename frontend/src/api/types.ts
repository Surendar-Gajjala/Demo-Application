// Mirrors the backend DTO records (backend/CLAUDE.md section 6).

export type ItemType = 'ASSEMBLY' | 'FINISHED';
export type LifeCyclePhase = 'DESIGN' | 'PRODUCTION';

export const ITEM_TYPES: ItemType[] = ['ASSEMBLY', 'FINISHED'];
export const LIFE_CYCLE_PHASES: LifeCyclePhase[] = ['DESIGN', 'PRODUCTION'];

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ListParams {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  [filter: string]: string | number | undefined;
}

export interface ItemRequest {
  itemNumber: string;
  itemName: string;
  description?: string | null;
  type: ItemType;
  lifeCyclePhase: LifeCyclePhase;
  productFamily?: string | null;
}

export interface ItemResponse {
  id: number;
  itemNumber: string;
  itemName: string;
  description: string | null;
  type: ItemType;
  lifeCyclePhase: LifeCyclePhase;
  productFamily: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartRequest {
  partNumber: string;
  partName: string;
  description?: string | null;
  manufactureName?: string | null;
  lifeCyclePhase: LifeCyclePhase;
  /** Optional parent item; null = not assigned. */
  itemId: number | null;
}

export interface PartResponse {
  id: number;
  partNumber: string;
  partName: string;
  description: string | null;
  manufactureName: string | null;
  lifeCyclePhase: LifeCyclePhase;
  /** Parent item (Item 1 : N Part); all null when not assigned. */
  itemId: number | null;
  itemNumber: string | null;
  itemName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteRequest {
  siteName: string;
  siteType?: string | null;
  workcenter?: string | null;
  address?: string | null;
}

export interface SiteResponse {
  id: number;
  siteName: string;
  siteType: string | null;
  workcenter: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BomNode {
  bomId: number | null;
  itemId: number;
  itemNumber: string;
  itemName: string;
  description: string | null;
  type: ItemType;
  lifeCyclePhase: LifeCyclePhase;
  quantity: number | null;
  sequence: number | null;
  level: number;
  hasChildren: boolean;
  children: BomNode[];
}

export interface BomLinkRequest {
  childId: number;
  quantity: number;
  sequence?: number;
}

export interface DashboardSummary {
  totalItems: number;
  totalParts: number;
  totalSites: number;
  itemsByLifeCyclePhase: Record<LifeCyclePhase, number>;
  itemsByType: Record<ItemType, number>;
  totalBomLinks: number;
  recentlyCreatedItems: ItemResponse[];
  recentlyUpdatedItems: ItemResponse[];
}
