# User / Auth Service — Gun

บริการสมัครบัญชีและเข้าสู่ระบบของเดโมลงทะเบียนเรียน ใช้ Node.js 24, TypeScript และ Express 5 ตาม stack ของ Gateway และ CI กลาง

## เริ่มพัฒนา

รันใน `services/user-auth/`:

```powershell
npm ci
npm run build
npm test
npm start
```

ทดสอบ `http://localhost:3000/health` จะได้ `{ "status": "ok", "service": "user-auth" }` ใช้ `npm run dev` เมื่อต้องการให้โปรแกรมโหลดใหม่หลังแก้ source code

ตั้ง `PORT` ได้ตั้งแต่ 1 ถึง 65535; ค่าเริ่มต้น 3000 ตรงกับ Docker Compose ตัวแปร `SERVICE_NAME` ใน Compose ไม่จำเป็น เพราะชื่อบริการคงที่คือ `user-auth`

## สัญญา API ที่ใช้

อ้างอิง `../../docs/api-contract.md` และ Gateway ที่อยู่บน `main` commit `c878eab`:

- `POST /api/auth/register`: รับ `name`, `email`, `password`; สำเร็จคืน `201` และ `{ user: { studentId, name, email } }`
- `POST /api/auth/login`: รับ `email`, `password`; สำเร็จคืน `200` และ `{ user: { studentId, name, email } }`
- `GET /health`: คืน `200` และชื่อบริการ
- ข้อมูลผิด `400`; อีเมลซ้ำ `409`; เข้าสู่ระบบไม่สำเร็จ `401`; error ใช้ `{ error: { code, message } }`

ใช้ข้อมูลในหน่วยความจำสำหรับเดโม ข้อมูลหายเมื่อ restart และแต่ละ instance มีข้อมูลของตัวเอง ไม่สร้าง token เพราะ contract อนุญาตให้ละได้; การ login ยืนยันข้อมูลบัญชีเท่านั้น ยังไม่ป้องกัน Course/Enrollment API

## ลำดับงาน

1. โครง TypeScript/Express และ health check
2. Register/Login, validation และ password hashing
3. Unit/API/Gateway integration tests และ Test Specification
4. Docker image, smoke test และ CI ผ่าน Pull Request
5. คู่มือมือใหม่ ผลตรวจ และรายละเอียดส่งต่อทีม

ทำทีละขั้น ตรวจแล้ว commit/push branch `gun` ตามคำขอ Gun
