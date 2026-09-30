# Frontend Context

See [CLAUDE.md](../CLAUDE.md) for the overall application context and
[backend/CLAUDE.md](../backend/CLAUDE.md) for the REST APIs.

## 1. Technology

``` text
ReactJS
```

The frontend talks to the Spring Boot backend over REST
(`/api/items`, `/api/parts`, `/api/sites`, `/api/items/{id}/bom`).

------------------------------------------------------------------------

## 2. Side Panel

``` text
Home
|
+-- Dashboards
+-- ItemHierarchy
+-- Items
+-- Parts
+-- Sites
```

Each menu item opens its corresponding application screen.

------------------------------------------------------------------------

## 3. Dashboard

High-level view of application data. Possible information:

``` text
Total Items
Total Parts
Total Sites
Design Items
Production Items
BOM information
Recently created Items
Recently updated Items
```

The initial dashboard can remain simple and be expanded later.

------------------------------------------------------------------------

## 4. Items Screen

``` text
Items

[ Search... ]                         [ Add Item ]
```

Table columns:

``` text
Item Number
Item Name
Description
Item Type
Item Status
Product Family
Actions
```

-   Search works against `itemNumber` and `itemName`.
-   **Add Item** opens a new Item form.

------------------------------------------------------------------------

## 5. Parts Screen

``` text
Parts

[ Search... ]                         [ Add Part ]
```

Table columns:

``` text
Part Number
Part Name
Description
Manufacturer
Lifecycle Phase
Actions
```

-   Search works against `partNumber` and `partName`.
-   **Add Part** opens a new Part form.

------------------------------------------------------------------------

## 6. Sites Screen

``` text
Sites

[ Search... ]                         [ Add Site ]
```

Table columns:

``` text
Site Name
Site Type
Workcenter
Address
Actions
```

-   Search works against `siteName`.
-   **Add Site** opens a new Site form.

------------------------------------------------------------------------

## 7. Item Hierarchy Screen

The main graph-based screen.

``` text
Item Hierarchy

[ Search... ] [ Filters ]

------------------------------------------------
Item Number | Description | Type | Status
------------------------------------------------

▼ PROD-001
    ▼ ASSEMBLY-001
        ITEM-0001

▼ PROD-002
    ▼ ASSEMBLY-002
        ITEM-0002
------------------------------------------------
```

Must support:

-   Expand.
-   Collapse.
-   Parent-child visualization.
-   Multi-level traversal.
-   Item information.
-   Search/filter.
-   Lazy loading where appropriate.
-   **Add BOM (+)**: there is no Actions column. The **+** has its own
    narrow first column, before Item Number:
    -   On each row, shown on hover (any level, including top-level
        products); the clicked row is the parent.
    -   In the Item Number header, always shown; the modal then adds a
        **Parent Item** dropdown listing only top-level (BOM root) items from
        `GET /api/items/bom-roots`, e.g. PROD-001.
-   The **Add BOM Item** modal:
    -   **Item**: searchable dropdown fed by `GET /api/items/{id}/bom/candidates`
        (only items that can legally be added).
    -   **Quantity**: number > 0, at most 3 decimals, default 1.
    -   **Cancel** / **Add BOM**: saves `POST /api/items/{id}/bom` with the
        clicked (or picked) row as parent and the chosen item as child, then reloads that
        row's children and expands it. Duplicate / cycle (409) errors show
        under Item.

### Data flow

``` text
User opens Item Hierarchy
          |
          v
Selects / expands Item
          |
          v
Frontend requests BOM
          |
          v
Backend Graph/BOM Service
          |
          v
item_bom relationship
          |
          v
Graph traversal
          |
          v
Child Item nodes
          |
          v
Hierarchy response
          |
          v
React Tree/Table
```

------------------------------------------------------------------------

## 8. Add Button Behavior

Each master-data page has an Add button (Add Item, Add Part, Add Site).
Clicking it opens a form that collects the entity properties and submits
them to the backend.

------------------------------------------------------------------------

## 9. Reusable Components

``` text
SidePanel
Header
SearchBar
FilterButton
DataTable
Pagination
AddButton
Form
Modal
TreeTable
ExpandButton
LoadingState
EmptyState
ErrorState
ConfirmationDialog
```

Items, Parts and Sites share common table and form behavior through
these components.

------------------------------------------------------------------------

## 10. Frontend Docker

The React application is built into static files and served by Nginx.

``` text
React source
     |
     v
Production build
     |
     v
Nginx container
     |
     v
Browser
```
