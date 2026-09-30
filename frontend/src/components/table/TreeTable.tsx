import clsx from 'clsx';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { forwardRef, useCallback, useImperativeHandle, useState, type ReactNode } from 'react';
import type { BomNode } from '../../api/types';
import { formatQuantity } from '../../lib/format';
import { Badge } from '../ui/Badge';
import { LinkCell, TextCell } from './cells';

export const INDENT_PX = 24;

export interface TreeTableHandle {
  expandAll: () => Promise<void>;
  collapseAll: () => void;
  /** Re-fetches an item's children (e.g. after adding one) and expands its row. */
  reloadChildren: (itemId: number, rowKey: string) => Promise<void>;
}

interface Props {
  roots: BomNode[];
  /** Direct children of an item (lazy expand). */
  loadChildren: (itemId: number) => Promise<BomNode[]>;
  /** Full subtree of an item (expand all). */
  loadSubtree: (itemId: number) => Promise<BomNode>;
  onOpenItem?: (node: BomNode) => void;
  /** Per-row action (e.g. "+"), shown in a leading column on row hover. */
  renderActions?: (node: BomNode, rowKey: string) => ReactNode;
  /** Shown in the header of the leading action column. */
  headerAction?: ReactNode;
  /** Rendered in the body instead of rows (loading / empty / error). */
  children?: ReactNode;
}

const childKey = (parentKey: string, node: BomNode) => `${parentKey}/${node.bomId ?? `r${node.itemId}`}`;

const COLUMNS = ['Item Number', 'Item Name', 'Description', 'Item Type', 'Item Status', 'Quantity'];

/**
 * Expandable BOM tree in the reference table style. Rows are keyed by their
 * path (a shared sub-assembly can appear under several parents); children are
 * cached per item so expanding the same item elsewhere is instant.
 */
export const TreeTable = forwardRef<TreeTableHandle, Props>(function TreeTable(
  { roots, loadChildren, loadSubtree, onOpenItem, renderActions, headerAction, children },
  ref,
) {
  const [childrenByItem, setChildrenByItem] = useState<Record<number, BomNode[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasActionColumn = !!(renderActions || headerAction);
  const colSpan = COLUMNS.length + (hasActionColumn ? 1 : 0);

  const setFlag = (set: typeof setLoading, key: string, on: boolean) =>
    set((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const toggle = async (key: string, node: BomNode) => {
    if (expanded.has(key)) {
      setFlag(setExpanded, key, false);
      return;
    }
    setFlag(setExpanded, key, true);
    if (childrenByItem[node.itemId]) return;
    setFlag(setLoading, key, true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      const kids = await loadChildren(node.itemId);
      setChildrenByItem((prev) => ({ ...prev, [node.itemId]: kids }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, [key]: e instanceof Error ? e.message : 'Failed to load' }));
    } finally {
      setFlag(setLoading, key, false);
    }
  };

  const expandAll = useCallback(async () => {
    const trees = await Promise.all(roots.map((r) => loadSubtree(r.itemId)));
    const cache: Record<number, BomNode[]> = {};
    const keys = new Set<string>();
    const walk = (node: BomNode, key: string) => {
      if (node.children.length === 0) return;
      cache[node.itemId] = node.children;
      keys.add(key);
      node.children.forEach((c) => walk(c, childKey(key, c)));
    };
    trees.forEach((tree, i) => walk(tree, childKey('', roots[i])));
    setChildrenByItem((prev) => ({ ...prev, ...cache }));
    setExpanded(keys);
  }, [roots, loadSubtree]);

  const reloadChildren = useCallback(
    async (itemId: number, rowKey: string) => {
      const kids = await loadChildren(itemId);
      setChildrenByItem((prev) => ({ ...prev, [itemId]: kids }));
      setFlag(setExpanded, rowKey, true);
    },
    [loadChildren],
  );

  useImperativeHandle(
    ref,
    () => ({ expandAll, collapseAll: () => setExpanded(new Set()), reloadChildren }),
    [expandAll, reloadChildren],
  );

  const renderRows = (nodes: BomNode[], parentKey: string, depth: number): ReactNode[] =>
    nodes.flatMap((node) => {
      const key = childKey(parentKey, node);
      const isOpen = expanded.has(key);
      const kids = childrenByItem[node.itemId];
      const rows: ReactNode[] = [
        <tr key={key} className="group hover:bg-interactive-bg-secondary-hover" aria-level={depth + 1}>
          {hasActionColumn && (
            <td className="w-12 border-b border-line px-2 py-1.5 text-center">
              {renderActions && (
                <div className="flex justify-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  {renderActions(node, key)}
                </div>
              )}
            </td>
          )}
          <td className="whitespace-nowrap border-b border-r border-line py-2.5 pr-4" style={{ paddingLeft: 32 + depth * INDENT_PX }}>
            <span className="flex items-center gap-1">
              {node.hasChildren || (kids?.length ?? 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => toggle(key, node)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${node.itemNumber}`}
                  className="rounded p-0.5 text-ink hover:bg-line"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <span className="inline-block w-5" aria-hidden />
              )}
              {onOpenItem ? <LinkCell onClick={() => onOpenItem(node)}>{node.itemNumber}</LinkCell> : node.itemNumber}
            </span>
          </td>
          <td className="border-b border-line px-4 py-2.5">
            <TextCell value={node.itemName} />
          </td>
          <td className="border-b border-line px-4 py-2.5">
            <TextCell value={node.description} wrap />
          </td>
          <td className="border-b border-line px-4 py-2.5">
            <Badge value={node.type} />
          </td>
          <td className="border-b border-line px-4 py-2.5">
            <Badge value={node.lifeCyclePhase} />
          </td>
          <td className={clsx('border-b border-line px-4 py-2.5 text-right tabular-nums', node.quantity === null && 'text-muted')}>
            {formatQuantity(node.quantity)}
          </td>
        </tr>,
      ];
      if (isOpen) {
        if (loading.has(key)) {
          rows.push(
            <tr key={`${key}#loading`}>
              <td colSpan={colSpan} className="border-b border-line py-2 text-muted" style={{ paddingLeft: 32 + (depth + 1) * INDENT_PX }}>
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Loading...
                </span>
              </td>
            </tr>,
          );
        } else if (errors[key]) {
          rows.push(
            <tr key={`${key}#error`}>
              <td colSpan={colSpan} className="border-b border-line py-2 text-red-600" style={{ paddingLeft: 32 + (depth + 1) * INDENT_PX }}>
                {errors[key]}
              </td>
            </tr>,
          );
        } else if (kids) {
          rows.push(...renderRows(kids, key, depth + 1));
        }
      }
      return rows;
    });

  return (
    <table className="w-full border-separate border-spacing-0 text-[15px]" role="treegrid">
      <thead className="sticky top-0 z-10">
        <tr>
          {hasActionColumn && (
            <th scope="col" className="w-12 border-b border-line bg-table-header px-2 py-2 text-center">
              {headerAction && <div className="flex justify-center">{headerAction}</div>}
            </th>
          )}
          {COLUMNS.map((c, i) => (
            <th
              key={c}
              scope="col"
              className={clsx(
                'whitespace-nowrap border-b border-line bg-table-header px-4 py-3 text-left font-semibold text-ink',
                i === 0 ? (hasActionColumn ? 'border-l pl-8' : 'pl-8') : 'border-l',
                c === 'Quantity' && 'text-right',
              )}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children ? (
          <tr>
            <td colSpan={colSpan}>{children}</td>
          </tr>
        ) : (
          renderRows(roots, '', 0)
        )}
      </tbody>
    </table>
  );
});
