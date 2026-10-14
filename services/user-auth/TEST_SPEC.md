# Test Specification — User/Auth (Gun)

## เป้าหมายและแหล่งข้อกำหนด

ตรวจ Auth ตาม `../../docs/test-specifications.md` และ `../../docs/api-contract.md` ของ PM: สมัครสำเร็จ, ปฏิเสธข้อมูลไม่ครบ/อีเมลซ้ำ, Login สำเร็จ/รหัสผ่านผิด และไม่ส่งรหัสผ่านกลับ ผลผิดต้องทำให้ `npm test` จบด้วย exit code ที่ไม่ใช่ 0 เพื่อหยุด CI

ใช้แนวทางจากบทเรียน Software Testing: วิเคราะห์ข้อกำหนด, แบ่งกรณีสำเร็จ/ผิดพลาด, ตรวจ boundary values, เตรียมสภาพแวดล้อม, รันทดสอบ, สรุปผล เลือก Node.js test runner เพราะติดมากับ Node 24 และใช้บน workflow ของทีมได้โดยไม่เพิ่ม Python/Browser ลง CI

## สภาพแวดล้อมและข้อมูล

- Node.js 24, dependencies จาก `package-lock.json`
- ข้อมูลสมมติ เช่น `Demo Student`, `ada@example.test`, `demo-password`; ไม่ใช้ข้อมูลนักศึกษาจริง
- API tests เปิด HTTP server บน localhost พอร์ตสุ่ม `0` ที่ระบบปฏิบัติการเลือก จึงไม่ชนพอร์ต 3000 ของแอปที่เปิดไว้
- แต่ละไฟล์ทดสอบมี process และ UserStore ของตน เตรียมบัญชีใน setup; ปิด server ใน teardown
- Gateway tests ใช้ source จริงของ Windsurf (`src/app.ts`, `src/config.ts`, `public/index.html`) คอมไพล์ชั่วคราวใน `tmp/` ภายใน Auth ด้วย TypeScript ของ Auth ใช้ Express ของ Auth ไม่ทำสำเนา proxy ขึ้นมาเอง และไม่แก้ source ของ Gateway
- การคอมไพล์ชั่วคราวเป็นการแปลง TypeScript สำหรับ integration ไม่ใช่การตรวจ type ของ Gateway; workflow/test ของ Windsurf ยังรับผิดชอบ build Gateway

## กรณีทดสอบขั้นต่ำจาก PM

1. **AUTH-REGISTER-001 — สมัครสำเร็จ**: ส่ง name/email/password ครบ คาดหวัง `201`, user มีเฉพาะ studentId/name/email, studentId สร้างโดย server และ store ไม่มี plaintext password
2. **AUTH-REGISTER-002 — อีเมลซ้ำ**: สมัครอีเมลเดิมทั้งตัวพิมพ์ต่างกัน/มีช่องว่าง คาดหวัง `409 EMAIL_EXISTS`; บัญชีเดิมไม่ถูกแทนที่
3. **AUTH-REGISTER-003 — ข้อมูลผิด**: ขาด field, field ผิด type, name ว่าง, email ผิดรูปแบบ, password สั้น/ยาว/ช่องว่างล้วน คาดหวัง `400 VALIDATION_ERROR`
4. **AUTH-LOGIN-001 — Login สำเร็จ**: บัญชีที่ Register แล้วส่งรหัสผ่านตรง คาดหวัง `200`, studentId เดิม และไม่มี password/passwordHash
5. **AUTH-LOGIN-002 — รหัสผ่านผิด**: ส่ง wrong-password คาดหวัง `401 INVALID_CREDENTIALS`, ไม่คืน user; บัญชีที่ไม่มีใช้ status/message เดียวกัน
6. **AUTH-LOGIN-003 — ข้อมูลไม่ครบ**: ขาด password คาดหวัง `400 VALIDATION_ERROR`; validation unit test ตรวจ email ที่ขาดด้วย

