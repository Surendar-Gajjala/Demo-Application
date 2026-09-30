# Backend Context

See [CLAUDE.md](../CLAUDE.md) for the overall application context and
[db/CLAUDE.md](../db/CLAUDE.md) for the database schema. The approved DB
design is in
[docs/superpowers/specs/2026-09-29-db-layer-design.md](../docs/superpowers/specs/2026-09-29-db-layer-design.md).

## 1. Technology

  Concern            Choice
  ------------------ ---------------------------------------------------
  Language           Java 19
  Framework          Spring Boot 3.3.5 (Flyway 10, same major as the Compose `flyway` service)
  Build              Maven (`backend/pom.xml`); no local JDK 19 needed, see section 11
  Persistence        Spring Data JPA (Hibernate), PostgreSQL driver
  Schema             Flyway (migrations live in `db/migrations`, not in `backend/`)
  Validation         Jakarta Bean Validation (`spring-boot-starter-validation`)
  API docs           springdoc-openapi (Swagger UI at `/swagger-ui.html`)
  Health             Spring Boot Actuator (`/actuator/health`)
  Tests              JUnit 5, Mockito, MockMvc, Testcontainers (PostgreSQL)

Rules:

-   Hibernate **never** creates or alters tables:
    `spring.jpa.hibernate.ddl-auto=validate`. Schema changes are made only by
    adding a new Flyway migration in `db/migrations`.
-   `spring.jpa.open-in-view=false`.
-   Constructor injection only; no field `@Autowired`.

------------------------------------------------------------------------

## 2. Layered Architecture

``` text
Controller      REST endpoints, request validation, HTTP status codes
    |
    v
Service         Business rules, transactions, DTO <-> entity mapping
    |
    v
Repository      Spring Data JPA + native recursive queries for the BOM
    |
    v
PostgreSQL
```

-   Controllers accept and return **DTOs only**, never JPA entities.
-   `@Transactional` lives on service methods (`readOnly = true` for reads).
-   Controllers never call repositories directly.

------------------------------------------------------------------------

## 3. Project Structure

``` text
backend/
  pom.xml
  Dockerfile
  src/main/java/com/demo/application/
    DemoApplication.java
    config/          CorsConfig, OpenApiConfig
    controller/      ItemController, PartController, SiteController,
                     BomController, DashboardController
    service/         ItemService, PartService, SiteService,
                     BomService, DashboardService
    repository/      ItemRepository, ItemBomRepository,
                     PartRepository, SiteRepository
    model/           Item, ItemBom, Part, Site, BaseEntity,
                     ItemType, LifeCyclePhase
    dto/             request/response records (see section 6)
    mapper/          ItemMapper, PartMapper, SiteMapper, BomMapper
    exception/       NotFoundException, ConflictException,
                     BomCycleException, GlobalExceptionHandler
  src/main/resources/
    application.yml
  src/test/java/com/demo/application/...
```

------------------------------------------------------------------------

## 4. Model (JPA Entities)

Entities map 1:1 to the tables in [db/CLAUDE.md](../db/CLAUDE.md).

-   `BaseEntity` (`@MappedSuperclass`): `id` (`IDENTITY`), `createdAt`,
    `updatedAt`. Both timestamps are `insertable = false, updatable = false`
    because the database sets them (defaults + `set_updated_at` trigger).
-   Enums are stored with `@Enumerated(EnumType.STRING)`:
    -   `ItemType { ASSEMBLY, FINISHED }`
    -   `LifeCyclePhase { DESIGN, PRODUCTION }`
-   `ItemBom` has `@ManyToOne(fetch = LAZY)` to `Item` for both
    `fromNode` (parent) and `toNode` (child).
-   `Item` does **not** map collections of BOM edges. BOM navigation always
    goes through `BomService` / `ItemBomRepository`.

  Entity     Table       Key fields
  ---------- ----------- -----------------------------------------------------------
  Item       item        itemNumber (unique), itemName, description, type, lifeCyclePhase, productFamily
  ItemBom    item_bom    fromNode, toNode, quantity (BigDecimal), bomDepth, sequence
  Part       part        partNumber (unique), partName, description, manufactureName, lifeCyclePhase
  Site       site        siteName, siteType, workcenter, address

------------------------------------------------------------------------

## 5. REST API

Base path `/api`. JSON only. IDs are numeric (`Long`).

