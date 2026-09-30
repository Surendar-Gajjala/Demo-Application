-- DB layer verification. Runs inside a transaction that is rolled back,
-- so it never changes data. Any failed check raises an exception.
-- Run with: bash db/run-verify.sh

BEGIN;

-- 1. Explosion of PROD-001 reaches ASSEMBLY-001 / ITEM-0001 / COMPONENT-001
--    at levels 1 / 2 / 3.
DO $$
DECLARE
    found INT;
BEGIN
    WITH RECURSIVE bom AS (
        SELECT b.to_node_id AS item_id, 1 AS level,
               ARRAY[b.from_node_id, b.to_node_id] AS path
        FROM item_bom b
        WHERE b.from_node_id = (SELECT id FROM item WHERE item_number = 'PROD-001')
        UNION ALL
        SELECT b.to_node_id, bom.level + 1, bom.path || b.to_node_id
        FROM item_bom b
        JOIN bom ON b.from_node_id = bom.item_id
        WHERE b.to_node_id <> ALL (bom.path)
    )
    SELECT count(*) INTO found
    FROM bom
    JOIN item i ON i.id = bom.item_id
    WHERE (i.item_number, bom.level) IN
          (('ASSEMBLY-001', 1), ('ITEM-0001', 2), ('COMPONENT-001', 3));

    IF found <> 3 THEN
        RAISE EXCEPTION 'CHECK 1 FAILED: expected 3 explosion rows, got %', found;
    END IF;
    RAISE NOTICE 'check 1 ok: BOM explosion';
END $$;

-- 2. Where-used of ASSEMBLY-SHARED returns PROD-001 and PROD-002.
DO $$
DECLARE
    parents TEXT[];
BEGIN
    WITH RECURSIVE used AS (
        SELECT b.from_node_id AS item_id, ARRAY[b.to_node_id, b.from_node_id] AS path
        FROM item_bom b
        WHERE b.to_node_id = (SELECT id FROM item WHERE item_number = 'ASSEMBLY-SHARED')
        UNION ALL
        SELECT b.from_node_id, used.path || b.from_node_id
        FROM item_bom b
        JOIN used ON b.to_node_id = used.item_id
        WHERE b.from_node_id <> ALL (used.path)
    )
    SELECT array_agg(DISTINCT i.item_number ORDER BY i.item_number) INTO parents
    FROM used
    JOIN item i ON i.id = used.item_id
    WHERE i.item_number IN ('PROD-001', 'PROD-002');

    IF parents IS DISTINCT FROM ARRAY['PROD-001', 'PROD-002'] THEN
        RAISE EXCEPTION 'CHECK 2 FAILED: where-used returned %', parents;
    END IF;
    RAISE NOTICE 'check 2 ok: where-used';
END $$;

-- 3. An edge that would create a cycle is rejected.
DO $$
BEGIN
    INSERT INTO item_bom (from_node_id, to_node_id)
    VALUES ((SELECT id FROM item WHERE item_number = 'COMPONENT-001'),
            (SELECT id FROM item WHERE item_number = 'PROD-001'));
    RAISE EXCEPTION 'CHECK 3 FAILED: cycle COMPONENT-001 -> PROD-001 was accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'check 3 ok: cycle rejected (%)', SQLERRM;
END $$;

-- 4a. Self-edge is rejected.
DO $$
BEGIN
    INSERT INTO item_bom (from_node_id, to_node_id)
    VALUES ((SELECT id FROM item WHERE item_number = 'PROD-001'),
            (SELECT id FROM item WHERE item_number = 'PROD-001'));
    RAISE EXCEPTION 'CHECK 4a FAILED: self-edge was accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'check 4a ok: self-edge rejected';
END $$;

-- 4b. Duplicate edge is rejected.
DO $$
BEGIN
    INSERT INTO item_bom (from_node_id, to_node_id)
    VALUES ((SELECT id FROM item WHERE item_number = 'PROD-001'),
            (SELECT id FROM item WHERE item_number = 'ASSEMBLY-001'));
    RAISE EXCEPTION 'CHECK 4b FAILED: duplicate edge was accepted';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'check 4b ok: duplicate edge rejected';
END $$;

-- 5a. Invalid item type is rejected.
DO $$
BEGIN
    INSERT INTO item (item_number, item_name, type, life_cycle_phase)
    VALUES ('BAD-1', 'Bad', 'COMPONENT', 'DESIGN');
    RAISE EXCEPTION 'CHECK 5a FAILED: invalid type accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'check 5a ok: invalid item type rejected';
END $$;

-- 5b. Invalid lifecycle phase is rejected (item and part).
DO $$
BEGIN
    INSERT INTO item (item_number, item_name, type, life_cycle_phase)
    VALUES ('BAD-2', 'Bad', 'FINISHED', 'ACTIVE');
    RAISE EXCEPTION 'CHECK 5b FAILED: invalid item life_cycle_phase accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'check 5b ok: invalid item lifecycle rejected';
END $$;

DO $$
BEGIN
    INSERT INTO part (part_number, part_name, life_cycle_phase)
    VALUES ('BAD-P', 'Bad', 'INACTIVE');
    RAISE EXCEPTION 'CHECK 5b FAILED: invalid part life_cycle_phase accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'check 5b ok: invalid part lifecycle rejected';
END $$;

-- 5c. Non-positive quantity is rejected.
DO $$
BEGIN
    INSERT INTO item_bom (from_node_id, to_node_id, quantity)
    VALUES ((SELECT id FROM item WHERE item_number = 'PROD-002'),
            (SELECT id FROM item WHERE item_number = 'COMPONENT-001'), 0);
    RAISE EXCEPTION 'CHECK 5c FAILED: quantity 0 accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'check 5c ok: non-positive quantity rejected';
END $$;

-- 5d. Duplicate item_number is rejected.
DO $$
BEGIN
    INSERT INTO item (item_number, item_name, type, life_cycle_phase)
    VALUES ('PROD-001', 'Dup', 'FINISHED', 'DESIGN');
    RAISE EXCEPTION 'CHECK 5d FAILED: duplicate item_number accepted';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'check 5d ok: duplicate item_number rejected';
END $$;

-- 6. updated_at changes on UPDATE (seed rows were written in an earlier
--    transaction, so now() here is later than their updated_at).
DO $$
DECLARE
    before_ts TIMESTAMPTZ;
    after_ts  TIMESTAMPTZ;
BEGIN
    SELECT updated_at INTO before_ts FROM item WHERE item_number = 'PROD-001';
    UPDATE item SET description = description || ' (verify)' WHERE item_number = 'PROD-001';
    SELECT updated_at INTO after_ts FROM item WHERE item_number = 'PROD-001';

    IF after_ts <= before_ts THEN
        RAISE EXCEPTION 'CHECK 6 FAILED: updated_at % -> %', before_ts, after_ts;
    END IF;
    RAISE NOTICE 'check 6 ok: updated_at trigger';
END $$;

-- 7. Deleting an item cascades to its BOM edges (both directions).
DO $$
DECLARE
    remaining INT;
    target BIGINT := (SELECT id FROM item WHERE item_number = 'ASSEMBLY-001');
BEGIN
    DELETE FROM item WHERE id = target;
    SELECT count(*) INTO remaining
    FROM item_bom WHERE from_node_id = target OR to_node_id = target;

    IF remaining <> 0 THEN
        RAISE EXCEPTION 'CHECK 7 FAILED: % edges left after delete', remaining;
    END IF;
    RAISE NOTICE 'check 7 ok: delete cascades to item_bom';
END $$;

\echo ALL CHECKS PASSED

ROLLBACK;
