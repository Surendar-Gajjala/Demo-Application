# New Requirements Context — Item, Part and Site Relationships

## 1. Requirement Change

The existing Item / Part / Site application is extended with two new relationships:

```text
Item 1 ───────── N Parts

Part N ───────── N Sites
```

The existing BOM relationship remains:

```text
Item ── item_bom ──> Item
```

So the application now supports:

```text
Item → Item      (BOM / self-referencing)
Item → Part      (one-to-many)
Part ↔ Site      (many-to-many)
```

---

# 2. Updated Domain Model

```text
                         ITEM
                           |
                           | 1 : N
                           v
                         PART
                           |
                           | N : N
                           v
                         SITE
```

The Item BOM remains separate:

```text
ITEM
  |
  +── item_bom ──> ITEM
  |
  +── item_bom ──> ITEM
```

Therefore:

```text
Item
 ├── BOM → Items
 └── Parts

Part
 ├── Parent Item
 └── Sites

Site
 └── Parts
```

---

# 3. Item → Part Relationship

The requirement is:

```text
One Item → Many Parts
```

Example:

```text
PROD-001
   |
   +── A-2041
   +── A-1083
   +── A-1758
   +── A-1817
```

The relationship is represented as:

```text
item.id
   |
   +----< part.item_id
```

A Part belongs to one Item under this requirement.

The Item Details page must show all Parts belonging to that Item.

---

# 4. Part → Site Relationship

The requirement is:

```text
Many Parts ↔ Many Sites
```

One Part can be associated with many Sites:

```text
A-2041
   |
   +── Hyderabad Plant
   +── Pune Plant
   +── Austin Plant
```

One Site can contain many Parts:

```text
Hyderabad Plant
   |
   +── A-2041
   +── A-1083
   +── A-1758
```

Therefore a junction table is required:

```text
part_site
```

Conceptually:

```text
Part
  |
  +---- part_site ---- Site
```

---

# 5. Updated Database Context

The main database tables are:

```text
item
item_bom
part
site
part_site
```

## Item

```text
item
--------------------------------
id
item_number
item_name
description
type
life_cycle_phase
product_family
```

## Part

The Part now has a relationship to its parent Item:

```text
part
--------------------------------
id
item_id
part_number
part_name
description
manufacture_name
life_cycle_phase
```

Relationship:

```text
item.id
   |
   +----< part.item_id
```

## Site

```text
site
--------------------------------
id
site_name
site_type
workcenter
address
```

## Part-Site Junction

```text
part_site
--------------------------------
id
part_id
site_id
```

This supports:

```text
One Part → Many Sites
One Site → Many Parts
```

---

# 6. Complete Relationship Model

The application now has three relationship types.

### Item → Item

```text
Item ── item_bom ──> Item
```

Purpose:

- BOM hierarchy
- Parent → Child traversal
- Multi-level BOM
- Graph traversal
- Where-used

### Item → Part

```text
Item 1 ───────── N Part
```

Purpose:

- Show Parts belonging to an Item
- Add Parts to an Item
- Navigate Item → Part

### Part ↔ Site

```text
Part N ───────── N Site
```

Purpose:

- Show Sites for a Part
- Show Parts for a Site
- Associate/disassociate Parts and Sites

---

# 7. Item Details Page — UI Change

The Item Details page gets a new **Parts** tab.

```text
Item Details
------------------------------------------------
Item Number: PROD-001
Item Name: Product 001
Type: FINISHED
Lifecycle: ACTIVE
Product Family: Laptop

[Overview] [BOM] [Parts]
```

When **Parts** is selected:

```text
Parts
------------------------------------------------
[ Search Parts... ]                    [Add Part]

Part Number | Part Name | Manufacturer | Status
------------------------------------------------
A-2041      | Regulator | Linear Tech  | ACTIVE
A-1083      | Rectifier | Molex        | ACTIVE
A-1758      | Comparator| Linear Tech  | ACTIVE
------------------------------------------------
```

Only Parts belonging to the selected Item are shown.

---

# 8. Add Part from Item Details

The Item Details → Parts tab has:

```text
[Add Part]
```

The current Item is automatically the parent context.

Example:

```text
Current Item:
PROD-001
```

The user enters/selects:

```text
Part Number
Part Name
Description
Manufacturer
Lifecycle Phase
```

After saving:

```text
PROD-001
   |
   +── A-2041
```

The new Part is associated with the selected Item.

---

# 9. Part Details Page — UI Change

The Part Details page gets a new **Sites** tab.

```text
Part Details
------------------------------------------------
Part Number: A-2041
Part Name: Voltage Regulator
Manufacturer: Linear Tech
Lifecycle: ACTIVE

[Overview] [Item] [Sites]
```

The Sites tab displays all Sites associated with the Part:

```text
Sites
------------------------------------------------
[ Search Sites... ]                    [Add Site]

Site Name       | Site Type | Workcenter | Address
------------------------------------------------
Hyderabad Plant | Plant     | WC-001     | Hyderabad
Pune Plant      | Plant     | WC-002     | Pune
Austin Plant    | Plant     | WC-003     | Austin
------------------------------------------------
```