กรณีขั้นต่ำทั้งหมดมี automated tests ใน `tests/auth.integration.test.cjs`

## กรณีเพิ่มเพื่อหาข้อผิดพลาด

- **AUTH-UNIT-001**: normalize อีเมล, name/password boundary, non-object body และรักษาตัวพิมพ์/ช่องว่างรหัสผ่าน (`validation.unit.test.cjs`)
- **AUTH-UNIT-002**: hash แล้วตรวจกลับ, hash ต่างเมื่อรหัสผ่านเดียวกัน, salt สุ่ม, รหัสผ่านผิดถูกปฏิเสธ, hash เสียไม่ทำให้ crash (`password.unit.test.cjs`)
- **AUTH-UNIT-003**: ID ไม่ซ้ำ, ไม่ overwrite ผู้ใช้, object ที่คืนไม่แก้ store, public projection ไม่มี hash, store ใหม่ว่าง (`user-store.unit.test.cjs`)
- **AUTH-UNIT-004**: default port ตรง Compose, port นอกช่วงหรือรูปแบบผิดทำให้เริ่มแอปไม่ได้ (`config.unit.test.cjs`)
- **AUTH-API-001**: สมัครอีเมลเดียวกันพร้อมกัน 2 คำขอ คาดหวัง `201` หนึ่งครั้งและ `409` หนึ่งครั้ง แล้ว Login ด้วยบัญชีที่เหลือได้
- **AUTH-API-002**: JSON เสีย `400 INVALID_JSON`, body เกิน 16 KB `413`, Content-Type อื่น `415`, route ไม่มี `404`; error ไม่สะท้อน password จาก request
- **AUTH-API-003**: client ตั้ง studentId/passwordHash/role เองไม่ได้ และ Login response มี `Cache-Control: no-store`
- **AUTH-HEALTH-001**: HTTP health เป็น `200`, ระบุ `user-auth`, ไม่ส่ง header `X-Powered-By`
- **AUTH-GATEWAY-001**: หน้า Register/Login ของ PM โหลดได้ และ API สมัคร/Login ผ่าน Gateway จริงคืน status/body/studentId ตาม Auth
- **AUTH-GATEWAY-002**: Gateway ส่งต่อ `400`, `401`, `409`, header no-store ได้; Auth ติดต่อไม่ได้คืน `502 UPSTREAM_UNAVAILABLE`

## คำสั่งและเกณฑ์ผ่าน

รันจาก `services/user-auth/`:

```powershell
npm ci
npm run build
npm test
npm run test:unit
npm run test:integration
```

`npm test` ต้องผ่านทั้ง 51 tests: Unit 17 รายการ, Integration 34 รายการ (Auth API 26, health 1, Gateway 7) และไม่มี skipped/fail รัน `test:unit` หรือ `test:integration` เพื่อดูเฉพาะกลุ่มได้; ไม่จำเป็นต้องรันทั้งสามคำสั่งทุกครั้ง

CI กลางของ Sea รัน `npm install`, `npm run build`, `npm test`, `docker build` อยู่แล้ว tests เหล่านี้จึงอยู่บน pipeline โดยไม่ต้องแก้ workflow

การ push `gun` อย่างเดียวไม่ trigger CI เพราะ workflow จำกัด push บน main ต้องเปิด Pull Request จาก gun ไป main แล้วตรวจ job `verify`; job publish จะไม่ทำงานบน PR

## ขอบเขตผลที่พิสูจน์ได้

ผลชุดนี้พิสูจน์ Auth และการเชื่อม HTTP Gateway/Auth ไม่มีการจำลอง Auth ใน Gateway test ไม่ได้พิสูจน์ full system E2E ของ Course/Enrollment/Notification หรือการป้องกันสิทธิ์ของ API อื่น

การตรวจจาก browser จริงและ UAT เป็นขั้นต่อไปเมื่อทุกบริการพร้อม; Docker/CI execution evidence บันทึกใน `VERIFICATION.md` หลังตรวจจริง
