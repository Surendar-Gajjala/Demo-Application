# DB Layer Design

Date: 2026-09-29
Scope: PostgreSQL database layer for the Item / Part / Site / BOM application
(see `CLAUDE.md` and `db/CLAUDE.md`). Backend and frontend are out of scope.

## Decisions

| Topic | Decision |
| ----- | -------- |
| Schema management | Flyway versioned SQL migrations in `db/migrations` |
| Runtime (now) | `docker-compose.yml` with `postgres` + one-shot `flyway` service |
| Runtime (later) | Spring Boot backend may run the same migrations from `db/migrations` |
| Seed data | Demo seed in its own migration (`V2`) |
| BOM topology | Multi-parent allowed (DAG); self-edges, duplicate edges and cycles rejected |
| Enum storage | `VARCHAR` + `CHECK` (not native PG enums) |
| Primary keys | `BIGINT GENERATED ALWAYS AS IDENTITY` |

## Layout

```
docker-compose.yml
.env.example
db/
  CLAUDE.md
  migrations/
    V1__create_schema.sql
    V2__seed_demo_data.sql
  queries/
    bom_explosion.sql
    bom_where_used.sql
  tests/
    verify.sql
```

## Schema (V1)

### Common

- Extension `pg_trgm`.
- Function `set_updated_at()` + `BEFORE UPDATE` trigger on every table sets
  `updated_at = now()`.
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT now()`.

### item

| Column | Type | Constraints |
| ------ | ---- | ----------- |
| id | BIGINT identity | PK |
| item_number | VARCHAR(50) | NOT NULL, UNIQUE |
| item_name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| type | VARCHAR(20) | NOT NULL, CHECK IN ('ASSEMBLY','FINISHED') |
| life_cycle_phase | VARCHAR(20) | NOT NULL, CHECK IN ('DESIGN','PRODUCTION') |
| product_family | VARCHAR(100) | |

### item_bom

| Column | Type | Constraints |
| ------ | ---- | ----------- |
| id | BIGINT identity | PK |
| from_node_id | BIGINT | NOT NULL, FK item(id) ON DELETE CASCADE |
| to_node_id | BIGINT | NOT NULL, FK item(id) ON DELETE CASCADE |
| quantity | NUMERIC(12,3) | NOT NULL DEFAULT 1, CHECK > 0 |
| bom_depth | INT | NOT NULL DEFAULT 1, CHECK >= 1 (informational) |
| sequence | INT | NOT NULL DEFAULT 10 |

- `CHECK (from_node_id <> to_node_id)`
- `UNIQUE (from_node_id, to_node_id)`
- Indexes on `from_node_id` and `to_node_id`.
- Trigger `prevent_bom_cycle` (`BEFORE INSERT OR UPDATE OF from_node_id, to_node_id`):
  recursive walk of ancestors of `NEW.from_node_id`; if `NEW.to_node_id` is
  among them (or equal), raise `check_violation` with a descriptive message.
- `bom_depth` is not authoritative: with multiple parents an edge has no single
  depth. Real levels come from the recursive traversal queries.

### part

| Column | Type | Constraints |
| ------ | ---- | ----------- |
| id | BIGINT identity | PK |
| part_number | VARCHAR(50) | NOT NULL, UNIQUE |
| part_name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| manufacture_name | VARCHAR(255) | |
| life_cycle_phase | VARCHAR(20) | NOT NULL, CHECK IN ('DESIGN','PRODUCTION') |

### site

| Column | Type | Constraints |
| ------ | ---- | ----------- |
| id | BIGINT identity | PK |
| site_name | VARCHAR(255) | NOT NULL |
| site_type | VARCHAR(100) | |
| workcenter | VARCHAR(100) | |
| address | TEXT | |

### Search indexes

GIN `gin_trgm_ops` indexes on `lower(...)` of: `item.item_number`,
`item.item_name`, `part.part_number`, `part.part_name`, `site.site_name`.
Search is `lower(col) LIKE lower('%' || :q || '%')` (equivalent to `ILIKE`).

## Seed (V2)

- `PROD-001 → ASSEMBLY-001 → ITEM-0001 → COMPONENT-001`
- `PROD-002 → ASSEMBLY-002 → ITEM-0002`
- ~20 extra items incl. `ASSEMBLY-SHARED` used by both `PROD-001` and `PROD-002`.
- ~25 parts (incl. `A-2041 Voltage Regulator, Linear Technology`).
- ~8 sites (incl. `Hyderabad Plant, Plant, WC-001, Hyderabad, India`).
- Edges inserted by looking up `item_number`, never hard-coded ids.

## Reference queries

- `bom_explosion.sql`: parameter `:root_id`; returns `item_id, parent_id,
  level, path (item_number array), quantity, sequence`; ordered by path;
  path-based cycle guard.
- `bom_where_used.sql`: parameter `:item_id`; walks `to_node_id → from_node_id`.

## Testing

`db/tests/verify.sql` runs with `psql -v ON_ERROR_STOP=1` inside a
transaction that is rolled back. Each check raises an exception on failure:

1. Explosion of `PROD-001` contains `ASSEMBLY-001`, `ITEM-0001`,
   `COMPONENT-001` at levels 1, 2, 3.
2. Where-used of `ASSEMBLY-SHARED` returns `PROD-001` and `PROD-002`.
3. Inserting `COMPONENT-001 → PROD-001` fails (cycle).
4. Self-edge fails; duplicate edge fails.
5. Invalid `type` / `life_cycle_phase` fails; `quantity <= 0` fails.
6. `updated_at` changes after an `UPDATE`.

Success: `docker compose up` applies V1 and V2; `verify.sql` prints
`ALL CHECKS PASSED`.
