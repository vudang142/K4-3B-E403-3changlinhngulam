# PresenceAI Database Documentation

Hệ thống cơ sở dữ liệu PostgreSQL 13+ phục vụ giải pháp **AI Presence Verification (AI Attendance)** — Xác minh sự hiện diện thực tế của học viên khi điểm danh qua Dynamic QR và đa tín hiệu không gian - thời gian.

---

## 1. Cấu trúc thư mục Deliverables

```
database/
├── schema.sql                     # Toàn bộ DDL khởi tạo schema, tables, indexes, triggers
├── migrations/
│   └── 001_initial_schema.sql     # File migration dạng Up / Down tương thích các migration tools
├── seed.sql                       # Dữ liệu mẫu (2 users, 1 class, 8 students, 1 session, 5 records & evidence)
├── generate_erd.py                # Script tự động vẽ sơ đồ ERD độ phân giải cao bằng Pillow
├── ERD.png                        # Ảnh sơ đồ quan hệ thực thể (Entity-Relationship Diagram)
└── README.md                      # Tài liệu thiết kế, Data Dictionary & Hướng dẫn kết nối
```

---

## 2. Sơ đồ Quan hệ Thực thể (ERD)

![ERD Diagram](ERD.png)

### Sơ đồ Mermaid (Markdown Preview):

```mermaid
erDiagram
    USERS ||--o{ CLASSES : "coaches"
    USERS ||--o{ STUDENTS : "linked user"
    USERS ||--o{ ATTENDANCE_SESSIONS : "created by"
    USERS ||--o{ ATTENDANCE_RECORDS : "reviewed by"
    CLASSES ||--|{ CLASS_STUDENTS : "enrolls"
    STUDENTS ||--|{ CLASS_STUDENTS : "enrolled in"
    CLASSES ||--o{ ATTENDANCE_SESSIONS : "holds"
    ATTENDANCE_SESSIONS ||--o{ ATTENDANCE_RECORDS : "contains"
    STUDENTS ||--o{ ATTENDANCE_RECORDS : "checks in"
    ATTENDANCE_RECORDS ||--|| ATTENDANCE_EVIDENCE : "has evidence"

    USERS {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    STUDENTS {
        uuid id PK
        uuid user_id FK
        varchar student_code UK
        varchar full_name
        varchar email UK
        varchar enrolled_device_id
        timestamptz created_at
        timestamptz updated_at
    }

    CLASSES {
        uuid id PK
        varchar class_code UK
        varchar class_name
        varchar room
        decimal latitude
        decimal longitude
        int geofence_radius_meters
        uuid coach_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    CLASS_STUDENTS {
        uuid id PK
        uuid class_id FK
        uuid student_id FK
        timestamptz joined_at
    }

    ATTENDANCE_SESSIONS {
        uuid id PK
        uuid class_id FK
        varchar session_name
        varchar qr_secret_key
        varchar current_qr_token
        int qr_rotation_interval_seconds
        timestamptz start_time
        timestamptz end_time
        varchar status
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    ATTENDANCE_RECORDS {
        uuid id PK
        uuid session_id FK
        uuid student_id FK
        timestamptz check_in_time
        varchar ai_verdict
        int ai_confidence
        text ai_reasoning
        varchar coach_status
        text coach_note
        uuid reviewed_by FK
        timestamptz reviewed_at
        timestamptz created_at
        timestamptz updated_at
    }

    ATTENDANCE_EVIDENCE {
        uuid id PK
        uuid record_id FK
        timestamptz client_timestamp
        int time_offset_seconds
        decimal latitude
        decimal longitude
        decimal gps_accuracy
        decimal distance_to_room_meters
        varchar qr_token_submitted
        boolean qr_validity
        varchar device_fingerprint
        boolean device_matched
        varchar ip_address
        text user_agent
        jsonb raw_metadata
        timestamptz created_at
    }
```

---

## 3. Data Dictionary (Từ điển dữ liệu)