### 5.1 Items `/api/items`

  Method   Path                  Purpose                                    Success
  -------- --------------------- ------------------------------------------ ---------
  GET      `/api/items`          Search + filter + paginate                 200
  GET      `/api/items/{id}`     Get one Item                               200
  POST     `/api/items`          Create Item                                201 + `Location`
  PUT      `/api/items/{id}`     Replace Item fields                        200
  DELETE   `/api/items/{id}`     Delete Item (its BOM edges cascade)        204

`GET /api/items` query params: `search`, `type`, `lifeCyclePhase`, `page`,
`size`, `sort`.

### 5.2 Parts `/api/parts`

Same five operations as Items. Query params: `search`, `lifeCyclePhase`,
`page`, `size`, `sort`.

### 5.3 Sites `/api/sites`

Same five operations as Items. Query params: `search`, `siteType`, `page`,
`size`, `sort`.

### 5.4 BOM `/api/items/{id}/bom`

`{id}` is always the Item the request is about.

  Method   Path                                    Purpose
  -------- --------------------------------------- ------------------------------------------------------
  GET      `/api/items/{id}/bom`                   Multi-level explosion as a nested tree (`?maxDepth=`)
  GET      `/api/items/{id}/bom/children`          Direct children only (lazy loading in the tree)
  GET      `/api/items/{id}/bom/where-used`        All ancestors, nested upward (`?maxDepth=`)
  GET      `/api/items/{id}/bom/parents`           Direct parents only
  GET      `/api/items/{id}/bom/candidates`        Items that may be added under {id} (`search`, `page`, `size`, `sort`): excludes {id}, its direct children and its ancestors
  POST     `/api/items/{id}/bom`                   Add child: body `BomLinkRequest` → 201
  PUT      `/api/items/{id}/bom/{bomId}`           Change quantity / sequence → 200
  DELETE   `/api/items/{id}/bom/{bomId}`           Remove the edge (Items stay) → 204

Hierarchy screen top level:

  Method   Path                    Purpose
  -------- ----------------------- -----------------------------------------------------------
  GET      `/api/items/bom-roots`  Paginated Items that have children but no parent (`search`, `type`, `lifeCyclePhase`, `page`, `size`)

For `PUT`/`DELETE`, the edge `bomId` must have `from_node_id = {id}`,
otherwise 404.

### 5.5 Dashboard `/api/dashboard`

  Method   Path                        Purpose
  -------- --------------------------- ---------------------------------------------
  GET      `/api/dashboard/summary`    Counts and recent Items (see `DashboardSummary`)

------------------------------------------------------------------------

## 6. DTOs

All DTOs are Java `record`s in `dto/`.

### Requests (validated with `@Valid`)

``` text
ItemRequest   itemNumber      @NotBlank @Size(max=50)
              itemName        @NotBlank @Size(max=255)
              description     optional
              type            @NotNull ItemType
              lifeCyclePhase  @NotNull LifeCyclePhase
              productFamily   @Size(max=100)

PartRequest   partNumber      @NotBlank @Size(max=50)
              partName        @NotBlank @Size(max=255)
              description     optional
              manufactureName @Size(max=255)
              lifeCyclePhase  @NotNull LifeCyclePhase

SiteRequest   siteName        @NotBlank @Size(max=255)
              siteType        @Size(max=100)
              workcenter      @Size(max=100)
              address         optional

BomLinkRequest    childId   @NotNull
                  quantity  @NotNull @Positive (BigDecimal, default 1 on client)
                  sequence  optional (default 10)

BomUpdateRequest  quantity  @NotNull @Positive
                  sequence  @NotNull
```

### Responses

``` text
ItemResponse   id, itemNumber, itemName, description, type,
               lifeCyclePhase, productFamily, createdAt, updatedAt
PartResponse   id, partNumber, partName, description, manufactureName,
               lifeCyclePhase, createdAt, updatedAt
SiteResponse   id, siteName, siteType, workcenter, address,
               createdAt, updatedAt

BomNodeResponse
  bomId          edge id (null for the root node)
  itemId, itemNumber, itemName, description, type, lifeCyclePhase
  quantity, sequence   (null for the root node)
  level          0 = root, 1 = direct child/parent, ...
  hasChildren    true if this Item has further edges in the traversal direction
  children       List<BomNodeResponse> (empty for /children, /parents)

PageResponse<T>
  content, page, size, totalElements, totalPages

DashboardSummary
  totalItems, totalParts, totalSites,
  itemsByLifeCyclePhase { DESIGN: n, PRODUCTION: n },
  itemsByType { ASSEMBLY: n, FINISHED: n },
  totalBomLinks,
  recentlyCreatedItems (5 ItemResponse), recentlyUpdatedItems (5 ItemResponse)
```

