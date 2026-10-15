# Test Specifications (ฉบับเริ่มต้น)

แต่ละข้อเป็นเกณฑ์ทดสอบขั้นต่ำของ service เจ้าของ service เพิ่ม unit tests ในโค้ดของตน ส่วน Gun และ Yuri ช่วยเพิ่ม integration/end-to-end checks ตามบทบาท Tester

## Gateway / Web — Windsurf

1. `GET /health` ตอบ `200` และระบุ `gateway-web`
2. คำขอ `/api/courses?term=CS` ถูกส่งต่อพร้อม path/query และ response status/body จาก Course
3. เมื่อ service ปลายทางไม่พร้อม Gateway ตอบ `502` ด้วย error code `UPSTREAM_UNAVAILABLE`
4. หน้าเว็บโหลดได้และส่ง login/course/enrollment requests ผ่าน Gateway

## User / Auth — Gun

1. สมัครด้วยข้อมูลครบถ้วนสำเร็จและได้ผู้ใช้กลับมา
2. อีเมลซ้ำหรือข้อมูลจำเป็นไม่ครบถูกปฏิเสธด้วย `400` หรือ `409` ตาม contract
3. Login ด้วยรหัสผ่านถูกต้องสำเร็จ; รหัสผ่านผิดถูกปฏิเสธ และไม่ส่งรหัสผ่านกลับใน response

## Course — Sea

1. `GET /api/courses` ส่งรายการตัวอย่างตาม schema
2. `GET /api/courses/:courseId` ส่งรายละเอียดเมื่อพบและ `404` เมื่อไม่พบ
3. ข้อมูล response มี `courseId` และ `name` ครบ

## Enrollment — Yuri

1. ลงทะเบียนเมื่อ student/course มีอยู่แล้วสำเร็จ
2. ปฏิเสธ request ที่ขาด `studentId` หรือ `courseId`
3. ปฏิเสธ course ที่ไม่มี และการลงทะเบียนซ้ำด้วย status ที่ตกลงกัน
4. `GET /api/enrollments/:studentId` คืนเฉพาะรายการของนักศึกษาคนนั้น

## Notification — Safe

1. สร้าง/คืนข้อความยืนยันเมื่อ Enrollment แจ้งการลงทะเบียนสำเร็จ
2. `GET /api/notifications/:enrollmentId` คืน notification ที่ตรงกับ enrollment
3. enrollment ที่ไม่พบคืน `404`; ไม่ต้องส่งอีเมลหรือ SMS จริง

## Integration / เดโมรวม

- เปิดระบบด้วย Docker Compose แล้ว health check ผ่านทุกบริการ
- ทดสอบ flow สมัคร/เข้าสู่ระบบ → ดูรายวิชา → ลงทะเบียน → แสดงข้อความยืนยัน
- ทดสอบกรณี service ที่จำเป็นหยุดทำงานและยืนยันว่า Gateway แสดง error ที่อ่านเข้าใจได้
- ใช้ข้อมูลตัวอย่างเท่านั้น; ไม่เก็บข้อมูลนักศึกษาจริงหรือ secrets ใน test fixtures
