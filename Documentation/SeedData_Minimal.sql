-- IntelliFit MINIMAL Seed Data for Testing
-- ==========================================
-- Test Account: Member (ID 1): member@intel lifit.com / password
-- ==========================================
-- TRUNCATE
TRUNCATE TABLE workout_plan_exercises,
workout_plans,
exercises,
member_profiles,
coach_profiles,
users,
subscription_plans RESTART IDENTITY CASCADE;

-- SUBSCRIPTION PLANS
INSERT INTO
    subscription_plans (
        "PlanName",
        "Description",
        "Price",
        "DurationDays",
        "TokensIncluded",
        "Features",
        "MaxBookingsPerDay",
        "IsPopular",
        "IsActive",
        "CreatedAt",
        "UpdatedAt"
    )
VALUES
    (
        'Basic Monthly',
        'Gym facilities and basic equipment',
        49.99,
        30,
        20,
        '["Gym Access"]',
        2,
        false,
        true,
        NOW (),
        NOW ()
    ),
    (
        'Standard Monthly',
        'Group classes & nutrition',
        79.99,
        30,
        50,
        '["Gym Access", "Group Classes"]',
        5,
        true,
        true,
        NOW (),
        NOW ()
    ),
    (
        'Premium Monthly',
        'Full access with personal training',
        129.99,
        30,
        100,
        '["Personal Training", "AI Generator"]',
        10,
        true,
        true,
        NOW (),
        NOW ()
    );

-- USERS
INSERT INTO
    users (
        "Email",
        "PasswordHash",
        "Name",
        "Phone",
        "DateOfBirth",
        "Gender",
        "Role",
        "Address",
        "EmergencyContactName",
        "EmergencyContactPhone",
        "TokenBalance",
        "IsActive",
        "EmailVerified",
        "MustChangePassword",
        "IsFirstLogin",
        "CreatedAt",
        "UpdatedAt"
    )
VALUES
    -- ID 1: Test Member
    (
        'member@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'John Doe',
        '+1234567890',
        '1995-05-15',
        0,
        'Member',
        '123 Main St, NY',
        'Jane Doe',
        '+1234567800',
        100,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    -- ID 2-6: Extra members  
    (
        'michael.smith@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Michael Smith',
        '+1234567892',
        '1992-08-18',
        0,
        'Member',
        '789 Pine Rd, NY',
        'Emma Smith',
        '+1234567802',
        75,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    (
        'david.wilson@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'David Wilson',
        '+1234567894',
        '1998-03-10',
        0,
        'Member',
        '654 Maple Dr, NY',
        'Lisa Wilson',
        '+1234567804',
        30,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    (
        'jessica.brown@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Jessica Brown',
        '+1234567895',
        '1996-11-05',
        1,
        'Member',
        '987 Cedar Ln, NY',
        'James Brown',
        '+1234567805',
        100,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    (
        'lisa.anderson@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Lisa Anderson',
        '+1234567897',
        '1994-07-18',
        1,
        'Member',
        '258 Spruce Way, NY',
        'John Anderson',
        '+1234567807',
        25,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    (
        'amanda.garcia@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Amanda Garcia',
        '+1234567899',
        '1997-12-08',
        1,
        'Member',
        '741 Ash Pl, NY',
        'Carlos Garcia',
        '+1234567809',
        60,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    -- ID 7: Coach
    (
        'sarah.johnson@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Sarah Johnson',
        '+1234567891',
        '1990-03-22',
        1,
        'Coach',
        '456 Oak Ave, NY',
        'Mike Johnson',
        '+1234567801',
        0,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    (
        'emily.davis@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Emily Davis',
        '+1234567893',
        '1988-11-30',
        1,
        'Coach',
        '321 Elm St, NY',
        'Tom Davis',
        '+1234567803',
        0,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    (
        'robert.taylor@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Robert Taylor',
        '+1234567896',
        '1985-07-14',
        0,
        'Coach',
        '147 Birch St, NY',
        'Mary Taylor',
        '+1234567806',
        0,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    -- ID 10: Receptionist
    (
        'reception@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Reception Staff',
        '+1234567898',
        '1993-06-20',
        1,
        'Receptionist',
        '100 Gym Plaza, NY',
        NULL,
        NULL,
        0,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    -- ID 11: Admin
    (
        'admin@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Admin User',
        '+1234567810',
        '1985-01-01',
        0,
        'Admin',
        'IntelliFit HQ, NY',
        NULL,
        NULL,
        100,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    );

-- MEMBER PROFILES
INSERT INTO
    member_profiles (
        "UserId",
        "FitnessGoal",
        "FitnessLevel",
        "PreferredWorkoutTime",
        "SubscriptionPlanId",
        "MembershipStartDate",
        "MembershipEndDate",
        "CurrentWeight",
        "TargetWeight",
        "Height",
        "TotalWorkoutsCompleted",
        "TotalCaloriesBurned",
        "Achievements",
        "CreatedAt",
        "UpdatedAt"
    )
VALUES
    (
        1,
        'Muscle Building',
        'Beginner',
        'Morning',
        3,
        '2024-11-01',
        '2025-01-01',
        85.5,
        90.0,
        175.0,
        0,
        0,
        '[]',
        NOW (),
        NOW ()
    );

-- COACH PROFILES
INSERT INTO
    coach_profiles (
        "UserId",
        "Specialization",
        "Certifications",
        "ExperienceYears",
        "Bio",
        "HourlyRate",
        "Rating",
        "TotalReviews",
        "TotalClients",
        "AvailabilitySchedule",
        "IsAvailable",
        "CreatedAt",
        "UpdatedAt"
    )
VALUES
    (
        7,
        'Strength Training',
        '{"NASM-CPT", "CSCS"}',
        5,
        'Certified strength coach',
        75.00,
        4.8,
        15,
        12,
        '{}',
        true,
        NOW (),
        NOW ()
    );

-- VERIFICATION
SELECT
    'Database seeded successfully!' AS status;

SELECT
    COUNT(*) AS user_count
FROM
    users;

SELECT
    *
FROM
    users
WHERE
    "UserId" = 1;

SELECT
    *
FROM
    member_profiles
WHERE
    "UserId" = 1;