### 3.1. Bảng `users`
Lưu trữ thông tin tài khoản người dùng, giảng viên, Lab Coach và Quản trị viên.
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Định danh người dùng |
| `username` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Tên đăng nhập |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` | Email liên hệ/tổ chức |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Mật khẩu băm (bcrypt/argon2) |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Họ và tên |
| `role` | `VARCHAR(20)` | `CHECK IN ('admin', 'coach', 'student')` | Vai trò trong hệ thống |
| `is_active` | `BOOLEAN` | `DEFAULT true`, `NOT NULL` | Trạng thái hoạt động |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm cập nhật |

### 3.2. Bảng `students`
Lưu thông tin học viên và hồ sơ thiết bị đáng tin cậy đã ghi danh.
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Định danh học viên |
| `user_id` | `UUID` | `REFERENCES users(id)`, `ON DELETE SET NULL` | Khóa ngoại tới user (tùy chọn) |
| `student_code`| `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Mã số sinh viên (VD: CS21B041) |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Tên sinh viên |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` | Email sinh viên |
| `enrolled_device_id`| `VARCHAR(255)`| `NULLABLE` | Fingerprint thiết bị chính chủ đã đăng ký |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm cập nhật |

### 3.3. Bảng `classes`
Lưu thông tin lớp học và vị trí địa lý của phòng học thực tế (Geofence).
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Định danh lớp học |
| `class_code` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Mã lớp (VD: CS-401) |
| `class_name` | `VARCHAR(150)`| `NOT NULL` | Tên môn học / lớp học |
| `room` | `VARCHAR(100)`| `NOT NULL` | Tên phòng học (VD: Lab Block C · Room 214) |
| `latitude` | `DECIMAL(10,8)`| `NOT NULL` | Vĩ độ tâm phòng học (WGS84) |
| `longitude`| `DECIMAL(11,8)`| `NOT NULL` | Kinh độ tâm phòng học (WGS84) |
| `geofence_radius_meters` | `INT` | `DEFAULT 50`, `CHECK > 0` | Bán kính hợp lệ (mét) |
| `coach_id` | `UUID` | `REFERENCES users(id)`, `ON DELETE SET NULL` | Giảng viên phụ trách lớp |

### 3.4. Bảng `class_students`
Bảng trung gian quản lý danh sách học viên theo từng lớp học (quan hệ N : N).
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Định danh ghi danh |
| `class_id` | `UUID` | `REFERENCES classes(id)`, `ON DELETE CASCADE` | Mã lớp |
| `student_id`| `UUID` | `REFERENCES students(id)`, `ON DELETE CASCADE` | Mã sinh viên |
| `joined_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Ngày vào lớp |
| *Constraint*| `UNIQUE(class_id, student_id)` | | Tránh ghi danh trùng lặp |

### 3.5. Bảng `attendance_sessions`
Lưu trữ phiên điểm danh và cấu hình Dynamic QR code bảo mật xoay vòng.
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Định danh buổi điểm danh |
| `class_id` | `UUID` | `REFERENCES classes(id)`, `ON DELETE CASCADE` | Thuộc lớp học nào |
| `session_name`| `VARCHAR(150)`| `NOT NULL` | Tên buổi học / Lab |
| `qr_secret_key`| `VARCHAR(255)`| `NOT NULL` | Secret key dùng ký HMAC / TOTP sinh QR |
| `current_qr_token`| `VARCHAR(255)`| `NULLABLE` | Token đang có hiệu lực trong chu kỳ 45s |
| `qr_rotation_interval_seconds`| `INT`| `DEFAULT 45`, `CHECK >= 10` | Chu kỳ đổi mã QR (giây) |
| `start_time`| `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Thời điểm mở điểm danh |
| `end_time` | `TIMESTAMPTZ` | `NULLABLE` | Thời điểm đóng điểm danh |
| `status` | `VARCHAR(20)` | `CHECK IN ('ACTIVE', 'CLOSED', 'CANCELLED')` | Trạng thái phiên |
| `created_by` | `UUID` | `REFERENCES users(id)` | Người khởi tạo phiên (Coach) |

### 3.6. Bảng `attendance_records`
Bản ghi điểm danh của học viên kèm kết quả đánh giá AI và quyết định duyệt của Coach.
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Định danh bản ghi điểm danh |
| `session_id`| `UUID` | `REFERENCES attendance_sessions(id)`, `CASCADE` | Phiên điểm danh |
| `student_id`| `UUID` | `REFERENCES students(id)`, `CASCADE` | Học viên điểm danh |
| `check_in_time`| `TIMESTAMPTZ`| `DEFAULT CURRENT_TIMESTAMP` | Thời điểm quét mã thành công |
| `ai_verdict`| `VARCHAR(20)` | `CHECK IN ('CONFIRMED', 'VERIFY', 'SUSPICIOUS')` | Đánh giá tổng hợp từ AI |
| `ai_confidence`| `INT` | `CHECK (0 <= val <= 100)` | Điểm tin cậy (0 - 100%) |
| `ai_reasoning`| `TEXT` | `NULLABLE` | Lập luận chi tiết của mô hình AI |
| `coach_status`| `VARCHAR(20)`| `CHECK IN ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED')` | Trạng thái phê duyệt của Coach |
| `coach_note`| `TEXT` | `NULLABLE` | Ghi chú của Lab Coach |
| `reviewed_by`| `UUID` | `REFERENCES users(id)` | Coach thực hiện duyệt |
| `reviewed_at`| `TIMESTAMPTZ`| `NULLABLE` | Thời điểm duyệt |
| *Constraint*| `UNIQUE(session_id, student_id)` | **Chống gian lận: 1 học viên chỉ điểm danh 1 lần / buổi** |

