-- V2: demo data for Items, Item BOM, Parts and Sites.
-- BOM edges reference items by item_number, never by id.

------------------------------------------------------------------------
-- Items: products are FINISHED, everything below them is ASSEMBLY
------------------------------------------------------------------------
INSERT INTO item (item_number, item_name, description, type, life_cycle_phase, product_family) VALUES
    ('PROD-001',        'Product 001',             'Business laptop 14"',                'FINISHED', 'PRODUCTION', 'Laptop'),
    ('PROD-002',        'Product 002',             'Gaming laptop 16"',                  'FINISHED', 'PRODUCTION', 'Laptop'),
    ('PROD-003',        'Product 003',             'Small form factor desktop',          'FINISHED', 'PRODUCTION', 'Desktop'),
    ('PROD-004',        'Product 004',             '10" tablet',                         'FINISHED', 'DESIGN',     'Tablet'),
    ('PROD-005',        'Product 005',             '27" monitor',                        'FINISHED', 'DESIGN',     'Monitor'),
    ('ASSEMBLY-001',    'Mainboard Assembly 001',  'Mainboard assembly for PROD-001',    'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('ASSEMBLY-002',    'Mainboard Assembly 002',  'Mainboard assembly for PROD-002',    'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('ASSEMBLY-003',    'Chassis Assembly 003',    'Desktop chassis assembly',           'ASSEMBLY', 'PRODUCTION', 'Desktop'),
    ('ASSEMBLY-004',    'Display Assembly 004',    'Tablet display and touch module',    'ASSEMBLY', 'DESIGN',     'Tablet'),
    ('ASSEMBLY-005',    'Cooling Assembly 005',    'Fan and heatsink assembly',          'ASSEMBLY', 'PRODUCTION', 'Desktop'),
    ('ASSEMBLY-006',    'Panel Assembly 006',      'Monitor panel and backlight',        'ASSEMBLY', 'DESIGN',     'Monitor'),
    ('ASSEMBLY-SHARED', 'Power Supply Assembly',   'Power supply shared by laptops',     'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('ITEM-0001',       'CPU Module 0001',         'CPU module for ASSEMBLY-001',        'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('ITEM-0002',       'CPU Module 0002',         'CPU module for ASSEMBLY-002',        'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('ITEM-0003',       'Memory Module 0003',      '16 GB memory module',                'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('ITEM-0004',       'Storage Module 0004',     '512 GB SSD module',                  'ASSEMBLY', 'PRODUCTION', 'Desktop'),
    ('ITEM-0005',       'Battery Pack 0005',       'Battery pack',                       'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('ITEM-0006',       'Touch Controller 0006',   'Touch controller board',             'ASSEMBLY', 'DESIGN',     'Tablet'),
    ('ITEM-0007',       'Fan Unit 0007',           '92 mm fan unit',                     'ASSEMBLY', 'PRODUCTION', 'Desktop'),
    ('ITEM-0008',       'Backlight Unit 0008',     'LED backlight unit',                 'ASSEMBLY', 'DESIGN',     'Monitor'),
    ('COMPONENT-001',   'Heat Spreader 001',       'Copper heat spreader',               'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('COMPONENT-002',   'Voltage Regulator 002',   'Voltage regulator module',           'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('COMPONENT-003',   'Power Connector 003',     'DC power connector',                 'ASSEMBLY', 'PRODUCTION', 'Laptop'),
    ('COMPONENT-004',   'Thermal Pad 004',         'Thermal interface pad',              'ASSEMBLY', 'PRODUCTION', 'Desktop');

------------------------------------------------------------------------
-- Item BOM (parent -> child)
------------------------------------------------------------------------
INSERT INTO item_bom (from_node_id, to_node_id, quantity, bom_depth, sequence)
SELECT p.id, c.id, v.quantity, v.bom_depth, v.sequence
FROM (VALUES
    ('PROD-001',        'ASSEMBLY-001',    1, 1, 10),
    ('PROD-001',        'ASSEMBLY-SHARED', 1, 1, 20),
    ('PROD-001',        'ITEM-0005',       1, 1, 30),
    ('ASSEMBLY-001',    'ITEM-0001',       1, 2, 10),
    ('ASSEMBLY-001',    'ITEM-0003',       2, 2, 20),
    ('ITEM-0001',       'COMPONENT-001',   1, 3, 10),
    ('ASSEMBLY-SHARED', 'COMPONENT-002',   2, 2, 10),
    ('ASSEMBLY-SHARED', 'COMPONENT-003',   1, 2, 20),

    ('PROD-002',        'ASSEMBLY-002',    1, 1, 10),
    ('PROD-002',        'ASSEMBLY-SHARED', 1, 1, 20),
    ('PROD-002',        'ITEM-0005',       2, 1, 30),
    ('ASSEMBLY-002',    'ITEM-0002',       1, 2, 10),
    ('ASSEMBLY-002',    'ITEM-0003',       4, 2, 20),
    ('ITEM-0002',       'COMPONENT-001',   1, 3, 10),

    ('PROD-003',        'ASSEMBLY-003',    1, 1, 10),
    ('ASSEMBLY-003',    'ASSEMBLY-005',    1, 2, 10),
    ('ASSEMBLY-003',    'ITEM-0004',       2, 2, 20),
    ('ASSEMBLY-005',    'ITEM-0007',       2, 3, 10),
    ('ASSEMBLY-005',    'COMPONENT-004',   4, 3, 20),

    ('PROD-004',        'ASSEMBLY-004',    1, 1, 10),
    ('PROD-004',        'ITEM-0005',       1, 1, 20),
    ('ASSEMBLY-004',    'ITEM-0006',       1, 2, 10),

    ('PROD-005',        'ASSEMBLY-006',    1, 1, 10),
    ('ASSEMBLY-006',    'ITEM-0008',       1, 2, 10)
) AS v (parent, child, quantity, bom_depth, sequence)
JOIN item p ON p.item_number = v.parent
JOIN item c ON c.item_number = v.child;

-- Fail the migration if a typo in the list above silently dropped an edge.
DO $$
BEGIN
    IF (SELECT count(*) FROM item_bom) <> 24 THEN
        RAISE EXCEPTION 'Seed error: expected 24 item_bom rows, found %',
            (SELECT count(*) FROM item_bom);
    END IF;
END $$;

------------------------------------------------------------------------
-- Parts
------------------------------------------------------------------------
INSERT INTO part (part_number, part_name, description, manufacture_name, life_cycle_phase) VALUES
    ('A-2041', 'Voltage Regulator',        'Low-dropout linear regulator 3.3 V',   'Linear Technology',   'PRODUCTION'),
    ('A-2042', 'Buck Converter',           'Synchronous step-down converter 5 A',  'Texas Instruments',   'PRODUCTION'),
    ('A-2043', 'MOSFET N-Channel',         '30 V N-channel MOSFET',                'Infineon',            'PRODUCTION'),
    ('A-2044', 'Schottky Diode',           '40 V 3 A Schottky diode',              'ON Semiconductor',    'PRODUCTION'),
    ('A-2045', 'Ceramic Capacitor 10uF',   'X7R 0805 10 uF 25 V',                  'Murata',              'PRODUCTION'),
    ('A-2046', 'Ceramic Capacitor 100nF',  'X7R 0402 100 nF 50 V',                 'Samsung Electro-Mechanics', 'PRODUCTION'),
    ('A-2047', 'Resistor 10k',             'Thick film 0402 10 kOhm 1%',           'Yageo',               'PRODUCTION'),
    ('A-2048', 'Inductor 2.2uH',           'Power inductor 2.2 uH 6 A',            'TDK',                 'PRODUCTION'),
    ('A-2049', 'Crystal 24MHz',            '24 MHz SMD crystal',                   'Epson',               'PRODUCTION'),
    ('A-2050', 'USB-C Connector',          'USB Type-C receptacle 24-pin',         'Amphenol',            'PRODUCTION'),
    ('A-2051', 'DC Jack',                  '5.5 x 2.1 mm DC power jack',           'CUI Devices',         'PRODUCTION'),
    ('A-2052', 'Microcontroller',          '32-bit ARM Cortex-M4 MCU',             'STMicroelectronics',  'PRODUCTION'),
    ('A-2053', 'EEPROM 256Kb',             'I2C serial EEPROM',                    'Microchip',           'PRODUCTION'),
    ('A-2054', 'NAND Flash 512GB',         '3D NAND flash die package',            'Kioxia',              'PRODUCTION'),
    ('A-2055', 'DRAM 8GB',                 'LPDDR5 8 GB package',                  'Micron',              'PRODUCTION'),
    ('A-2056', 'Thermal Pad',              '1.5 mm thermal interface pad',         'Bergquist',           'PRODUCTION'),
    ('A-2057', 'Heat Pipe',                'Copper sintered heat pipe 6 mm',       'Auras',               'PRODUCTION'),
    ('A-2058', 'Fan Motor',                '92 mm brushless fan motor',            'Nidec',               'PRODUCTION'),
    ('A-2059', 'LED Driver',               'Backlight LED driver IC',              'Analog Devices',      'DESIGN'),
    ('A-2060', 'Touch Controller IC',      'Capacitive touch controller',          'Synaptics',           'DESIGN'),
    ('A-2061', 'Li-ion Cell',              '3.7 V 5000 mAh Li-ion cell',           'Panasonic',           'PRODUCTION'),
    ('A-2062', 'Battery Protection IC',    'Li-ion protection IC',                 'Renesas',             'PRODUCTION'),
    ('A-2063', 'EMI Filter',               'Common-mode choke EMI filter',         'Wurth Elektronik',    'PRODUCTION'),
    ('A-2064', 'Display Panel 10in',       '10.1 in IPS LCD panel',                'BOE',                 'DESIGN'),
    ('A-2065', 'Display Panel 27in',       '27 in IPS LCD panel',                  'LG Display',          'DESIGN');

------------------------------------------------------------------------
-- Sites
------------------------------------------------------------------------
INSERT INTO site (site_name, site_type, workcenter, address) VALUES
    ('Hyderabad Plant',        'Plant',              'WC-001', 'Hyderabad, India'),
    ('Bengaluru Plant',        'Plant',              'WC-002', 'Bengaluru, India'),
    ('Chennai Assembly Line',  'Assembly Line',      'WC-003', 'Chennai, India'),
    ('Pune Test Center',       'Test Center',        'WC-004', 'Pune, India'),
    ('Shenzhen Plant',         'Plant',              'WC-101', 'Shenzhen, China'),
    ('Penang Plant',           'Plant',              'WC-201', 'Penang, Malaysia'),
    ('Austin Design Center',   'Design Center',      'WC-301', 'Austin, Texas, USA'),
    ('Rotterdam Distribution', 'Distribution Center','WC-401', 'Rotterdam, Netherlands');
