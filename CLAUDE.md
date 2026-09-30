# Item / Part / Site Management Application

## Context Files

This file holds the overall application context. Layer-specific details live in:

| File | Read when working on |
| ---- | -------------------- |
| [db/CLAUDE.md](db/CLAUDE.md) | PostgreSQL schema, tables, relationships, search/pagination, DB container |
| [backend/CLAUDE.md](backend/CLAUDE.md) | Java 19 / Spring Boot APIs, services, Graph/BOM service, backend container |
| [frontend/CLAUDE.md](frontend/CLAUDE.md) | ReactJS screens, components, Item Hierarchy UI, frontend container |

Read the relevant file before making changes in that layer.

------------------------------------------------------------------------

## 1. What I am Building

An enterprise-style **Item, Part, Site and BOM management application**.

The application manages three primary business entities:

-   **Item**
-   **Part**
-   **Site**

The most important relationship is the **Item BOM**, where an Item is
related to another Item.

``` text
Item
  |
  | item_bom
  v
Item
```

This is a **self-referencing Item-to-Item relationship**.

Users can create, view, search, edit and delete Items, Parts and Sites,
and browse a multi-level Item BOM hierarchy.

The application demonstrates how a product/supply-chain style
application can manage master data and hierarchical BOM relationships.

------------------------------------------------------------------------

## 2. Business Entities

### 2.1 Item

An **Item** represents a product, assembly or finished product.

  Property         Type     Description
  ---------------- -------- ------------------------
  itemNumber       String   Unique item identifier
  itemName         String   Item name
  description      String   Item description
  type             Enum     `ASSEMBLY`, `FINISHED`
  lifeCyclePhase   Enum     `DESIGN`, `PRODUCTION`
  productFamily    String   Product family

Example:

``` text
PROD-001
Product 001
FINISHED
DESIGN
Laptop
```

### 2.2 Part

A **Part** represents a component or sourced/manufactured part.
Parts are maintained independently from Items.

  Property          Type     Description
  ----------------- -------- ------------------------
  partNumber        String   Unique part identifier
  partName          String   Part name
  description       String   Part description
  manufactureName   String   Manufacturer name
  lifeCyclePhase    Enum     `DESIGN`, `PRODUCTION`

Example:

``` text
A-2041
Voltage Regulator
Linear Technology
DESIGN
```

### 2.3 Site

A **Site** represents a manufacturing, production or work-center
location.

  Property     Type     Description
  ------------ -------- -------------------------
  siteName     String   Site name
  siteType     String   Type of site
  workcenter   String   Work-center information
  address      String   Site address

Example:

``` text
Hyderabad Plant
Plant
WC-001
Hyderabad, India
```

------------------------------------------------------------------------

## 3. Item BOM

The Item BOM is the hierarchical relationship between Items
(`Item → Item`), named `item_bom`.

Edge information:

-   `fromNodeId` = Parent Item
-   `toNodeId` = Child Item
-   `quantity`
-   `bomDepth`

Examples:

``` text
PROD-001
   |
   +---- ASSEMBLY-001
             |
             +---- ITEM-0001

PROD-002
   |
   +---- ASSEMBLY-002
             |
             +---- ITEM-0002
```

Conceptual model:

``` text
Item = Node

item_bom = Edge

Graph traversal = Parent → Child
```

The Item BOM is **not** another Item record. It is the **relationship
connecting two Item records**.

### BOM Traversal

Multi-level traversal is required, e.g.:

``` text
PROD-001
   |
   +-- ASSEMBLY-001
          |
          +-- ITEM-0001
                 |
                 +-- COMPONENT-001
```

-   **Downward traversal** (Parent → Child → Grandchild): BOM explosion,
    multi-level hierarchy, N-level traversal, product structure browsing.
-   **Upward traversal** (Child → Parent → Higher-level Product):
    **where-used** scenarios.

------------------------------------------------------------------------

## 4. Overall Business Model

``` text
                         APPLICATION
                              |
              +---------------+---------------+
              |               |               |
             Item            Part            Site
              |
              |
          item_bom
              |
              v
             Item
```

------------------------------------------------------------------------

## 5. Technology Stack

  Layer        Technology
  ------------ -------------------------------
  Database     PostgreSQL (see [db/CLAUDE.md](db/CLAUDE.md))
  Backend      Java 19, Spring Boot (see [backend/CLAUDE.md](backend/CLAUDE.md))
  Frontend     ReactJS (see [frontend/CLAUDE.md](frontend/CLAUDE.md))
  Deployment   Docker, Docker Compose

------------------------------------------------------------------------

## 6. Complete Application Architecture

``` text
                         USER
                           |
                           v
                    ReactJS Frontend
                           |
          +----------------+----------------+
          |                |                |
     Dashboard       Master Data       Item Hierarchy
                          |                  |
                 +--------+--------+         |
                 |        |        |         |
               Items    Parts     Sites       |
                 |        |        |         |
                 +--------+--------+---------+
                          |
                       REST API
                          |
                    Spring Boot
                          |
        +-----------------+------------------+
        |                 |                  |
     Controllers       Services         Graph/BOM
        |                 |              Service
        +-----------------+------------------+
                          |
                     Repositories
                          |
                      PostgreSQL
                          |
        +-----------------+------------------+
        |                 |                  |
       item            item_bom              part
        |                 |                  |
        |                 |                  site
        +-----------------+------------------+
```

Frontend ↔ Backend connection:

``` text
ReactJS
   |
   | REST API
   v
Spring Boot
   |
   +-- Item APIs
   +-- Part APIs
   +-- Site APIs
   +-- BOM APIs
   |
   v
PostgreSQL
```

------------------------------------------------------------------------

## 7. Deployment (Docker)

The application is containerized with Docker Compose, using three
containers:

``` text
                Docker Compose
                     |
       +-------------+-------------+
       |             |             |
       v             v             v
    ReactJS      Spring Boot   PostgreSQL
    / Nginx        API            DB
       |             |             |
       +-------------+-------------+
                 Docker Network
```

Per-container details are in the matching layer file.

------------------------------------------------------------------------

## 8. Final Scope

-   **Master Data:** Item, Part, Site
-   **Relationship:** Item → Item (`item_bom`)
-   **Item Hierarchy:** Product → Assembly → Child Item → Component
-   **Backend:** Java 19, Spring Boot, Controller, Service, Repository,
    Models, DTOs, Graph/BOM Service
-   **Database:** PostgreSQL — `item`, `item_bom`, `part`, `site`
-   **Frontend:** ReactJS — Dashboard, ItemHierarchy, Items, Parts,
    Sites, Search, Filters, Tables, Forms, Pagination, Expand/Collapse
-   **Deployment:** Docker, Docker Compose — Frontend, Backend,
    PostgreSQL

The main purpose is to build a **small but enterprise-style
product/supply-chain application** where master data is maintained
through normal CRUD screens and the Item BOM is explored as a
graph-based hierarchical structure.