---

# 10. Add Site from Part Details

The Part Details → Sites tab has:

```text
[Add Site]
```

The current Part is automatically the relationship context.

Example:

```text
Current Part:
A-2041
```

The user selects:

```text
Hyderabad Plant
```

The relationship becomes:

```text
A-2041
   |
   +── Hyderabad Plant
```

The Part can subsequently be associated with other Sites.

---

# 11. Site Details Page — UI Change

The Site Details page gets a new **Parts** tab.

```text
Site Details
------------------------------------------------
Site Name: Hyderabad Plant
Site Type: Plant
Workcenter: WC-001
Address: Hyderabad

[Overview] [Parts]
```

The Parts tab displays all Parts associated with the Site:

```text
Parts
------------------------------------------------
[ Search Parts... ]                    [Add Part]

Part Number | Part Name | Manufacturer | Status
------------------------------------------------
A-2041      | Regulator | Linear Tech  | ACTIVE
A-1083      | Rectifier | Molex        | ACTIVE
A-1758      | Comparator| Linear Tech  | ACTIVE
------------------------------------------------
```

---

# 12. Add Part from Site Details

The Site Details → Parts tab has:

```text
[Add Part]
```

The user selects an existing Part.

Example:

```text
Current Site:
Hyderabad Plant

Selected Part:
A-2041
```

The relationship becomes:

```text
Hyderabad Plant
   |
   +── A-2041
```

This creates the Part-Site relationship; it does not create another Part record.

---

# 13. Bidirectional Navigation

The same relationship must be visible from both sides.

Example:

```text
Item PROD-001
      |
      +── Part A-2041
```

Opening `A-2041` shows:

```text
Parent Item:
PROD-001

Sites:
  Hyderabad Plant
  Pune Plant
  Austin Plant
```

Opening `Hyderabad Plant` shows:

```text
Parts:
  A-2041
  A-1083
  A-1758
```

This provides connected navigation:

```text
Item → Part → Site
```

and:

```text
Site → Part → Item
```

---

# 14. Updated Navigation Flow

```text
Items
  |
  +── Item Details
       |
       +── Overview
       +── BOM
       +── Parts
             |
             +── Part Details
                   |
                   +── Overview
                   +── Item
                   +── Sites
                         |
                         +── Site Details
                               |
                               +── Overview
                               +── Parts
```

---

# 15. Updated Backend Context

The backend continues to use:

```text
Java 19
Spring Boot
Controller
Service
Repository
Models
DTOs
PostgreSQL
Graph/BOM Service
```

New backend responsibilities are added for relationships.

### Item Parts

```text
GET  /api/items/{itemId}/parts
POST /api/items/{itemId}/parts
```

### Part Sites

```text
GET    /api/parts/{partId}/sites
POST   /api/parts/{partId}/sites/{siteId}
DELETE /api/parts/{partId}/sites/{siteId}
```

### Site Parts

```text
GET    /api/sites/{siteId}/parts
POST   /api/sites/{siteId}/parts/{partId}
DELETE /api/sites/{siteId}/parts/{partId}
```

The Part-Site relationship is the same relationship regardless of which entity page the user starts from.

---

# 16. Updated Frontend Data Flow

## Item → Parts

```text
Item Details
     |
     v
Parts Tab
     |
     v
GET /api/items/{id}/parts
     |
     v
Backend
     |
     v
part.item_id
     |
     v
Parts Table
```

## Part → Sites

```text
Part Details
     |
     v
Sites Tab
     |
     v
GET /api/parts/{id}/sites
     |
     v
Backend
     |
     v
part_site
     |
     v
site
     |
     v
Sites Table
```

## Site → Parts

```text
Site Details
     |
     v
Parts Tab
     |
     v
GET /api/sites/{id}/parts
     |
     v
Backend
     |
     v
part_site
     |
     v
part
     |
     v
Parts Table
```

---

# 17. Final Application Scope

The updated application now supports:

### Item

```text
Item master data
+
BOM hierarchy
+
Parts
```

### Part

```text
Part master data
+
Parent Item
+
Sites
```

### Site

```text
Site master data
+
Parts
```

### Relationships

```text
Item
  |
  +── item_bom ──> Item

Item
  |
  +── 1:N ──> Part

Part
  |
  +── N:N ──> Site
```

### UI

```text
Dashboard
ItemHierarchy
Items
Parts
Sites
```

Entity detail pages:

```text
Item Details
  ├── Overview
  ├── BOM
  └── Parts + Add Part

Part Details
  ├── Overview
  ├── Item
  └── Sites + Add Site

Site Details
  ├── Overview
  └── Parts + Add Part
```

The key new requirement is that **Items, Parts and Sites are now connected data rather than independent master-data screens**. Users can navigate through the relationships in both directions while the existing Item-to-Item BOM remains graph-based.
