-- V1: core schema for Item / Item BOM / Part / Site.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Keeps updated_at current on every UPDATE.
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END $$;

------------------------------------------------------------------------
-- item
------------------------------------------------------------------------
CREATE TABLE item (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_number      VARCHAR(50)  NOT NULL,
    item_name        VARCHAR(255) NOT NULL,
    description      TEXT,
    type             VARCHAR(20)  NOT NULL,
    life_cycle_phase VARCHAR(20)  NOT NULL,
    product_family   VARCHAR(100),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_item_item_number UNIQUE (item_number),
    CONSTRAINT ck_item_type CHECK (type IN ('ASSEMBLY', 'FINISHED')),
    CONSTRAINT ck_item_life_cycle_phase CHECK (life_cycle_phase IN ('DESIGN', 'PRODUCTION'))
);

CREATE TRIGGER trg_item_updated_at
    BEFORE UPDATE ON item
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

------------------------------------------------------------------------
-- item_bom: parent (from_node_id) -> child (to_node_id)
------------------------------------------------------------------------
CREATE TABLE item_bom (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_node_id BIGINT        NOT NULL REFERENCES item (id) ON DELETE CASCADE,
    to_node_id   BIGINT        NOT NULL REFERENCES item (id) ON DELETE CASCADE,
    quantity     NUMERIC(12,3) NOT NULL DEFAULT 1,
    -- Informational only: with multiple parents an edge has no single depth.
    -- Real levels come from recursive traversal.
    bom_depth    INT           NOT NULL DEFAULT 1,
    sequence     INT           NOT NULL DEFAULT 10,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_item_bom_edge UNIQUE (from_node_id, to_node_id),
    CONSTRAINT ck_item_bom_no_self CHECK (from_node_id <> to_node_id),
    CONSTRAINT ck_item_bom_quantity CHECK (quantity > 0),
    CONSTRAINT ck_item_bom_depth CHECK (bom_depth >= 1)
);

-- uq_item_bom_edge already indexes from_node_id (leading column), which
-- serves downward traversal. This one serves upward (where-used).
CREATE INDEX ix_item_bom_to_node ON item_bom (to_node_id);

CREATE TRIGGER trg_item_bom_updated_at
    BEFORE UPDATE ON item_bom
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Rejects an edge parent -> child when child is already an ancestor of
-- parent (which would close a cycle). Raises SQLSTATE 23514 check_violation.
CREATE FUNCTION prevent_bom_cycle() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.from_node_id = NEW.to_node_id THEN
        RETURN NEW; -- ck_item_bom_no_self reports this case
    END IF;

    -- Serialize BOM writes so two concurrent inserts (A->B, B->A) cannot
    -- both pass the check. The query below then sees committed data.
    PERFORM pg_advisory_xact_lock(hashtext('item_bom_cycle_check'));

    IF EXISTS (
        WITH RECURSIVE ancestors (id) AS (
            SELECT NEW.from_node_id
            UNION
            SELECT b.from_node_id
            FROM item_bom b
            JOIN ancestors a ON b.to_node_id = a.id
            WHERE b.id <> NEW.id
        )
        SELECT 1 FROM ancestors WHERE id = NEW.to_node_id
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'check_violation',
            CONSTRAINT = 'ck_item_bom_no_cycle',
            MESSAGE = format('BOM cycle: item %s is already an ancestor of item %s',
                             NEW.to_node_id, NEW.from_node_id);
    END IF;

    RETURN NEW;
END $$;

CREATE TRIGGER trg_item_bom_prevent_cycle
    BEFORE INSERT OR UPDATE OF from_node_id, to_node_id ON item_bom
    FOR EACH ROW EXECUTE FUNCTION prevent_bom_cycle();

------------------------------------------------------------------------
-- part
------------------------------------------------------------------------
CREATE TABLE part (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    part_number      VARCHAR(50)  NOT NULL,
    part_name        VARCHAR(255) NOT NULL,
    description      TEXT,
    manufacture_name VARCHAR(255),
    life_cycle_phase VARCHAR(20)  NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_part_part_number UNIQUE (part_number),
    CONSTRAINT ck_part_life_cycle_phase CHECK (life_cycle_phase IN ('DESIGN', 'PRODUCTION'))
);

CREATE TRIGGER trg_part_updated_at
    BEFORE UPDATE ON part
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

------------------------------------------------------------------------
-- site
------------------------------------------------------------------------
CREATE TABLE site (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    site_name  VARCHAR(255) NOT NULL,
    site_type  VARCHAR(100),
    workcenter VARCHAR(100),
    address    TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_site_updated_at
    BEFORE UPDATE ON site
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

------------------------------------------------------------------------
-- Case-insensitive "contains" search: lower(col) LIKE '%term%'
------------------------------------------------------------------------
CREATE INDEX ix_item_item_number_trgm ON item USING gin (lower(item_number) gin_trgm_ops);
CREATE INDEX ix_item_item_name_trgm   ON item USING gin (lower(item_name)   gin_trgm_ops);
CREATE INDEX ix_part_part_number_trgm ON part USING gin (lower(part_number) gin_trgm_ops);
CREATE INDEX ix_part_part_name_trgm   ON part USING gin (lower(part_name)   gin_trgm_ops);
CREATE INDEX ix_site_site_name_trgm   ON site USING gin (lower(site_name)   gin_trgm_ops);
