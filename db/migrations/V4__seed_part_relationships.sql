-- V4: demo links for Item -> Part and Part <-> Site.
-- Rows are matched by part_number / item_number / site_name, never by id.
-- A-2046, A-2047, A-2049, A-2053 and A-2063 stay unassigned so that
-- "Add Part" on Item Details has something to offer.

------------------------------------------------------------------------
-- Item -> Part (20 of 25 parts get a parent item)
------------------------------------------------------------------------
UPDATE part p
SET item_id = i.id
FROM (VALUES
    ('A-2041', 'PROD-001'),
    ('A-2042', 'PROD-001'),
    ('A-2050', 'PROD-001'),
    ('A-2055', 'PROD-001'),
    ('A-2043', 'PROD-002'),
    ('A-2044', 'PROD-002'),
    ('A-2052', 'PROD-002'),
    ('A-2051', 'PROD-003'),
    ('A-2045', 'ASSEMBLY-001'),
    ('A-2048', 'ASSEMBLY-001'),
    ('A-2064', 'ASSEMBLY-004'),
    ('A-2056', 'ASSEMBLY-005'),
    ('A-2057', 'ASSEMBLY-005'),
    ('A-2065', 'ASSEMBLY-006'),
    ('A-2054', 'ITEM-0004'),
    ('A-2061', 'ITEM-0005'),
    ('A-2062', 'ITEM-0005'),
    ('A-2060', 'ITEM-0006'),
    ('A-2058', 'ITEM-0007'),
    ('A-2059', 'ITEM-0008')
) AS link (part_number, item_number)
JOIN item i ON i.item_number = link.item_number
WHERE p.part_number = link.part_number;

------------------------------------------------------------------------
-- Part <-> Site (24 links)
------------------------------------------------------------------------
INSERT INTO part_site (part_id, site_id)
SELECT p.id, s.id
FROM (VALUES
    ('A-2041', 'Hyderabad Plant'),
    ('A-2041', 'Bengaluru Plant'),
    ('A-2041', 'Austin Design Center'),
    ('A-2042', 'Hyderabad Plant'),
    ('A-2042', 'Shenzhen Plant'),
    ('A-2043', 'Shenzhen Plant'),
    ('A-2043', 'Penang Plant'),
    ('A-2045', 'Hyderabad Plant'),
    ('A-2050', 'Chennai Assembly Line'),
    ('A-2050', 'Shenzhen Plant'),
    ('A-2051', 'Chennai Assembly Line'),
    ('A-2052', 'Austin Design Center'),
    ('A-2052', 'Penang Plant'),
    ('A-2054', 'Penang Plant'),
    ('A-2055', 'Penang Plant'),
    ('A-2055', 'Hyderabad Plant'),
    ('A-2058', 'Chennai Assembly Line'),
    ('A-2061', 'Bengaluru Plant'),
    ('A-2061', 'Pune Test Center'),
    ('A-2062', 'Pune Test Center'),
    ('A-2064', 'Shenzhen Plant'),
    ('A-2065', 'Shenzhen Plant'),
    ('A-2065', 'Rotterdam Distribution'),
    ('A-2059', 'Austin Design Center')
) AS link (part_number, site_name)
JOIN part p ON p.part_number = link.part_number
JOIN site s ON s.site_name = link.site_name;
