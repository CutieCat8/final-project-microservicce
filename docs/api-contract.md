# API Contract (ฉบับร่างสำหรับยืนยันร่วมกัน)

เอกสารนี้กำหนดรูปแบบขั้นต่ำเพื่อให้ Gateway และแต่ละ service เชื่อมต่อกันได้ ควรให้เจ้าของทุกบริการยืนยัน path, field และรหัสสถานะก่อนเริ่ม integration หากมีการเปลี่ยนแปลง ให้แก้เอกสารนี้และแจ้งผู้เกี่ยวข้องก่อนแก้โค้ด

## รูปแบบร่วม

- Request/response ใช้ JSON และ UTF-8
- สำเร็จใช้รหัส `2xx`; ข้อมูลไม่ถูกต้องใช้ `400`; ไม่พบข้อมูลใช้ `404`; ลงทะเบียนซ้ำใช้ `409`; service ปลายทางล่มให้ Gateway ส่ง `502`
- รูปแบบ error แนะนำ `{ "error": { "code": "...", "message": "..." } }`
- ทุก service มี `GET /health` และตอบ `{ "status": "ok", "service": "<service-name>" }`
- Gateway ส่งต่อ path, query string, `Authorization` และ JSON body ไปยัง service ที่เกี่ยวข้อง

## Endpoints

| Method | Path | เจ้าของ | Request หลัก | Response หลัก |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | User/Auth | `{ "name": "Ada", "email": "ada@example.test", "password": "demo-password" }` | `{ "user": { "studentId": "S001", "name": "Ada", "email": "ada@example.test" } }` |
| `POST` | `/api/auth/login` | User/Auth | `{ "email": "ada@example.test", "password": "demo-password" }` | `{ "user": { "studentId": "S001", "name": "Ada", "email": "ada@example.test" }, "token": "..." }` (token อาจละได้ถ้ากลุ่มไม่ทำ auth token) |
| `GET` | `/api/courses` | Course | — | `{ "courses": [{ "courseId": "CS101", "name": "Introduction to Computing", "description": "..." }] }` |
| `GET` | `/api/courses/:courseId` | Course | — | `{ "course": { "courseId": "CS101", "name": "Introduction to Computing", "description": "..." } }` |
| `POST` | `/api/enrollments` | Enrollment | `{ "studentId": "S001", "courseId": "CS101" }` | `{ "enrollment": { "enrollmentId": "E001", "studentId": "S001", "courseId": "CS101", "status": "confirmed" } }` |
| `GET` | `/api/enrollments/:studentId` | Enrollment | — | `{ "enrollments": [{ "enrollmentId": "E001", "studentId": "S001", "courseId": "CS101", "status": "confirmed" }] }` |
| `GET` | `/api/notifications/:enrollmentId` | Notification | — | `{ "notification": { "enrollmentId": "E001", "message": "ลงทะเบียนสำเร็จ", "createdAt": "..." } }` |
| `GET` | `/health` | ทุก service | — | `{ "status": "ok", "service": "..." }` |

## การเชื่อมต่อผ่าน Gateway

- Browser เรียก API ผ่าน origin เดียวกับหน้าเว็บ เช่น `http://localhost:8080/api/courses`
- Gateway ส่ง `/api/auth/*` ไป `AUTH_SERVICE_URL`, `/api/courses/*` ไป `COURSE_SERVICE_URL`, `/api/enrollments/*` ไป `ENROLLMENT_SERVICE_URL` และ `/api/notifications/*` ไป `NOTIFICATION_SERVICE_URL`
- ใน Docker Compose ใช้ชื่อ service เป็น hostname; ห้ามใช้ `localhost` สำหรับเรียก container อื่น
- Enrollment เรียก Notification หลังบันทึกการลงทะเบียนสำเร็จตาม contract ที่ Yuri และ Safe ตกลงกัน

> เป็น draft สำหรับทีมยืนยัน ไม่ได้กำหนดฐานข้อมูลหรือบังคับใช้ token จริงในเดโม
