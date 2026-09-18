-- ==============================================================================
-- SEED DATA: PresenceAI Attendance System
-- Scenario: CS-401 Distributed Systems Lab at VinUniversity
-- ==============================================================================

-- 1. SEED USERS (Passwords hashed with bcrypt - plaintext: "Presence@2026")
-- Password hash: $2b$12$q6Kz0c5pZfB4yB9f8q5pvew7k2gE5yJz5t1hK4l3m8n7o6p5q4r3s (dummy bcrypt hash)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'dr.nguyen', 'coach@vinuni.edu.vn', '$2b$12$e868d4yLq1lqQ7X/xP3wE.h8uGzQj1f5Q2tJ8o1v7f9g5k8l0m2n3', 'Dr. Nguyen Van A', 'coach', true),
    ('a0000000-0000-0000-0000-000000000002', 'admin.sys', 'admin@vinuni.edu.vn', '$2b$12$u987b3zKq2lrR8Y/yQ4xF.i9vHzRk2g6R3uK9p2w8g0h6l9m1n3o4', 'System Administrator', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED CLASSES (VinUniversity Campus coordinates: 20.988015, 105.942120)
INSERT INTO classes (id, class_code, class_name, room, latitude, longitude, geofence_radius_meters, coach_id)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'CS-401', 'Distributed Systems Lab', 'Lab Block C · Room 214', 20.98801500, 105.94212000, 50, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (class_code) DO NOTHING;

-- 3. SEED STUDENTS (Matching UI mock records)
INSERT INTO students (id, student_code, full_name, email, enrolled_device_id)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'CS21B041', 'Priya Mehta', 'priya.m@vinuni.edu.vn', 'fp_ios_a1b2c3d4e5'),
    ('s0000000-0000-0000-0000-000000000002', 'CS21B017', 'James Okafor', 'james.o@vinuni.edu.vn', 'fp_and_f6g7h8i9j0'),
    ('s0000000-0000-0000-0000-000000000003', 'CS21B029', 'Aisha Tanaka', 'aisha.t@vinuni.edu.vn', 'fp_ios_k1l2m3n4o5'),
    ('s0000000-0000-0000-0000-000000000004', 'CS21B003', 'Marco Bianchi', 'marco.b@vinuni.edu.vn', 'fp_and_p6q7r8s9t0'),
    ('s0000000-0000-0000-0000-000000000005', 'CS21B057', 'Sofia Andersson', 'sofia.a@vinuni.edu.vn', 'fp_ios_u1v2w3x4y5'),
    ('s0000000-0000-0000-0000-000000000006', 'CS21B022', 'Lena Fischer', 'lena.f@vinuni.edu.vn', 'fp_and_z6a7b8c9d0'),
    ('s0000000-0000-0000-0000-000000000007', 'CS21B015', 'Carlos Ruiz', 'carlos.r@vinuni.edu.vn', 'fp_ios_e1f2g3h4i5'),
    ('s0000000-0000-0000-0000-000000000008', 'CS21B099', 'Anonymous Device', 'anonymous@vinuni.edu.vn', NULL)
ON CONFLICT (student_code) DO NOTHING;

-- 4. SEED CLASS_STUDENTS (Enroll students into CS-401)
INSERT INTO class_students (class_id, student_id)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001'),
    ('c0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002'),
    ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000003'),
    ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000004'),
    ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000005'),
    ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000006'),
    ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000007'),
    ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000008')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- 5. SEED ATTENDANCE_SESSIONS
INSERT INTO attendance_sessions (
    id, class_id, session_name, qr_secret_key, current_qr_token, 
    qr_rotation_interval_seconds, start_time, end_time, status, created_by
)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Lab 01: Distributed Consensus & Raft Protocol',
    'pa_sec_vinuni_cs401_k4_secret_key_889922',
    'dyn_token_window_45s_seed_10492',
    45,
    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
    CURRENT_TIMESTAMP + INTERVAL '60 minutes',
    'ACTIVE',
    'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED ATTENDANCE_RECORDS & ATTENDANCE_EVIDENCE (5 Records with 3 AI Verdict types)

-- Case 1: CONFIRMED - Priya Mehta (GPS 12m, Conf: 97%)
INSERT INTO attendance_records (
    id, session_id, student_id, check_in_time, 
    ai_verdict, ai_confidence, ai_reasoning, coach_status
)
VALUES (
    'r0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP - INTERVAL '25 minutes',
    'CONFIRMED',
    97,
    'GPS is 12m from classroom (well within 50m geofence), timestamp ±4s within active rotation window, device ID matches enrolled profile. High confidence of physical presence.',
    'APPROVED'
)
ON CONFLICT (session_id, student_id) DO NOTHING;

INSERT INTO attendance_evidence (
    record_id, client_timestamp, time_offset_seconds, 
    latitude, longitude, gps_accuracy, distance_to_room_meters, 
    qr_token_submitted, qr_validity, device_fingerprint, device_matched, ip_address
)
VALUES (
    'r0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP - INTERVAL '25 minutes',
    4,
    20.98809000, 105.94218000, 3.5, 12.00,
    'dyn_token_window_45s_seed_10492', true, 'fp_ios_a1b2c3d4e5', true, '10.20.44.12'
);

