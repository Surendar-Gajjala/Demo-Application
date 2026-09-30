-- Multi-level BOM explosion (downward: from_node_id -> to_node_id).
-- Reference for the backend's ItemBomRepository.
--
-- psql variables:
--   root_id    id of the starting item
--   max_depth  maximum level to return (e.g. 10)
--
-- Example:
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
--     -v root_id=1 -v max_depth=10' < db/queries/bom_explosion.sql
--
-- Returns one row per edge reached (a shared sub-assembly appears under each
-- parent). sort_path orders rows depth-first by sequence, so the result can
-- be rendered as a tree directly.

WITH RECURSIVE bom AS (
    SELECT b.id                                AS bom_id,
           b.from_node_id                      AS parent_id,
           b.to_node_id                        AS item_id,
           1                                   AS level,
           ARRAY[b.from_node_id, b.to_node_id] AS path,
           ARRAY[lpad(b.sequence::text, 6, '0') || '-' || lpad(b.to_node_id::text, 12, '0')] AS sort_path,
           b.quantity,
           b.sequence
    FROM item_bom b
    WHERE b.from_node_id = :root_id

    UNION ALL

    SELECT b.id,
           b.from_node_id,
           b.to_node_id,
           bom.level + 1,
           bom.path || b.to_node_id,
           bom.sort_path || (lpad(b.sequence::text, 6, '0') || '-' || lpad(b.to_node_id::text, 12, '0')),
           b.quantity,
           b.sequence
    FROM item_bom b
    JOIN bom ON b.from_node_id = bom.item_id
    WHERE b.to_node_id <> ALL (bom.path)   -- cycle guard
      AND bom.level < :max_depth
)
SELECT bom.bom_id,
       bom.parent_id,
       bom.level,
       i.id               AS item_id,
       i.item_number,
       i.item_name,
       i.description,
       i.type,
       i.life_cycle_phase,
       bom.quantity,
       bom.sequence,
       EXISTS (SELECT 1 FROM item_bom c WHERE c.from_node_id = i.id) AS has_children
FROM bom
JOIN item i ON i.id = bom.item_id
ORDER BY bom.sort_path;
