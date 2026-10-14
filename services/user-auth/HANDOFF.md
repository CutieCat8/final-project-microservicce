# ส่งต่องาน User/Auth — Gun

เอกสารนี้เตรียมรายละเอียดให้ทีมอ่าน ยังไม่ได้ส่งข้อความหา Windsurf/Sea/Yuri/Safe และยังไม่ได้รับการยืนยัน contract จากสมาชิกแทน Gun

## Windsurf — Gateway / PM

- ใช้ API draft `docs/api-contract.md` ที่อยู่บน main (`c878eab`) โดยไม่เปลี่ยน field ของ Gateway
- URL ใน Compose: `AUTH_SERVICE_URL=http://user-auth:3000`
- `GET /health` ตอบ `200 { "status": "ok", "service": "user-auth" }`
- `POST /api/auth/register` รับ name/email/password; สำเร็จ `201 { "user": { "studentId": "S<UUID>", "name": "Demo Student", "email": "ada@example.test" } }`
- `POST /api/auth/login` รับ email/password; สำเร็จ `200` และ user รูปแบบเดียวกัน ไม่มี token ตามตัวเลือกใน draft
- ผิด validation `400 VALIDATION_ERROR`; email ซ้ำ `409 EMAIL_EXISTS`; Login ผิด `401 INVALID_CREDENTIALS`
- JSON เสีย `400 INVALID_JSON`; request เกิน 16 KB `413 PAYLOAD_TOO_LARGE`; Content-Type อื่น `415 UNSUPPORTED_MEDIA_TYPE`; route ไม่มี `404 ROUTE_NOT_FOUND`
- Error shape `{ "error": { "code": "...", "message": "..." } }`
- Gateway integration 7 tests ผ่านกับ source ของ PM: หน้าเว็บ, Register, Login/studentId, 400/401/409 และ 502 เมื่อ Auth ติดต่อไม่ได้
- ต้องยืนยันข้อจำกัดเดโมร่วมกัน: memory storage, ไม่มี token/authorization และ studentId เป็น string แบบ UUID

## Yuri — Enrollment

- ใช้ `user.studentId` ที่ Register/Login คืนมาเป็น `studentId` ใน request Enrollment; ห้ามใช้ email หรือ name แทน
- ID เป็น `S` ตามด้วย UUID 36 ตัวอักษร รวม 37 ตัวอักษร ให้เก็บเป็น string ไม่ parse เป็นเลขหรือบังคับความยาว 4 ตัวตามตัวอย่าง S001
- ผู้ใช้สองบัญชีมี ID ต่างกัน; Login หลายครั้งของบัญชีเดิมได้ ID เดิมตราบที่ Auth process ยังอยู่
- Auth restart แล้วบัญชีหาย; Register ใหม่ได้ ID ใหม่ ต้องเตรียมข้อมูลเดโมใหม่ให้สอดคล้องกับ Enrollment
- Login นี้ยังไม่ได้ทำให้ Enrollment ป้องกันผู้ที่รู้ studentId ได้; เป็นขอบเขตเดโมตามแผนทีม

## Sea — CI

- working directory: `services/user-auth`
- Node.js major: `24`
- dependencies: มี package-lock.json; clean install ใช้ `npm ci --no-audit --no-fund`
- build: `npm run build`
- test: `npm test` รวม Unit 17 และ Integration 34 = 51 tests; ไม่มีบริการภายนอก/DB ที่ต้องเปิดเพิ่ม
- tests ใช้ source ของ Gateway จาก checkout เดียวกัน จึงต้อง checkout monorepo ทั้งชุดตาม workflow ปัจจุบัน
- Docker build: `docker build -t registration-auth:ci .`
- optional Docker runtime smoke: `npm run test:docker` เมื่อ runner มี Docker engine; คำสั่งจะสร้างและลบ container ทดสอบของตัวเอง
- source/tests/Dockerfile ทั้งหมดอยู่ใน service; ไม่แก้ `.github/workflows/ci-user-auth.yml`

## Safe — Release

- build context: `./services/user-auth`
- image repository: `<DOCKERHUB_USERNAME>/registration-auth`
- version package: `0.1.0`; version image ให้ใช้ release tag ของทีม เช่น `v0.1.0`
- runtime container port: `3000`; environment `PORT` ค่าเริ่มต้น 3000; `NODE_ENV=production` ใน image
- HEALTHCHECK มีอยู่ใน image; process รันด้วยผู้ใช้ node; runtime ไม่ติดตั้ง TypeScript/tests
- ไม่มี Docker Hub token, password จริง หรือ .env ใน service; release ใช้ repository secrets ของทีม
- image พร้อมให้ workflow build แต่การ publish ต้องตรวจ CI และกำหนด release/secrets โดยเจ้าของงานกลาง

## ตัวอย่างส่งผ่าน Gateway

Gateway ของ PM เปิดที่ `http://localhost:8080` เมื่อบริการที่ต้องใช้พร้อม:

```json
{
  "name": "Demo Student",
  "email": "ada@example.test",
  "password": "demo-password"
}
```

ส่ง JSON ข้างต้นด้วย `POST /api/auth/register` แล้วส่ง:

```json
{
  "email": "ada@example.test",
  "password": "demo-password"
}
```

ด้วย `POST /api/auth/login` ผลสำเร็จมี user object เท่านั้น ต้องอ่าน studentId ที่ได้จริง อย่าคัดลอก `<UUID>` ไปใช้เป็น ID

ผลตรวจล่าสุดและข้อจำกัดอยู่ใน `VERIFICATION.md`; คำอธิบายมือใหม่อยู่ใน `BEGINNER_GUIDE.md`
