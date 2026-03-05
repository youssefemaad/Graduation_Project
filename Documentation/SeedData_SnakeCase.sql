-- IntelliFit Database Complete Seed Data - Snake_case Schema
-- ==========================================
-- Test Account Credentials:
-- Member (ID 1): member@intellifit.com / password
-- Coach (ID 7): sarah.johnson@intellifit.com / password  
-- Receptionist (ID 10): reception@intellifit.com / password
-- Admin (ID 11): admin@intellifit.com / 224466
-- ==========================================
-- ==========================================
-- TRUNCATE ALL TABLES (proper FK order)
-- ==========================================
TRUNCATE TABLE workout_feedbacks,
user_strength_profiles,
workout_log_exercises,
workout_logs,
workout_plan_exercises,
workout_plans,
workout_template_exercises,
workout_templates,
muscle_development_scans,
inbody_measurements,
meal_ingredients,
meals,
nutrition_plans,
user_milestones,
progress_milestones,
coach_reviews,
bookings,
coach_session_equipments,
equipment_time_slots,
equipment,
equipment_categories,
activity_feeds,
notifications,
chat_messages,
ai_chat_logs,
ai_workflow_jobs,
ai_program_generations,
audit_logs,
token_transactions,
payments,
user_subscriptions,
subscription_plans,
token_packages,
exercises,
ingredients,
member_profiles,
coach_profiles,
users,
achievements,
user_achievements RESTART IDENTITY CASCADE;

-- ==========================================
-- 1. USERS (Base table)
-- ==========================================
INSERT INTO
    users (
        email,
        password_hash,
        name,
        phone,
        date_of_birth,
        gender,
        role,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        token_balance,
        is_active,
        email_verified,
        must_change_password,
        is_first_login,
        created_at,
        updated_at
    )
