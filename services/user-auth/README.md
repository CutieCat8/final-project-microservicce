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

### Validation และความปลอดภัยของข้อมูล

- `name`: string หลัง trim ยาว 1–100 ตัวอักษร
- `email`: string รูปแบบอีเมล ยาวไม่เกิน 254 ตัวอักษร; trim และแปลงเป็นตัวพิมพ์เล็กก่อนค้นหา/บันทึก
- `password` สมัครบัญชี: string ไม่ใช่ช่องว่างล้วน ยาว 8–128 ตัวอักษร; ตอน login รับรหัสผ่านไม่ว่างถึง 128 ตัวอักษร แล้วตรวจว่าตรงหรือไม่
- ไม่ trim หรือแปลงตัวพิมพ์รหัสผ่าน; ช่องว่างที่ตั้งไว้เป็นส่วนของรหัสผ่าน
- เก็บเฉพาะ `passwordHash` จาก scrypt พร้อม salt สุ่ม 16 bytes และเปรียบเทียบด้วย `timingSafeEqual`; ไม่คืน password/hash/salt ใน HTTP response
- แต่ละบัญชีได้ `studentId` รูปแบบ `S` ตามด้วย UUID; ส่ง string นี้ให้ Enrollment ใช้ตาม contract ห้ามสมมติว่าเป็นเลขลำดับ `S001`
- คำขอใช้ `Content-Type: application/json`; ชนิดอื่นคืน `415`, JSON เสียคืน `400`, body เกิน 16 KB คืน `413`

ไม่มีบัญชีสำเร็จรูปใน source code ต้อง Register ก่อน Login ใช้เฉพาะอีเมล `.test` และข้อมูลสมมติในเดโม

### ตัวอย่างทดสอบด้วย PowerShell

```powershell
$account = @{ name = 'Demo Student'; email = 'ada@example.test'; password = 'demo-password' }
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/register' -ContentType 'application/json' -Body ($account | ConvertTo-Json)
$login = @{ email = 'ada@example.test'; password = 'demo-password' }
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/login' -ContentType 'application/json' -Body ($login | ConvertTo-Json)
```

ค่าข้างต้นเป็นข้อมูลทดสอบสาธารณะ ไม่ใช่รหัสผ่านบัญชีจริง

## ลำดับงาน

1. โครง TypeScript/Express และ health check
2. Register/Login, validation และ password hashing
3. Unit/API/Gateway integration tests และ Test Specification
4. Docker image, smoke test และ CI ผ่าน Pull Request
5. คู่มือมือใหม่ ผลตรวจ และรายละเอียดส่งต่อทีม

ทำทีละขั้น ตรวจแล้ว commit/push branch `gun` ตามคำขอ Gun

## บันทึกผลทีละขั้น

- ขั้น 1: build ผ่าน; health/port tests 3 รายการผ่าน; commit `a5cd736` push `gun` สำเร็จ
- ขั้น 2: เพิ่ม Register/Login, validation, hash และ duplicate protection; build ผ่าน; tests รวม 8 รายการผ่านก่อน commit
