# Database Context

See [CLAUDE.md](../CLAUDE.md) for the overall application context.
Full design:
[docs/superpowers/specs/2026-09-29-db-layer-design.md](../docs/superpowers/specs/2026-09-29-db-layer-design.md).

## 0. Implementation and How to Run

``` text
db/
  migrations/
    V1__create_schema.sql    tables, constraints, indexes, triggers
    V2__seed_demo_data.sql   24 items, 24 BOM links, 25 parts, 8 sites
    V3__part_item_and_part_site.sql  part.item_id (Item 1:N Part), part_site (Part N:N Site)
    V4__seed_part_relationships.sql  20 parts assigned to items, 24 part-site links
  queries/
    bom_explosion.sql        recursive CTE, downward (psql vars root_id, max_depth)
    bom_where_used.sql       recursive CTE, upward   (psql vars item_id, max_depth)
  tests/
    verify.sql               constraint + traversal checks (rolled back)
  run-verify.sh              runs verify.sql in the postgres container
```

Commands (from the repo root, Docker Desktop running):

``` bash
docker compose up -d postgres        # start PostgreSQL 16 (volume: pgdata)
docker compose run --rm flyway       # apply pending migrations
bash db/run-verify.sh                # must end with: ALL CHECKS PASSED
docker compose down -v               # stop and DELETE all data (volume)
```

Rules:

-   **Never edit an applied migration.** Change the schema by adding
    `V5__...sql`, `V6__...sql`, etc. Flyway rejects checksum changes.
-   Implementation details beyond the conceptual tables below:
    -   PKs are `BIGINT GENERATED ALWAYS AS IDENTITY`.
    -   Enums are `VARCHAR` + `CHECK`: `type` in (`ASSEMBLY`, `FINISHED`),
        `life_cycle_phase` in (`DESIGN`, `PRODUCTION`).
    -   `set_updated_at()` trigger maintains `updated_at` on every table.
    -   `item_bom`: `UNIQUE (from_node_id, to_node_id)`, no self-edge,
        `quantity > 0`, FKs `ON DELETE CASCADE`, index on `to_node_id`.
    -   `prevent_bom_cycle()` trigger rejects cycles with SQLSTATE `23514`
        (constraint name `ck_item_bom_no_cycle`); BOM writes are serialized
        by a transaction-level advisory lock.
    -   `pg_trgm` GIN indexes on `lower(...)` of the search columns.
    -   `part.item_id`: nullable FK to `item`, `ON DELETE SET NULL`
        (deleting an item unlinks its parts), index `ix_part_item_id`.
    -   `part_site`: FKs `ON DELETE CASCADE` to `part` and `site`,
        `UNIQUE (part_id, site_id)` (`uq_part_site`), index on `site_id`.
        No `updated_at`: a link is only created or deleted.
-   Seed data: products (`PROD-*`) are `FINISHED`; every other item is
    `ASSEMBLY`. `ASSEMBLY-SHARED` and `ITEM-0005` have multiple parents.
    PROD-001 owns A-2041, A-2042, A-2050 and A-2055. A-2046, A-2047,
    A-2049, A-2053 and A-2063 have no item.

## 1. Overview

The database is **PostgreSQL**.

Main tables:

``` text
item
item_bom
part
site
part_site
```

------------------------------------------------------------------------

## 2. Item Table

``` text
item
------------------------------------------------
id
item_number
item_name
description
type
life_cycle_phase
product_family
created_at
updated_at
```

-   Stores the Item's own information.
-   Does **not** store the complete BOM hierarchy.
-   `type`: `ASSEMBLY`, `FINISHED`
-   `life_cycle_phase`: `DESIGN`, `PRODUCTION`
-   `item_number` is the unique item identifier.

------------------------------------------------------------------------

## 3. Item BOM Table

``` text
item_bom
------------------------------------------------
id
from_node_id
to_node_id
quantity
bom_depth
sequence
created_at
updated_at
```

The table represents `from_node_id → to_node_id` (parent → child).

Example rows:

``` text
PROD-001 → ASSEMBLY-001
ASSEMBLY-001 → ITEM-0001
```

Both IDs reference the same `item` table:

``` text
item_bom.from_node_id → item.id
item_bom.to_node_id   → item.id
```

------------------------------------------------------------------------

## 4. Part Table

``` text
part
------------------------------------------------
id
item_id
part_number
part_name
description
manufacture_name
life_cycle_phase
created_at
updated_at
```

-   `part_number` is the unique part identifier.
-   `life_cycle_phase`: `DESIGN`, `PRODUCTION`
-   `item_id` is the optional parent Item (Item 1 : N Part). A part
    belongs to at most one item.

------------------------------------------------------------------------

## 5. Site Table

``` text
site
------------------------------------------------
id
site_name
site_type
workcenter
address
created_at
updated_at
```

### Part-Site Junction

``` text
part_site
------------------------------------------------
id
part_id
site_id
created_at
```

One Part can be at many Sites and one Site can have many Parts. The
link is the same row whichever side it is created from.

------------------------------------------------------------------------

## 6. Database Relationship

``` text
                    item
                  /      \
                 /        \
                /          \
       from_node_id      to_node_id
              \            /
               \          /
                 item_bom
```

This allows one Item to be:

-   A parent of another Item.
-   A child of another Item.
-   A child of multiple parents where the business rules permit it.
-   Part of a multi-level hierarchy.

This design keeps **Item master data** separate from **BOM relationship
data**.

Parts and Sites are connected to Items and each other:

``` text
item.id ----< part.item_id           Item 1 : N Part
part.id ----< part_site >---- site.id   Part N : N Site
```

------------------------------------------------------------------------

## 7. Search Requirements

  Entity   Searchable columns
  -------- ------------------------------
  Items    `item_number`, `item_name`
  Parts    `part_number`, `part_name`
  Sites    `site_name`

The database must support **pagination** for large datasets.

------------------------------------------------------------------------

## 8. PostgreSQL Docker

PostgreSQL runs as a separate container in Docker Compose and stores:

``` text
item
item_bom
part
site
```

Persistent storage must be provided through a **Docker volume** so that
database data is not lost when the container is recreated.

The backend connects to PostgreSQL through the Docker network.
