-- ============================================================
-- TEST DATA INSERTION FOR EQUIPMENT AND INBODY MEASUREMENTS
-- For AI Workout Generator Testing
-- ============================================================

-- ============================================================
-- 1. INSERT ADDITIONAL EQUIPMENT (More variety for testing)
-- ============================================================

-- Equipment Categories
INSERT INTO equipment_categories ("CategoryName", "Description", "Icon") VALUES
('Cardio', 'Cardiovascular training equipment', '🏃'),
('Strength', 'Free weights and strength training machines', '💪'),
('Functional', 'Functional training and CrossFit equipment', '🏋'),
('Recovery', 'Recovery and flexibility equipment', '🧘'),
('Olympic', 'Olympic weightlifting platforms and equipment', '🏅')
ON CONFLICT DO NOTHING;

-- Cardio Equipment
INSERT INTO equipment ("CategoryId", "Name", "Model", "Manufacturer", "SerialNumber", "Location", "Status", "ConditionRating", "LastMaintenanceDate", "NextMaintenanceDate", "BookingCostTokens", "MaxBookingDurationMinutes", "ImageUrl", "IsActive", "CreatedAt", "UpdatedAt") VALUES
-- Treadmills
(1, 'Treadmill Pro X1', 'TX-2024', 'ProFit', 'TM-001', 'Cardio Zone A', 0, 5, '2024-10-01', '2025-01-01', 5, 60, NULL, true, NOW(), NOW()),
(1, 'Treadmill Elite', 'TE-2024', 'NordicTrack', 'TM-002', 'Cardio Zone A', 0, 4, '2024-09-15', '2024-12-15', 5, 60, NULL, true, NOW(), NOW()),
(1, 'Treadmill Standard', 'TS-2023', 'Life Fitness', 'TM-003', 'Cardio Zone B', 0, 3, '2024-08-20', '2024-11-20', 3, 60, NULL, true, NOW(), NOW()),

-- Rowing Machines
(1, 'Concept2 Rower Model D', 'Model D', 'Concept2', 'ROW-001', 'Cardio Zone A', 0, 5, '2024-09-15', '2024-12-15', 4, 60, NULL, true, NOW(), NOW()),
(1, 'Concept2 Rower Model E', 'Model E', 'Concept2', 'ROW-002', 'Cardio Zone B', 0, 5, '2024-09-20', '2024-12-20', 4, 60, NULL, true, NOW(), NOW()),

-- Stationary Bikes
(1, 'Peloton Bike+', 'BIKE-PLUS', 'Peloton', 'PEL-001', 'Cardio Zone C', 0, 5, '2024-10-05', '2025-01-05', 6, 45, NULL, true, NOW(), NOW()),
(1, 'Stationary Spin Bike', 'SB-500', 'Sunny Health', 'SB-001', 'Cardio Zone C', 0, 4, '2024-09-10', '2024-12-10', 4, 45, NULL, true, NOW(), NOW()),

-- Elliptical Machines
(1, 'Elliptical Cross Trainer', 'ECT-300', 'StairMaster', 'ECT-001', 'Cardio Zone D', 0, 5, '2024-10-10', '2025-01-10', 5, 60, NULL, true, NOW(), NOW()),
(1, 'Elliptical Pro', 'EP-600', 'Precor', 'EP-001', 'Cardio Zone D', 0, 5, '2024-09-25', '2024-12-25', 5, 60, NULL, true, NOW(), NOW()),