VALUES
    -- ID 1: Member
    (
        'member@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'John Doe',
        '+1234567890',
        '1995-05-15',
        0,
        'Member',
        '123 Main St, New York, NY',
        'Jane Doe',
        '+1234567800',
        50,
        true,
        true,
        false,
        false,
        NOW (),
        NOW ()
    ),
    -- ID 2-6: Additional Members
    (
        'michael.smith@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Michael Smith',
        '+1234567892',
        '1992-08-18',
        0,
        'Member',
        '789 Pine Rd, Queens, NY',
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
        '654 Maple Dr, Bronx, NY',
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
        '987 Cedar Ln, Staten Island, NY',
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
        '258 Spruce Way, White Plains, NY',
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
        '741 Ash Pl, New Rochelle, NY',
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
    -- ID 7: Coach (Sarah Johnson)
    (
        'sarah.johnson@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Sarah Johnson',
        '+1234567891',
        '1990-03-22',
        1,
        'Coach',
        '456 Oak Ave, Brooklyn, NY',
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
    -- ID 8-9: Additional Coaches
    (
        'emily.davis@intellifit.com',
        '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6',
        'Emily Davis',
        '+1234567893',
        '1988-11-30',
        1,
        'Coach',
        '321 Elm St, Manhattan, NY',
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
        '147 Birch St, Long Island, NY',
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
        '100 Gym Plaza, New York, NY',
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

-- ==========================================
-- 2. SUBSCRIPTION PLANS
-- ==========================================
INSERT INTO
    subscription_plans (
        plan_name,
        description,
        price,
        duration_days,
        tokens_included,
        features,
        max_bookings_per_day,
        is_popular,
        is_active,
        created_at,
        updated_at
    )
VALUES
    (
        'Basic Monthly',
        'Gym facilities and basic equipment',
        49.99,
        30,
        20,
        '["Gym Access", "Equipment Use"]',
        2,
        false,
        true,
        NOW (),
        NOW ()
    ),
    (
        'Standard Monthly',
        'Group classes & nutrition consultation',
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

-- ==========================================
-- 3. MEMBER PROFILES  
-- ==========================================
INSERT INTO
    member_profiles (
        user_id,
        fitness_goal,
        fitness_level,
        preferred_workout_time,
        subscription_plan_id,
        membership_start_date,
        membership_end_date,
        current_weight,
        target_weight,
        height,
        total_workouts_completed,
        total_calories_burned,
        achievements,
        created_at,
        updated_at
    )
VALUES
    (
        1,
        'Muscle Building',
        'Beginner',
        'Morning',
        2,
        '2024-11-01',
        '2024-12-01',
        85.5,
        90.0,
        175.0,
        5,
        1500,
        '["First Workout"]',
        NOW (),
        NOW ()
    ),
    (
        2,
        'Weight Loss',
        'Intermediate',
        'Evening',
        3,
        '2024-10-15',
        '2024-11-15',
        95.0,
        80.0,
        180.0,
        25,
        7500,
        '["Week Warrior"]',
        NOW (),
        NOW ()
    ),
    (
        3,
        'General Fitness',
        'Beginner',
        'Afternoon',
        1,
        '2024-11-10',
        '2024-12-10',
        70.0,
        70.0,
        170.0,
        3,
        900,
        '[]',
        NOW (),
        NOW ()
    );

-- ==========================================
-- 4. COACH PROFILES  
-- ==========================================
INSERT INTO
    coach_profiles (
        user_id,
        specialization,
        certifications,
        experience_years,
        bio,
        hourly_rate,
        rating,
        total_reviews,
        total_clients,
        availability_schedule,
        is_available,
        created_at,
        updated_at
    )
VALUES
    (
        7,
        'Strength Training',
        '{"NASM-CPT", "CSCS"}',
        5,
        'Certified trainer specializing in strength & conditioning',
        75.00,
        4.8,
        15,
        12,
        '{"Monday": ["9:00-17:00"], "Tuesday": ["9:00-17:00"]}',
        true,
        NOW (),
        NOW ()
    ),
    (
        8,
        'Powerlifting',
        '{"CSCS"}',
        8,
        'Former competitive powerlifter',
        95.00,
        4.9,
        22,
        18,
        '{"Monday": ["7:00-19:00"]}',
        true,
        NOW (),
        NOW ()
    ),
    (
        9,
        'CrossFit',
        '{"CrossFit L2"}',
        7,
        'CrossFit Level 2 trainer',
        85.00,
        4.7,
        18,
        15,
        '{"Monday": ["5:00-19:00"]}',
        true,
        NOW (),
        NOW ()
    );

-- ==========================================
-- 5. EXERCISES (Sample exercises for workouts)
-- ==========================================
INSERT INTO
    exercises (
        name,
        description,
        category,
        muscle_group,
        difficulty_level,
        instructions,
        is_active,
        created_by_coach_id,
        created_at,
        updated_at
    )
VALUES
    (
        'Barbell Squat',
        'Compound leg exercise',
        'Strength',
        'Legs',
        'Intermediate',
        'Stand with barbell, squat down keeping back straight',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Bench Press',
        'Upper body compound',
        'Strength',
        'Chest',
        'Intermediate',
        'Lie on bench, press barbell up',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Deadlift',
        'Full body compound',
        'Strength',
        'Back',
        'Advanced',
        'Lift barbell from ground to standing',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Pull-ups',
        'Bodyweight back exercise',
        'Strength',
        'Back',
        'Intermediate',
        'Hang from bar, pull body up',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Dumbbell Row',
        'Unilateral back exercise',
        'Strength',
        'Back',
        'Beginner',
        'Row dumbbell to hip, keep back straight',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Overhead Press',
        'Shoulder press movement',
        'Strength',
        'Shoulders',
        'Intermediate',
        'Press barbell overhead from shoulders',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Leg Press',
        'Machine leg exercise',
        'Strength',
        'Legs',
        'Beginner',
        'Push weight platform with legs',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Bicep Curl',
        'Isolation arm exercise',
        'Strength',
        'Arms',
        'Beginner',
        'Curl dumbbells to shoulder height',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Tricep Dip',
        'Bodyweight tricep exercise',
        'Strength',
        'Arms',
        'Intermediate',
        'Lower and raise body using arms',
        true,
        7,
        NOW (),
        NOW ()
    ),
    (
        'Lat Pulldown',
        'Back machine exercise',
        'Strength',
        'Back',
        'Beginner',
        'Pull bar down to chest level',
        true,
        7,
        NOW (),
        NOW ()
    );

-- ==========================================
-- 6. WORKOUT PLANS (AI-generated and manual)
-- ==========================================
INSERT INTO
    workout_plans (
        user_id,
        plan_name,
        description,
        plan_type,
        difficulty_level,
        duration_weeks,
        fitness_level,
        goal,
        days_per_week,
        status,
        is_active,
        created_at,
        updated_at
    )
VALUES
    (
        1,
        '4-Week Beginner Muscle Building',
        'AI-generated beginner muscle building program',
        'AI-Generated',
        'Beginner',
        4,
        'Beginner',
        'Muscle',
        4,
        'Active',
        true,
        NOW (),
        NOW ()
    ),
    (
        2,
        'Advanced Strength Program',
        'Custom strength program by coach',
        'Custom',
        'Advanced',
        8,
        'Advanced',
        'Strength',
        5,
        'Active',
        true,
        NOW (),
        NOW ()
    );

-- ==========================================
-- 7. WORKOUT PLAN EXERCISES  
-- ==========================================
INSERT INTO
    workout_plan_exercises (
        workout_plan_id,
        exercise_id,
        day_number,
        order_in_day,
        sets,
        reps,
        rest_seconds,
        notes
    )
VALUES
    -- Plan 1 - Day 1
    (1, 1, 1, 1, 3, 10, 90, 'Focus on form'),
    (1, 2, 1, 2, 3, 8, 120, 'Full range of motion'),
    (1, 6, 1, 3, 3, 8, 90, 'Control the weight'),
    -- Plan 1 - Day 2
    (1, 3, 2, 1, 3, 5, 180, 'Use proper form'),
    (1, 4, 2, 2, 3, 8, 90, 'Control the descent'),
    (1, 5, 2, 3, 3, 10, 60, 'Squeeze at the top'),
    -- Plan 1 - Day 3
    (1, 7, 3, 1, 3, 12, 90, 'Full leg extension'),
    (1, 8, 3, 2, 3, 12, 60, 'Slow and controlled'),
    (1, 9, 3, 3, 3, 10, 90, 'Keep elbows tucked'),
    -- Plan 1 - Day 4
    (1, 10, 4, 1, 3, 10, 75, 'Pull to chest'),
    (
        1,
        2,
        4,
        2,
        3,
        8,
        120,
        'Chest out, shoulders back'
    ),
    (1, 6, 4, 3, 3, 8, 90, 'Strict form');

-- ==========================================
-- 8. EQUIPMENT CATEGORIES
-- ==========================================
INSERT INTO
    equipment_categories (category_name, description)
VALUES
    ('Cardio', 'Cardiovascular equipment'),
    ('Strength', 'Strength training equipment'),
    ('Free Weights', 'Barbells, dumbbells, plates');

-- ==========================================
-- 9. EQUIPMENT
-- ==========================================
INSERT INTO
    equipment (
        equipment_name,
        category_id,
        quantity,
        status,
        maintenance_schedule
    )
VALUES
    ('Treadmill', 1, 10, 'Available', 'Monthly'),
    ('Stationary Bike', 1, 8, 'Available', 'Monthly'),
    ('Squat Rack', 2, 4, 'Available', 'Quarterly'),
    (
        'Bench Press Station',
        2,
        5,
        'Available',
        'Quarterly'
    ),
    ('Dumbbell Set', 3, 20, 'Available', 'Annual');

-- ==========================================
-- 10. BOOKINGS (Coach sessions)
-- ==========================================
INSERT INTO
    bookings (
        user_id,
        coach_id,
        booking_date,
        start_time,
        end_time,
        status,
        notes,
        tokens_spent,
        created_at,
        updated_at
    )
VALUES
    (
        1,
        7,
        '2024-12-15',
        '10:00:00',
        '11:00:00',
        'Confirmed',
        'First training session',
        10,
        NOW (),
        NOW ()
    ),
    (
        2,
        8,
        '2024-12-16',
        '14:00:00',
        '15:00:00',
        'Confirmed',
        'Powerlifting technique',
        15,
        NOW (),
        NOW ()
    );

-- ==========================================
-- 11. COACH REVIEWS
-- ==========================================
INSERT INTO
    coach_reviews (
        coach_id,
        user_id,
        rating,
        comment,
        created_at,
        updated_at
    )
VALUES
    (
        7,
        1,
        5,
        'Excellent coach, very knowledgeable!',
        NOW (),
        NOW ()
    ),
    (
        8,
        2,
        5,
        'Great powerlifting instruction',
        NOW (),
        NOW ()
    );

-- ==========================================
-- 12. INBODY MEASUREMENTS  
-- ==========================================
INSERT INTO
    inbody_measurements (
        user_id,
        weight,
        muscle_mass,
        body_fat_percentage,
        body_fat_mass,
        bmi,
        created_at
    )
VALUES
    (
        1,
        85.5,
        35.2,
        18.5,
        15.8,
        27.9,
        NOW () - INTERVAL '7 days'
    ),
    (1, 84.8, 35.8, 17.8, 15.1, 27.6, NOW ()),
    (2, 95.0, 42.5, 22.0, 20.9, 29.3, NOW ());

-- ==========================================
-- 13. MUSCLE DEVELOPMENT SCANS
-- ==========================================
INSERT INTO
    muscle_development_scans (
        user_id,
        underdeveloped_muscles,
        well_developed_muscles,
        scan_date,
        notes
    )
VALUES
    (
        1,
        '{"Shoulders", "Calves"}',
        '{"Chest", "Biceps"}',
        NOW (),
        'Need more shoulder work'
    );

-- ==========================================
-- 14. USER STRENGTH PROFILES (AI-learned)
-- ==========================================
INSERT INTO
    user_strength_profiles (
        user_id,
        exercise_id,
        exercise_name,
        one_rep_max,
        confidence_score,
        last_updated
    )
VALUES
    (1, 1, 'Barbell Squat', 100.0, 0.85, NOW ()),
    (1, 2, 'Bench Press', 80.0, 0.90, NOW ());

-- ==========================================
-- 15. WORKOUT LOGS
-- ==========================================
INSERT INTO
    workout_logs (
        user_id,
        workout_plan_id,
        workout_date,
        duration_minutes,
        calories_burned,
        notes,
        rating,
        created_at
    )
VALUES
    (
        1,
        1,
        NOW () - INTERVAL '2 days',
        60,
        450,
        'Great workout!',
        5,
        NOW () - INTERVAL '2 days'
    ),
    (
        1,
        1,
        NOW () - INTERVAL '1 day',
        55,
        420,
        'Felt strong',
        4,
        NOW () - INTERVAL '1 day'
    );

-- ==========================================
-- 16. WORKOUT LOG EXERCISES
-- ==========================================
INSERT INTO
    workout_log_exercises (
        workout_log_id,
        exercise_id,
        exercise_name,
        sets_completed,
        reps_completed,
        weight_used,
        notes
    )
VALUES
    (1, 1, 'Barbell Squat', 3, 10, 95.0, 'Good depth'),
    (
        1,
        2,
        'Bench Press',
        3,
        8,
        75.0,
        'Controlled reps'
    );

-- ==========================================
-- 17. NOTIFICATIONS
-- ==========================================
INSERT INTO
    notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    )
VALUES
    (
        1,
        'Workout Reminder',
        'Your workout is scheduled for today at 10 AM',
        'Reminder',
        false,
        NOW ()
    ),
    (
        1,
        'New AI Plan',
        'Your AI workout plan is ready!',
        'Info',
        true,
        NOW () - INTERVAL '1 day'
    );

-- ==========================================
-- 18. ACTIVITY FEEDS
-- ==========================================
INSERT INTO
    activity_feeds (
        user_id,
        activity_type,
        description,
        related_entity_id,
        created_at
    )
VALUES
    (
        1,
        'workout_completed',
        'Completed Day 1 of Beginner Muscle Building',
        1,
        NOW () - INTERVAL '2 days'
    ),
    (
        1,
        'booking_created',
        'Booked session with Sarah Johnson',
        1,
        NOW () - INTERVAL '5 days'
    );

-- ==========================================
-- 19. PROGRESS MILESTONES
-- ==========================================
INSERT INTO
    progress_milestones (
        name,
        description,
        category,
        criteria,
        icon_url,
        is_active
    )
VALUES
    (
        'First Workout',
        'Complete your first workout',
        'Workout',
        '{"workouts_completed": 1}',
        NULL,
        true
    ),
    (
        'Week Warrior',
        'Complete 7 workouts',
        'Workout',
        '{"workouts_completed": 7}',
        NULL,
        true
    ),
    (
        'Consistency King',
        'Complete 30 workouts',
        'Workout',
        '{"workouts_completed": 30}',
        NULL,
        true
    );

-- ==========================================
-- 20. USER MILESTONES
-- ==========================================
INSERT INTO
    user_milestones (
        user_id,
        milestone_id,
        progress,
        is_completed,
        completed_at
    )
VALUES
    (1, 1, 5, true, NOW () - INTERVAL '5 days'),
    (1, 2, 5, false, NULL);

-- ==========================================
-- 21. TOKEN PACKAGES
-- ==========================================
INSERT INTO
    token_packages (
        package_name,
        token_amount,
        price,
        bonus_tokens,
        description,
        is_active
    )
VALUES
    (
        'Starter Pack',
        50,
        9.99,
        0,
        'Perfect for trying AI features',
        true
    ),
    (
        'Pro Pack',
        200,
        29.99,
        20,
        'Best value for regular users',
        true
    ),
    (
        'Ultimate Pack',
        500,
        59.99,
        100,
        'Power user package',
        true
    );

-- ==========================================
-- 22. TOKEN TRANSACTIONS
-- ==========================================
INSERT INTO
    token_transactions (
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        related_entity_id,
        created_at
    )
VALUES
    (
        1,
        'Purchase',
        50,
        0,
        50,
        'Purchased Starter Pack',
        NULL,
        NOW () - INTERVAL '10 days'
    ),
    (
        1,
        'Spend',
        -10,
        50,
        40,
        'AI Workout Plan Generation',
        1,
        NOW () - INTERVAL '7 days'
    );

-- ==========================================
-- 23. AUDIT LOGS
-- ==========================================
INSERT INTO
    audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        changes,
        ip_address,
        user_agent,
        created_at
    )
VALUES
    (
        11,
        'Create',
        'User',
        1,
        '{"action": "User created"}',
        '127.0.0.1',
        'Admin Panel',
        NOW () - INTERVAL '30 days'
    ),
    (
        7,
        'Update',
        'WorkoutPlan',
        1,
        '{"status": "Active"}',
        '192.168.1.1',
        'Chrome Browser',
        NOW () - INTERVAL '7 days'
    );

-- ==========================================
-- 24. AI PROGRAM GENERATIONS
-- ==========================================
INSERT INTO
    ai_program_generations (
        user_id,
        program_type,
        workout_plan_id,
        request_parameters,
        generated_output,
        model_version,
        tokens_used,
        is_successful,
        error_message,
        created_at
    )
VALUES
    (
        1,
        'WorkoutPlan',
        1,
        '{"fitness_level": "Beginner", "goal": "Muscle", "days_per_week": 4}',
        '{"plan_name": "4-Week Beginner Muscle Building"}',
        'v3.0.0-direct',
        10,
        true,
        NULL,
        NOW () - INTERVAL '7 days'
    );

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
SELECT
    'Database seeded successfully! Test users ready:' AS status;

SELECT
    'Member ID 1: member@intellifit.com' AS info
UNION ALL
SELECT
    'Coach ID 7: sarah.johnson@intellifit.com'
UNION ALL
SELECT
    'Receptionist ID 10: reception@intellifit.com'
UNION ALL
SELECT
    'Admin ID 11: admin@intellifit.com';