`PageResponse` is our own type; do not return Spring's `Page` directly
(its JSON shape is not stable).

------------------------------------------------------------------------

## 7. Search, Filter and Pagination

-   `search` is a case-insensitive **contains** match (`lower(col) LIKE
    lower('%' || :q || '%')`), which uses the trigram indexes from the DB
    layer.

      Entity   `search` matches
      -------- ------------------------------
      Item     `itemNumber` OR `itemName`
      Part     `partNumber` OR `partName`
      Site     `siteName`

-   Filters (`type`, `lifeCyclePhase`, `siteType`) are exact matches and are
    AND-ed with `search`. Blank or missing params are ignored.
-   Implemented with JPA `Specification`s.
-   `page` is 0-based, default 0. `size` default 20, max 100 (clamp larger
    values).
-   `sort` uses Spring format `field,asc|desc`. Only whitelisted fields are
    accepted (unknown field → 400):
    -   Item: `itemNumber`, `itemName`, `type`, `lifeCyclePhase`,
        `productFamily`, `createdAt`, `updatedAt` (default `itemNumber,asc`)
    -   Part: `partNumber`, `partName`, `manufactureName`, `lifeCyclePhase`,
        `createdAt`, `updatedAt` (default `partNumber,asc`)
    -   Site: `siteName`, `siteType`, `workcenter`, `createdAt`,
        `updatedAt` (default `siteName,asc`)

------------------------------------------------------------------------

## 8. Graph Query / BOM Service

The Graph Query functionality is used specifically for the Item BOM
hierarchy. It works with:

``` text
Item nodes
      +
item_bom edges
```

Traversal starts from a selected Item and follows the BOM relationship.

-   **Downward traversal:** `fromNodeId → toNodeId`
    (BOM explosion, e.g. `PROD-001 → ASSEMBLY-001 → ITEM-0001`).
-   **Upward traversal:** `toNodeId → fromNodeId` (where-used).

``` text
PROD-001
    |
    | item_bom
    v
ASSEMBLY-001
    |
    | item_bom
    v
ITEM-0001
```

### Implementation

-   Traversal uses **one native recursive CTE per request** in
    `ItemBomRepository` (same shape as `db/queries/bom_explosion.sql` and
    `db/queries/bom_where_used.sql`). Never load the tree with one query per
    level (N+1).
-   The CTE returns flat rows (`bomId, parentId, itemId, level, path,
    quantity, sequence` + item columns). `BomService` assembles them into a
    nested `BomNodeResponse` tree, children ordered by `sequence`, then
    `itemNumber`.
-   `maxDepth` default 10, max 20. The CTE also carries a visited-path
    array as a cycle guard.
-   Items can have several parents, so a shared sub-assembly appears under
    each parent in an explosion. That is expected.
-   `hasChildren` is computed with an `EXISTS` subquery so the frontend can
    show an expand arrow without loading the next level.
-   `bom_depth` from the table is informational only. The response `level`
    always comes from the traversal.

### Rules when creating or updating an edge

  Rule                                                 Result
  ---------------------------------------------------- -------------------------
  Parent or child Item does not exist                  404
  `childId == id` (self-reference)                     400
  Edge parent → child already exists                   409
  Child is already an ancestor of the parent (cycle)   409 `BomCycleException`
  `quantity <= 0`                                      400

-   `BomService` checks for a cycle **before** insert using a recursive
    ancestor query, so the user gets a clear message.
-   The DB trigger `prevent_bom_cycle` is the final guarantee (e.g. for
    concurrent requests). Its error (SQLSTATE `23514`) is also mapped to 409.

### Request flow for the hierarchy

``` text
React ItemHierarchy
        |
        v
GET /api/items/bom-roots          (top-level rows)
GET /api/items/{id}/bom/children  (on expand, lazy)
GET /api/items/{id}/bom           (full explosion, "expand all")
        |
        v
BomService  →  ItemBomRepository (recursive CTE)
        |
        v
item_bom + item
        |
        v
BomNodeResponse tree
        |
        v
React Tree Table
```

------------------------------------------------------------------------

## 9. Exception Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) returns RFC 7807
`ProblemDetail` JSON (`application/problem+json`) for every error:

``` json
{
  "type": "about:blank",
  "title": "Validation failed",
  "status": 400,
  "detail": "Request has invalid fields",
  "instance": "/api/items",
  "errors": { "itemNumber": "must not be blank" }
}
```

  Cause                                                    Status
  -------------------------------------------------------- --------
  `MethodArgumentNotValidException`, bad enum, bad sort    400
  `NotFoundException`                                      404
  `ConflictException` (duplicate itemNumber/partNumber,    409
  duplicate BOM edge)
  `BomCycleException`, DB SQLSTATE `23514` from cycle      409
  trigger
  DB unique violation SQLSTATE `23505`                     409
  Anything else                                            500 (no stack trace in body; logged)

-   Services check uniqueness (`existsByItemNumber...`) before saving for a
    friendly message; the unique constraint is the fallback.

------------------------------------------------------------------------

## 10. Configuration

`application.yml` reads everything environment-specific from env vars:

  Env var               Default                                        Used for
  --------------------- ---------------------------------------------- ------------------------------
  `DB_URL`              `jdbc:postgresql://localhost:5432/app_demo`    `spring.datasource.url`
  `DB_USERNAME`         `postgres`                                     `spring.datasource.username`
  `DB_PASSWORD`         `postgres`                                     `spring.datasource.password`
  `FLYWAY_LOCATIONS`    `filesystem:../db/migrations`                  `spring.flyway.locations`
  `CORS_ALLOWED_ORIGINS` `http://localhost:5173,http://localhost:3000` `CorsConfig`
  `SERVER_PORT`         `8080`                                         `server.port`

-   Flyway runs on backend startup and applies `db/migrations`. The
    standalone `flyway` Compose service is in the `tools` profile
    (`docker compose run --rm flyway`) for DB work without the backend.

------------------------------------------------------------------------

## 11. Testing

  Test                          Type          What it covers
  ----------------------------- ------------- -----------------------------------------------
  `PageRequestFactoryTest`      Unit          size clamp, sort whitelist, direction parsing
  `BomTreeBuilderTest`          Unit          DFS rows -> nested tree, shared sub-assemblies
  `ApplicationIT`               Integration   context + Flyway + Hibernate validate, health UP
  `ItemApiIT`                   Integration   CRUD, 409 duplicate, 400 validation, search, paging, sort
  `PartApiIT`, `SiteApiIT`      Integration   CRUD, search, filters, validation
  `BomApiIT`                    Integration   explosion, children, where-used, parents, roots,
                                              add/update/remove link, self 400, duplicate 409,
                                              cycle 409, DB trigger
  `DashboardApiIT`              Integration   counts and recent items

-   `*Test` run with Surefire (`mvn test`), `*IT` with Failsafe (`mvn verify`).
-   Integration tests extend `AbstractPostgresIT`: `@SpringBootTest` + MockMvc
    + one shared Testcontainers `postgres:16-alpine` with V1 + V2 applied.
    Tests create their own rows (random numbers) and never modify seed rows.

-   Never use H2: recursive CTEs, trigram indexes and the cycle trigger are
    PostgreSQL-specific.
-   Run all tests from the repo root with `bash backend/mvn-docker.sh verify`.
    It runs Maven in `maven:3.9-eclipse-temurin-19`, mounts the repo (for
    `../db/migrations`) and the Docker socket (for Testcontainers), and caches
    dependencies in the `demo-m2` volume. With a local JDK 19 + Maven,
    `mvn verify` from `backend/` works too.

------------------------------------------------------------------------

## 12. Backend Docker

The Spring Boot application runs in its own container.

``` text
Java 19
   |
Spring Boot
   |
Docker container
   |
REST API (port 8080)
```

-   `backend/Dockerfile` is multi-stage:
    1.  `maven:3.9-eclipse-temurin-19` builds the jar (`mvn package
        -DskipTests`).
    2.  `eclipse-temurin:19-jre` runs it as a non-root user.
-   The Compose build context is the repo root so the image can copy
    `db/migrations` to `/app/db/migrations`; the container sets
    `FLYWAY_LOCATIONS=filesystem:/app/db/migrations`.
-   The backend connects to PostgreSQL through the Docker network
    (`DB_URL=jdbc:postgresql://postgres:5432/app_demo`) and waits for the
    `postgres` service to be healthy.
-   Compose healthcheck: `curl /actuator/health`.
-   Run: `docker compose up -d --build backend` -> http://localhost:8080
    (Swagger UI: http://localhost:8080/swagger-ui.html).
