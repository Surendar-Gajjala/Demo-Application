package com.demo.application.repository;

import java.util.List;
import java.util.Optional;

import com.demo.application.model.ItemBom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * BOM edges. Traversals are single native recursive CTEs (same shape as
 * db/queries/bom_explosion.sql and bom_where_used.sql), never one query per level.
 */
public interface ItemBomRepository extends JpaRepository<ItemBom, Long> {

    boolean existsByFromNodeIdAndToNodeId(Long fromNodeId, Long toNodeId);

    boolean existsByFromNodeId(Long itemId);

    boolean existsByToNodeId(Long itemId);

    Optional<ItemBom> findByIdAndFromNodeId(Long id, Long fromNodeId);

    /** Downward traversal (fromNode -> toNode), depth-first, children ordered by sequence. */
    @Query(value = """
            WITH RECURSIVE bom AS (
                SELECT b.id AS bom_id, b.from_node_id AS parent_id, b.to_node_id AS item_id, 1 AS level,
                       ARRAY[b.from_node_id, b.to_node_id] AS path,
                       ARRAY[lpad(b.sequence::text, 6, '0') || '-' || lpad(b.to_node_id::text, 12, '0')] AS sort_path,
                       b.quantity, b.sequence
                FROM item_bom b
                WHERE b.from_node_id = :rootId
                UNION ALL
                SELECT b.id, b.from_node_id, b.to_node_id, bom.level + 1,
                       bom.path || b.to_node_id,
                       bom.sort_path || (lpad(b.sequence::text, 6, '0') || '-' || lpad(b.to_node_id::text, 12, '0')),
                       b.quantity, b.sequence
                FROM item_bom b
                JOIN bom ON b.from_node_id = bom.item_id
                WHERE b.to_node_id <> ALL (bom.path)
                  AND bom.level < :maxDepth
            )
            SELECT bom.bom_id AS "bomId", bom.parent_id AS "parentId", bom.level AS "level",
                   i.id AS "itemId", i.item_number AS "itemNumber", i.item_name AS "itemName",
                   i.description AS "description", i.type AS "type", i.life_cycle_phase AS "lifeCyclePhase",
                   bom.quantity AS "quantity", bom.sequence AS "sequence",
                   EXISTS (SELECT 1 FROM item_bom c WHERE c.from_node_id = i.id) AS "hasChildren"
            FROM bom
            JOIN item i ON i.id = bom.item_id
            ORDER BY bom.sort_path
            """, nativeQuery = true)
    List<BomRow> explode(@Param("rootId") Long rootId, @Param("maxDepth") int maxDepth);

    /**
     * Upward traversal (toNode -> fromNode). quantity/sequence are those of the
     * edge in which the row's item is the parent.
     */
    @Query(value = """
            WITH RECURSIVE used AS (
                SELECT b.id AS bom_id, b.to_node_id AS child_id, b.from_node_id AS item_id, 1 AS level,
                       ARRAY[b.to_node_id, b.from_node_id] AS path,
                       ARRAY[lpad(b.from_node_id::text, 12, '0')] AS sort_path,
                       b.quantity, b.sequence
                FROM item_bom b
                WHERE b.to_node_id = :itemId
                UNION ALL
                SELECT b.id, b.to_node_id, b.from_node_id, used.level + 1,
                       used.path || b.from_node_id,
                       used.sort_path || lpad(b.from_node_id::text, 12, '0'),
                       b.quantity, b.sequence
                FROM item_bom b
                JOIN used ON b.to_node_id = used.item_id
                WHERE b.from_node_id <> ALL (used.path)
                  AND used.level < :maxDepth
            )
            SELECT used.bom_id AS "bomId", used.child_id AS "parentId", used.level AS "level",
                   i.id AS "itemId", i.item_number AS "itemNumber", i.item_name AS "itemName",
                   i.description AS "description", i.type AS "type", i.life_cycle_phase AS "lifeCyclePhase",
                   used.quantity AS "quantity", used.sequence AS "sequence",
                   EXISTS (SELECT 1 FROM item_bom p WHERE p.to_node_id = i.id) AS "hasChildren"
            FROM used
            JOIN item i ON i.id = used.item_id
            ORDER BY used.sort_path
            """, nativeQuery = true)
    List<BomRow> whereUsed(@Param("itemId") Long itemId, @Param("maxDepth") int maxDepth);

    /** Ids of every item above itemId (parents, grandparents, ...); excludes itemId itself. */
    @Query(value = """
            WITH RECURSIVE ancestors (id) AS (
                SELECT b.from_node_id FROM item_bom b WHERE b.to_node_id = :itemId
                UNION
                SELECT b.from_node_id
                FROM item_bom b
                JOIN ancestors a ON b.to_node_id = a.id
            )
            SELECT id FROM ancestors
            """, nativeQuery = true)
    List<Long> findAncestorIds(@Param("itemId") Long itemId);

    /** True if candidateId is itemId itself or one of its ancestors. */
    @Query(value = """
            WITH RECURSIVE ancestors (id) AS (
                SELECT CAST(:itemId AS BIGINT)
                UNION
                SELECT b.from_node_id
                FROM item_bom b
                JOIN ancestors a ON b.to_node_id = a.id
            )
            SELECT EXISTS (SELECT 1 FROM ancestors WHERE id = :candidateId)
            """, nativeQuery = true)
    boolean isSelfOrAncestor(@Param("candidateId") Long candidateId, @Param("itemId") Long itemId);
}