-- Strength Equipment (Barbells, Dumbbells, Machines)
(2, 'Squat Rack Elite', 'SR-500', 'IronMaster', 'SR-001', 'Strength Zone B', 0, 5, '2024-10-10', '2025-01-10', 8, 90, NULL, true, NOW(), NOW()),
(2, 'Power Rack', 'PR-800', 'Rogue', 'PR-001', 'Strength Zone B', 0, 5, '2024-10-15', '2025-01-15', 10, 120, NULL, true, NOW(), NOW()),
(2, 'Bench Press Station', 'BP-300', 'IronMaster', 'BP-001', 'Strength Zone B', 0, 5, '2024-10-10', '2025-01-10', 7, 90, NULL, true, NOW(), NOW()),
(2, 'Adjustable Weight Bench', 'AWB-200', 'PowerBlock', 'AWB-001', 'Strength Zone C', 0, 5, '2024-10-05', '2025-01-05', 5, 60, NULL, true, NOW(), NOW()),

-- Dumbbell Rack
(2, 'Dumbbell Set (2.5-50kg)', 'DB-SET', 'Ironglad', 'DB-001', 'Strength Zone A', 0, 5, '2024-10-20', '2025-01-20', 4, 120, NULL, true, NOW(), NOW()),
(2, 'Dumbbell Set (5-80kg)', 'DB-HEAVY', 'CAP', 'DB-002', 'Strength Zone A', 0, 5, '2024-10-20', '2025-01-20', 5, 120, NULL, true, NOW(), NOW()),

-- Barbell & Plates
(2, 'Olympic Barbell Set', 'OBS-300', 'Rogue', 'OBS-001', 'Strength Zone D', 0, 5, '2024-10-15', '2025-01-15', 10, 120, NULL, true, NOW(), NOW()),

-- Cable Machine
(2, 'Multi-Station Cable Machine', 'MSCM-500', 'Hoist', 'MSCM-001', 'Strength Zone C', 0, 5, '2024-09-30', '2024-12-30', 8, 90, NULL, true, NOW(), NOW()),
(2, 'Functional Trainer', 'FT-200', 'Ironmaster', 'FT-001', 'Strength Zone D', 0, 5, '2024-10-12', '2025-01-12', 7, 90, NULL, true, NOW(), NOW()),

-- Leg Press
(2, 'Leg Press Machine', 'LP-400', 'Hammer Strength', 'LP-001', 'Strength Zone E', 0, 5, '2024-10-08', '2025-01-08', 8, 90, NULL, true, NOW(), NOW()),

-- Smith Machine
(2, 'Smith Machine', 'SM-300', 'Cybex', 'SM-001', 'Strength Zone B', 0, 5, '2024-10-01', '2025-01-01', 7, 90, NULL, true, NOW(), NOW()),

-- Functional Training Equipment
(3, 'Assault Bike', 'AB-2024', 'Rogue', 'AB-001', 'Functional Zone C', 0, 5, '2024-09-20', '2024-12-20', 6, 45, NULL, true, NOW(), NOW()),
(3, 'TRX Suspension System', 'TRX-PRO', 'TRX Training', 'TRX-001', 'Functional Zone A', 0, 5, '2024-10-25', '2025-01-25', 3, 60, NULL, true, NOW(), NOW()),
(3, 'Kettlebell Set (4-48kg)', 'KB-SET', 'Rogue', 'KB-001', 'Functional Zone B', 0, 5, '2024-10-20', '2025-01-20', 4, 90, NULL, true, NOW(), NOW()),
(3, 'Medicine Balls', 'MB-SET', 'Dynamax', 'MB-001', 'Functional Zone B', 0, 5, '2024-10-15', '2025-01-15', 3, 60, NULL, true, NOW(), NOW()),
(3, 'Agility Ladder', 'AL-PRO', 'SKLZ', 'AL-001', 'Functional Zone D', 0, 5, '2024-10-10', '2025-01-10', 2, 30, NULL, true, NOW(), NOW()),
(3, 'Resistance Bands Set', 'RB-SET', 'Fit Simplify', 'RB-001', 'Functional Zone E', 0, 5, '2024-10-18', '2025-01-18', 2, 60, NULL, true, NOW(), NOW()),

