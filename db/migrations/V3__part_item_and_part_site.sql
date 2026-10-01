-- V3: Item -> Part (1:N) and Part <-> Site (N:N).

------------------------------------------------------------------------
-- part.item_id: optional parent item. Deleting the item unlinks its parts.
------------------------------------------------------------------------
ALTER TABLE part
    ADD COLUMN item_id BIGINT NULL
        CONSTRAINT fk_part_item REFERENCES item (id) ON DELETE SET NULL;

CREATE INDEX ix_part_item_id ON part (item_id);

------------------------------------------------------------------------
-- part_site: which parts are made / used at which sites.
-- Deleting a part or a site removes its links.
------------------------------------------------------------------------
CREATE TABLE part_site (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    part_id    BIGINT      NOT NULL CONSTRAINT fk_part_site_part REFERENCES part (id) ON DELETE CASCADE,
    site_id    BIGINT      NOT NULL CONSTRAINT fk_part_site_site REFERENCES site (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_part_site UNIQUE (part_id, site_id)
);

-- uq_part_site already indexes part_id first; this serves Site -> Parts.
CREATE INDEX ix_part_site_site_id ON part_site (site_id);
