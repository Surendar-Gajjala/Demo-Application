# Demo-Application

A small, enterprise-style **Item, Part, Site and BOM management** application.
It manages master data for Items, Parts and Sites, and the relationships between
them, including a multi-level Item Bill of Materials (BOM).

| Layer    | Technology                                                      |
| -------- | --------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query        |
| Backend  | Java 19, Spring Boot 3.3, Spring Data JPA, OpenAPI (Swagger UI) |
| Database | PostgreSQL 16, Flyway migrations                                |
| Runtime  | Docker, Docker Compose (Nginx serves the frontend)              |

## Data model

```text
Item ── item_bom ──> Item      BOM: self-referencing, multi-level, multi-parent
Item ──── 1 : N ───> Part      a part optionally belongs to one item (part.item_id)
Part <─── N : N ───> Site      a part can be at many sites (part_site)
```

- **Item**: product or assembly (`FINISHED` / `ASSEMBLY`), lifecycle `DESIGN` / `PRODUCTION`.
- **Part**: a component, with an optional parent item.
- **Site**: a plant, assembly line, test or design center.
- **Item BOM**: parent → child edges with a quantity. The database rejects self-links,
  duplicates and cycles.

## Features

- **Dashboard** with totals and recently changed items.
- **Items, Parts, Sites**: search, sort, paginate, add, edit and delete.
  A success message appears after each change.
- **Item Hierarchy**: expandable BOM tree with lazy loading and Expand all / Collapse all.
  The **+** on a row adds a child item with a quantity.
- **Detail pages with relationship tabs**:
  - Item: **Overview**, **BOM**, **Parts** (attach an existing part)
  - Part: **Overview**, **Item**, **Sites** (link a site)
  - Site: **Overview**, **Parts** (link a part)

  Every number or name links to its record, so you can navigate
  Item → Part → Site and back.

## Quick start (Docker)

Requires Docker Desktop (or Docker Engine with the Compose plugin).

```bash
git clone https://github.com/Surendar-Gajjala/Demo-Application.git
cd Demo-Application
cp .env.example .env        # optional: change ports or credentials
docker compose up -d --build
```

The first build takes a few minutes. The backend becomes healthy after it has
applied the database migrations.

| What        | URL                                   |
| ----------- | ------------------------------------- |
| App         | http://localhost:3000                 |
| API         | http://localhost:8080/api             |
| Swagger UI  | http://localhost:8080/swagger-ui.html |
| PostgreSQL  | `localhost:5432`, database `app_demo`, user / password `postgres` / `postgres` |

The database is created with demo data: 24 items, 24 BOM links, 25 parts, 8 sites,
part-to-item assignments and part-to-site links.

```bash
docker compose ps           # status
docker compose logs -f backend
docker compose down         # stop (data is kept in the pgdata volume)
docker compose down -v      # stop and DELETE all data
```

## Project structure

```text
db/          Flyway migrations (V1 schema, V2 seed, V3 relationships, V4 relationship seed),
             BOM traversal queries, SQL verification script
backend/     Spring Boot API: controller / service / repository / model / dto / mapper
frontend/    React app: pages, shared components (tables, forms, tree, tabs), API clients
docs/        requirements, design specs and implementation plans
docker-compose.yml
```

Each layer has its own `CLAUDE.md` describing its design in detail:
[db](db/CLAUDE.md), [backend](backend/CLAUDE.md), [frontend](frontend/CLAUDE.md).
The overall context is in [CLAUDE.md](CLAUDE.md).

## API overview

Base path `/api`. Lists take `search`, `page`, `size` and `sort` and return
`{ content, page, size, totalElements, totalPages }`. Errors are RFC 7807 problem details.

| Area           | Endpoints |
| -------------- | --------- |
| Items          | `GET/POST /items`, `GET/PUT/DELETE /items/{id}` |
| Parts          | `GET/POST /parts`, `GET/PUT/DELETE /parts/{id}` |
| Sites          | `GET/POST /sites`, `GET/PUT/DELETE /sites/{id}` |
| BOM            | `GET /items/bom-roots`, `GET /items/{id}/bom` (explosion), `/bom/children`, `/bom/where-used`, `/bom/parents`, `/bom/candidates`, `POST /items/{id}/bom`, `PUT/DELETE /items/{id}/bom/{bomId}` |
| Item → Parts   | `GET /items/{id}/parts`, `/parts/candidates`, `POST /items/{id}/parts` `{partId}`, `DELETE /items/{id}/parts/{partId}` |
| Part ↔ Site    | `GET /parts/{id}/sites`, `/sites/candidates`, `POST/DELETE /parts/{id}/sites/{siteId}`; mirrored as `/sites/{id}/parts…` |
| Dashboard      | `GET /dashboard/summary` |

Swagger UI documents every endpoint with its request and response shapes.

## Development

### Backend tests

Integration tests use Testcontainers (a real PostgreSQL), so Docker must be running.

```bash
bash backend/mvn-docker.sh verify     # runs Maven in a JDK 19 container
# or, with a local JDK 19 + Maven:
cd backend && mvn verify
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api to localhost:8080
npm test           # Vitest + Testing Library
npm run build      # type-check and production build
```

For `npm run dev`, start the API first, e.g. `docker compose up -d postgres backend`.

### Database checks

```bash
docker compose up -d postgres
bash db/run-verify.sh      # constraint and traversal checks, ends with "ALL CHECKS PASSED"
```

Schema changes go in a new migration (`db/migrations/V5__….sql`). Never edit a
migration that has already been applied.