### 3.7. Bảng `attendance_evidence`
Lưu trữ đầy đủ các tín hiệu đa phương thức thu thập lúc quét mã.
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Định danh bằng chứng |
| `record_id` | `UUID` | `REFERENCES attendance_records(id)`, `CASCADE` | Thuộc bản ghi điểm danh nào (1:1) |
| `client_timestamp`| `TIMESTAMPTZ`| `NOT NULL` | Thời gian ghi nhận trên điện thoại học viên |
| `time_offset_seconds`| `INT` | `NULLABLE` | Độ lệch thời gian so với server (± giây) |
| `latitude` | `DECIMAL(10,8)`| `NULLABLE` | Tọa độ vĩ độ lúc quét |
| `longitude`| `DECIMAL(11,8)`| `NULLABLE` | Tọa độ kinh độ lúc quét |
| `gps_accuracy`| `DECIMAL(8,2)`| `NULLABLE` | Bán kính sai số GPS (mét) |
| `distance_to_room_meters`| `DECIMAL(8,2)`| `NOT NULL` | Khoảng cách tính tới phòng học (mét) |
| `qr_token_submitted`| `VARCHAR(255)`| `NOT NULL` | Token QR gửi lên |
| `qr_validity`| `BOOLEAN` | `DEFAULT false` | Hợp lệ trong cửa sổ 45s hay đã hết hạn |
| `device_fingerprint`| `VARCHAR(255)`| `NULLABLE` | Fingerprint phần cứng/trình duyệt |
| `device_matched`| `BOOLEAN` | `DEFAULT false` | Khớp với thiết bị đã đăng ký của học viên |
| `ip_address`| `VARCHAR(45)` | `NULLABLE` | Địa chỉ IP mạng (Wi-Fi trường / 4G) |
| `user_agent`| `TEXT` | `NULLABLE` | Chuỗi User-Agent của thiết bị |
| `raw_metadata`| `JSONB` | `NULLABLE` | Dữ liệu cảm biến mở rộng (Bluetooth RSSI, Wi-Fi BSSID) |

---

## 4. Hướng dẫn Khởi chạy & Kết nối Backend

### 4.1. Khởi động PostgreSQL qua Docker
```bash
docker run --name presenceai-postgres \
  -e POSTGRES_DB=presenceai_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### 4.2. Chạy Schema và Seed Data bằng `psql`
```bash
# 1. Khởi tạo Schema và Tables
psql -h localhost -U postgres -d presenceai_db -f database/schema.sql

# 2. Nạp Seed Data mẫu
psql -h localhost -U postgres -d presenceai_db -f database/seed.sql
```

### 4.3. Cấu hình chuỗi kết nối Backend (`.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/presenceai_db?schema=public"
```

### 4.4. Kiểm tra dữ liệu vừa tạo
```sql
-- Kiểm tra danh sách điểm danh và kết quả AI
SELECT 
    s.student_code,
    s.full_name,
    r.ai_verdict,
    r.ai_confidence,
    e.distance_to_room_meters AS gps_meters,
    r.coach_status
FROM attendance_records r
JOIN students s ON r.student_id = s.id
JOIN attendance_evidence e ON e.record_id = r.id;
```
