-- Where-used (upward: to_node_id -> from_node_id).
-- Reference for the backend's ItemBomRepository.
--
-- psql variables:
--   item_id    id of the starting item
--   max_depth  maximum level to return (e.g. 10)
--
-- Example:
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
--     -v item_id=12 -v max_depth=10' < db/queries/bom_where_used.sql
--
-- level 1 = direct parents, level 2 = their parents, ...
-- has_parents tells the UI whether a node can be expanded further upward.

WITH RECURSIVE used AS (
    SELECT b.id                                AS bom_id,
           b.to_node_id                        AS child_id,
           b.from_node_id                      AS item_id,
           1                                   AS level,
           ARRAY[b.to_node_id, b.from_node_id] AS path,
           ARRAY[lpad(b.from_node_id::text, 12, '0')] AS sort_path,
           b.quantity,
           b.sequence
    FROM item_bom b
    WHERE b.to_node_id = :item_id

    UNION ALL

    SELECT b.id,
           b.to_node_id,
           b.from_node_id,
           used.level + 1,
           used.path || b.from_node_id,
           used.sort_path || lpad(b.from_node_id::text, 12, '0'),
           b.quantity,
           b.sequence
    FROM item_bom b
    JOIN used ON b.to_node_id = used.item_id
    WHERE b.from_node_id <> ALL (used.path)   -- cycle guard
      AND used.level < :max_depth
)
SELECT used.bom_id,
       used.child_id,
       used.level,
       i.id               AS item_id,
       i.item_number,
       i.item_name,
       i.description,
       i.type,
       i.life_cycle_phase,
       used.quantity      AS quantity_used_in_parent,
       EXISTS (SELECT 1 FROM item_bom p WHERE p.to_node_id = i.id) AS has_parents
FROM used
JOIN item i ON i.id = used.item_id
ORDER BY used.sort_path;
