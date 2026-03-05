INSERT INTO equipment_categories ("CategoryId", "CategoryName", "Description") VALUES 
(1, 'Cardio', 'Cardiovascular equipment'),
(2, 'Machine', 'Resistance machines'),
(3, 'Free Weight', 'Dumbbells, barbells, etc.'),
(4, 'Other', 'Accessories and other equipment')
ON CONFLICT ("CategoryId") DO UPDATE SET 
    "CategoryName" = EXCLUDED."CategoryName",
    "Description" = EXCLUDED."Description";