-- Recovery Equipment
(4, 'Foam Roller', 'FR-200', 'TriggerPoint', 'FR-001', 'Recovery Zone', 0, 5, '2024-10-25', '2025-01-25', 2, 30, NULL, true, NOW(), NOW()),
(4, 'Massage Gun', 'MG-Pro', 'Theragun', 'MG-001', 'Recovery Zone', 0, 4, '2024-10-20', '2025-01-20', 1, 20, NULL, true, NOW(), NOW()),
(4, 'Yoga Mat Premium', 'YM-PRO', 'Manduka', 'YM-001', 'Recovery Zone', 0, 5, '2024-10-15', '2025-01-15', 1, 60, NULL, true, NOW(), NOW()),
(4, 'Stretching Station', 'SS-300', 'Body Solid', 'SS-001', 'Recovery Zone', 0, 5, '2024-10-10', '2025-01-10', 3, 45, NULL, true, NOW(), NOW()),

-- Olympic Equipment
(5, 'Olympic Platform', 'OP-500', 'Rogue', 'OP-001', 'Olympic Zone A', 0, 5, '2024-10-01', '2025-01-01', 12, 120, NULL, true, NOW(), NOW()),
(5, 'Bumper Plate Set (140kg)', 'BP-SET', 'Rogue', 'BP-001', 'Olympic Zone A', 0, 5, '2024-10-15', '2025-01-15', 15, 120, NULL, true, NOW(), NOW()),
(5, 'Competition Barbell', 'CB-500', 'Eleiko', 'CB-001', 'Olympic Zone B', 0, 5, '2024-10-20', '2025-01-20', 10, 120, NULL, true, NOW(), NOW());

-- ============================================================
-- 2. INSERT COMPREHENSIVE INBODY TEST DATA
-- ============================================================

-- User 1 (John Doe): Weight loss journey - 4 measurements showing progress
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass", "VisceralFatLevel", "BodyWaterPercentage", "BoneMass", "Bmr", "Notes", "CreatedAt") VALUES
(1, '2024-10-01', 91.5, 28.5, 58.2, 12, 54.5, 3.0, 1780, 'Starting measurement - baseline', NOW()),
(1, '2024-10-15', 89.2, 27.2, 58.5, 11, 55.2, 3.0, 1800, 'First progress check', NOW()),
(1, '2024-11-01', 85.5, 22.5, 62.8, 8, 58.2, 3.2, 1820, 'Showing great progress', NOW()),
(1, '2024-11-15', 83.2, 20.8, 63.1, 7, 59.1, 3.2, 1830, 'Excellent progress on fat loss', NOW()),
(1, '2024-11-29', 81.5, 19.5, 63.5, 6, 60.0, 3.2, 1840, 'Goal weight almost reached', NOW());

-- User 2 (Michael Smith): Muscle gain journey - building muscle and strength
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass", "VisceralFatLevel", "BodyWaterPercentage", "BoneMass", "Bmr", "Notes", "CreatedAt") VALUES
(2, '2024-09-01', 75.0, 14.2, 62.0, 4, 61.0, 3.3, 1880, 'Bulk start - baseline', NOW()),
(2, '2024-09-20', 76.5, 14.8, 63.2, 4, 61.2, 3.3, 1920, 'Adding weight steadily', NOW()),
(2, '2024-10-15', 78.5, 12.5, 66.2, 3, 62.5, 3.4, 1950, 'Great muscle gain with clean bulk', NOW()),
(2, '2024-11-01', 80.8, 13.2, 68.5, 3, 62.0, 3.4, 1980, 'Building well, muscle gain strong', NOW());

-- User 3 (David Wilson): Fitness maintenance
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass", "VisceralFatLevel", "BodyWaterPercentage", "BoneMass", "Bmr", "Notes", "CreatedAt") VALUES
(3, '2024-10-01', 72.0, 15.8, 60.5, 5, 60.8, 3.2, 1810, 'Maintenance baseline', NOW()),
(3, '2024-10-20', 71.8, 15.5, 60.7, 5, 61.0, 3.2, 1815, 'Stable weight, good energy', NOW()),
(3, '2024-11-10', 71.5, 15.2, 61.0, 4, 61.2, 3.2, 1820, 'Slight improvement in composition', NOW());

