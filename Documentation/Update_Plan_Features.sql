-- ==========================================
-- UPDATE PLAN FEATURES
-- Replace "Gym Access" with "Equipment Booking" terminology
-- Plan Tiers:
--   Basic:    Equipment Booking only (with tokens)
--   Standard: Equipment Booking + AI features
--   Premium:  Equipment Booking + AI + Coach Booking + Coach Plan Review
-- ==========================================
-- Basic Monthly
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "Locker Room"]',
    "Description" = 'Book gym equipment with tokens',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Basic Monthly';

-- Standard Monthly
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator"]',
    "Description" = 'Equipment booking plus AI-powered workout and coaching features',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Standard Monthly';

-- Premium Monthly
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review"]',
    "Description" = 'Full access: equipment booking, AI features, personal coach booking and plan reviews',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Premium Monthly';

-- Basic Quarterly
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "Locker Room"]',
    "Description" = '3-month basic membership - book equipment with tokens',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Basic Quarterly';

-- Standard Quarterly
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Progress Tracking"]',
    "Description" = '3-month membership with equipment booking and AI features',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Standard Quarterly';

-- Premium Quarterly
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review", "Priority Booking"]',
    "Description" = '3-month premium with equipment, AI, and personal coach',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Premium Quarterly';

-- Basic Annual
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "Locker Room", "Free Guest Pass"]',
    "Description" = 'Full year basic - book equipment with tokens and best value',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Basic Annual';

-- Standard Annual
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Progress Tracking", "Free Guest Pass"]',
    "Description" = 'Full year membership with equipment booking and AI features',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Standard Annual';

-- Premium Annual
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review", "Priority Booking", "Free Guest Pass"]',
    "Description" = 'Full year premium - equipment, AI, personal coach, all benefits',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Premium Annual';

-- Student Monthly
UPDATE "SubscriptionPlan"
SET
    "Features" = '["Equipment Booking", "Group Classes"]',
    "Description" = 'Student pricing - equipment booking and group classes',
    "UpdatedAt" = NOW ()
WHERE
    "PlanName" = 'Student Monthly';