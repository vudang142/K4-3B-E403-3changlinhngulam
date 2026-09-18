-- ==============================================================================
-- DATABASE SCHEMA: PresenceAI - Attendance Verification System
-- RDBMS: PostgreSQL 13+
-- Author: AI Engineering Team (VinUniversity PresenceAI Project)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS
-- Tự động cập nhật trường updated_at khi có UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLE: users
-- Lưu trữ thông tin tài khoản quản trị viên, Lab Coach và giảng viên
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Tuyệt đối không lưu plaintext (sử dụng bcrypt / argon2)
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'coach' CHECK (role IN ('admin', 'coach', 'student')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLE: students
-- Lưu trữ hồ sơ học viên tham gia các khóa học
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    student_code VARCHAR(50) UNIQUE NOT NULL, -- Mã học viên duy nhất (VD: 'CS21B041')
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    enrolled_device_id VARCHAR(255) NULL, -- Device fingerprint tin cậy đã đăng ký
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLE: classes
-- Lưu trữ thông tin lớp học, môn học và tọa độ phòng học thực tế
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_code VARCHAR(50) UNIQUE NOT NULL, -- Mã lớp duy nhất (VD: 'CS-401')
    class_name VARCHAR(150) NOT NULL,
    room VARCHAR(100) NOT NULL, -- Tên/Số phòng (VD: 'Lab Block C · Room 214')
    latitude DECIMAL(10, 8) NOT NULL, -- Vĩ độ phòng học (chuẩn WGS84)
    longitude DECIMAL(11, 8) NOT NULL, -- Kinh độ phòng học (chuẩn WGS84)
    geofence_radius_meters INT NOT NULL DEFAULT 50 CHECK (geofence_radius_meters > 0), -- Bán kính hợp lệ (mặc định 50m)
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLE: class_students
-- Bảng trung gian quản lý danh sách học viên ghi danh vào từng lớp học
CREATE TABLE IF NOT EXISTS class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_student UNIQUE (class_id, student_id)
);

-- 7. TABLE: attendance_sessions
-- Lưu trữ thông tin từng phiên điểm danh và cơ chế Dynamic QR xoay vòng
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_name VARCHAR(150) NOT NULL, -- Tên buổi học (VD: 'Lab Session 1 - Distributed Systems Lab')
    qr_secret_key VARCHAR(255) NOT NULL, -- Khóa bí mật dùng để sinh Dynamic HMAC/TOTP QR
    current_qr_token VARCHAR(255) NULL, -- Mã token dynamic đang hiệu lực trong cửa sổ hiện tại
    qr_rotation_interval_seconds INT NOT NULL DEFAULT 45 CHECK (qr_rotation_interval_seconds >= 10), -- Chu kỳ xoay mã (VD: 45 giây)
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'CANCELLED')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABLE: attendance_records
-- Lưu trữ kết quả điểm danh của học viên trong buổi học và đánh giá của AI & Coach
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Kết quả đánh giá từ AI Verification Pipeline
    ai_verdict VARCHAR(20) NOT NULL CHECK (ai_verdict IN ('CONFIRMED', 'VERIFY', 'SUSPICIOUS')),
    ai_confidence INT NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    ai_reasoning TEXT NULL, -- Giải thích lý do từ AI (Spatial-temporal analysis)
    
    -- Trạng thái duyệt của Lab Coach
    coach_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (coach_status IN ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED')),
    coach_note TEXT NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ràng buộc chống điểm danh trùng: 1 học viên chỉ có tối đa 1 bản ghi trong 1 session
    CONSTRAINT uq_session_student UNIQUE (session_id, student_id)
);

-- 9. TABLE: attendance_evidence
-- Lưu trữ chi tiết tất cả bằng chứng thu thập được lúc quét mã (GPS, thời gian, thiết bị, QR)
CREATE TABLE IF NOT EXISTS attendance_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    
    -- Bằng chứng thời gian
    client_timestamp TIMESTAMPTZ NOT NULL,
    time_offset_seconds INT NULL, -- Chênh lệch thời gian giữa client và server (±s)
    
    -- Bằng chứng vị trí & Geofence
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    gps_accuracy DECIMAL(8, 2) NULL, -- Sai số GPS của thiết bị (mét)
    distance_to_room_meters DECIMAL(8, 2) NOT NULL, -- Khoảng cách tính toán tới tâm phòng học (mét)
    
    -- Bằng chứng mã QR
    qr_token_submitted VARCHAR(255) NOT NULL,
    qr_validity BOOLEAN NOT NULL DEFAULT false, -- Token có hợp lệ trong chu kỳ xoay vòng không
    
    -- Bằng chứng thiết bị & mạng
    device_fingerprint VARCHAR(255) NULL,
    device_matched BOOLEAN NOT NULL DEFAULT false, -- Thiết bị có khớp hồ sơ đã đăng ký không
    ip_address VARCHAR(45) NULL, -- Địa chỉ IP (hỗ trợ IPv4 & IPv6)
    user_agent TEXT NULL,
    raw_metadata JSONB NULL, -- Dữ liệu mở rộng tùy chọn
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. INDEXES (Tối ưu hóa hiệu năng truy vấn)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_records_ai_verdict ON attendance_records(ai_verdict);
CREATE INDEX IF NOT EXISTS idx_evidence_record_id ON attendance_evidence(record_id);

-- 11. TRIGGERS (Tự động cập nhật updated_at)
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_classes_updated_at ON classes;
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON attendance_sessions;
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON attendance_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_records_updated_at ON attendance_records;
CREATE TRIGGER trg_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