-- User 4 (Jessica Brown): Fat loss transformation
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass", "VisceralFatLevel", "BodyWaterPercentage", "BoneMass", "Bmr", "Notes", "CreatedAt") VALUES
(4, '2024-09-15', 94.0, 34.2, 55.8, 14, 52.0, 2.9, 1650, 'Heavy start - high visceral fat', NOW()),
(4, '2024-10-01', 91.5, 31.8, 56.5, 12, 53.5, 3.0, 1720, 'Good start to program', NOW()),
(4, '2024-10-20', 88.0, 28.5, 57.2, 10, 55.0, 3.0, 1760, 'Major progress on visceral fat', NOW()),
(4, '2024-11-10', 84.5, 25.2, 58.0, 8, 56.5, 3.1, 1800, 'Excellent results', NOW()),
(4, '2024-12-01', 82.0, 22.8, 59.5, 6, 58.0, 3.1, 1840, 'Almost at goal', NOW());

-- User 5 (Lisa Anderson): Athlete performance tracking
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass", "VisceralFatLevel", "BodyWaterPercentage", "BoneMass", "Bmr", "Notes", "CreatedAt") VALUES
(5, '2024-10-01', 68.5, 18.5, 55.8, 3, 60.5, 3.1, 1750, 'Athlete baseline - endurance focus', NOW()),
(5, '2024-11-01', 68.0, 17.8, 56.2, 2, 61.0, 3.1, 1770, 'Building lean muscle', NOW()),
(5, '2024-12-01', 68.5, 16.5, 57.0, 2, 61.5, 3.1, 1800, 'Peak performance condition', NOW());

-- User 6 (Amanda Garcia): Beginner fitness journey
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass", "VisceralFatLevel", "BodyWaterPercentage", "BoneMass", "Bmr", "Notes", "CreatedAt") VALUES
(6, '2024-10-15', 74.0, 26.5, 52.2, 8, 57.0, 2.8, 1620, 'Starting her fitness journey', NOW()),
(6, '2024-11-01', 72.5, 25.2, 52.8, 7, 57.8, 2.8, 1650, 'Good progress in first weeks', NOW()),
(6, '2024-11-20', 71.0, 23.8, 53.5, 6, 58.5, 2.9, 1680, 'Body composition improving', NOW());

-- ============================================================
-- VERIFY INSERTIONS
-- ============================================================

-- Show all equipment
SELECT 'Equipment Summary:' as info;
SELECT COUNT(*) as total_equipment FROM equipment;
SELECT ec."CategoryName", COUNT(e."EquipmentId") as count
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
GROUP BY ec."CategoryName";

-- Show InBody measurements summary
SELECT 'InBody Measurements Summary:' as info;
SELECT u."Name", COUNT(im."MeasurementId") as measurements_count, 
       ROUND(AVG(im."Weight"), 1) as avg_weight,
       ROUND(AVG(im."BodyFatPercentage"), 1) as avg_body_fat
FROM inbody_measurements im
JOIN "User" u ON im."UserId" = u."UserId"
GROUP BY u."UserId", u."Name"
ORDER BY u."UserId";

-- Show specific user progress (User 1)
SELECT 'User 1 (John Doe) Progress:' as info;
SELECT "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass",
       LAG("Weight") OVER (ORDER BY "MeasurementDate") as prev_weight,
       ROUND("Weight" - LAG("Weight") OVER (ORDER BY "MeasurementDate"), 1) as weight_change
FROM inbody_measurements
WHERE "UserId" = 1
ORDER BY "MeasurementDate";