-- Case 2: CONFIRMED - James Okafor (GPS 8m, Conf: 94%)
INSERT INTO attendance_records (
    id, session_id, student_id, check_in_time, 
    ai_verdict, ai_confidence, ai_reasoning, coach_status
)
VALUES (
    'r0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP - INTERVAL '24 minutes',
    'CONFIRMED',
    94,
    'GPS distance 8m inside Room 214, valid rotation token, device fingerprint matches enrolled profile.',
    'APPROVED'
)
ON CONFLICT (session_id, student_id) DO NOTHING;

INSERT INTO attendance_evidence (
    record_id, client_timestamp, time_offset_seconds, 
    latitude, longitude, gps_accuracy, distance_to_room_meters, 
    qr_token_submitted, qr_validity, device_fingerprint, device_matched, ip_address
)
VALUES (
    'r0000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP - INTERVAL '24 minutes',
    2,
    20.98804000, 105.94215000, 2.8, 8.00,
    'dyn_token_window_45s_seed_10492', true, 'fp_and_f6g7h8i9j0', true, '10.20.44.18'
);

-- Case 3: CONFIRMED - Aisha Tanaka (GPS 5m, Conf: 99%)
INSERT INTO attendance_records (
    id, session_id, student_id, check_in_time, 
    ai_verdict, ai_confidence, ai_reasoning, coach_status
)
VALUES (
    'r0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000003',
    CURRENT_TIMESTAMP - INTERVAL '20 minutes',
    'CONFIRMED',
    99,
    'Perfect signal: GPS 5m, minimal offset ±1s, token fresh within 15s of generation, verified device.',
    'APPROVED'
)
ON CONFLICT (session_id, student_id) DO NOTHING;

INSERT INTO attendance_evidence (
    record_id, client_timestamp, time_offset_seconds, 
    latitude, longitude, gps_accuracy, distance_to_room_meters, 
    qr_token_submitted, qr_validity, device_fingerprint, device_matched, ip_address
)
VALUES (
    'r0000000-0000-0000-0000-000000000003',
    CURRENT_TIMESTAMP - INTERVAL '20 minutes',
    1,
    20.98802000, 105.94213000, 1.5, 5.00,
    'dyn_token_window_45s_seed_10492', true, 'fp_ios_k1l2m3n4o5', true, '10.20.44.33'
);

-- Case 4: VERIFY - Lena Fischer (GPS 48m, Conf: 61% - Near boundary)
INSERT INTO attendance_records (
    id, session_id, student_id, check_in_time, 
    ai_verdict, ai_confidence, ai_reasoning, coach_status
)
VALUES (
    'r0000000-0000-0000-0000-000000000004',
    'e0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000006',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes',
    'VERIFY',
    61,
    'GPS is 48m away, borderline close to 50m geofence radius. Device matched and token valid, but student might be outside the door or in hallway. Manual verification recommended.',
    'PENDING'
)
ON CONFLICT (session_id, student_id) DO NOTHING;

INSERT INTO attendance_evidence (
    record_id, client_timestamp, time_offset_seconds, 
    latitude, longitude, gps_accuracy, distance_to_room_meters, 
    qr_token_submitted, qr_validity, device_fingerprint, device_matched, ip_address
)
VALUES (
    'r0000000-0000-0000-0000-000000000004',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes',
    7,
    20.98835000, 105.94235000, 8.2, 48.00,
    'dyn_token_window_45s_seed_10492', true, 'fp_and_z6a7b8c9d0', true, '10.20.45.89'
);

-- Case 5: SUSPICIOUS - Carlos Ruiz (GPS 214m, Conf: 23% - Outside campus/dormitory)
INSERT INTO attendance_records (
    id, session_id, student_id, check_in_time, 
    ai_verdict, ai_confidence, ai_reasoning, coach_status
)
VALUES (
    'r0000000-0000-0000-0000-000000000005',
    'e0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000007',
    CURRENT_TIMESTAMP - INTERVAL '10 minutes',
    'SUSPICIOUS',
    23,
    'GPS distance is 214m (substantially exceeds 50m geofence). Token valid, which indicates QR code photo was forwarded/shared remotely via messaging app. High likelihood of proxy attendance.',
    'FLAGGED'
)
ON CONFLICT (session_id, student_id) DO NOTHING;

INSERT INTO attendance_evidence (
    record_id, client_timestamp, time_offset_seconds, 
    latitude, longitude, gps_accuracy, distance_to_room_meters, 
    qr_token_submitted, qr_validity, device_fingerprint, device_matched, ip_address
)
VALUES (
    'r0000000-0000-0000-0000-000000000005',
    CURRENT_TIMESTAMP - INTERVAL '10 minutes',
    18,
    20.98950000, 105.94320000, 15.0, 214.00,
    'dyn_token_window_45s_seed_10492', true, 'fp_ios_e1f2g3h4i5', true, '113.190.22.45'
);
