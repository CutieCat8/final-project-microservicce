# อธิบายงาน Gun สำหรับมือใหม่

## 1. งานของ Gun คืออะไร

ระบบกลุ่มเป็นเว็บไซต์ลงทะเบียนเรียน มี 5 บริการที่ทำคนละหน้าที่ Gun เป็น Tester และเป็นเจ้าของ User/Auth Service ด้วย จึงต้องเขียนบริการบัญชีผู้ใช้ ทดสอบบริการนี้ และตรวจว่าการนำไปเชื่อมกับ Gateway ทำงานได้ ไม่ใช่ทำแค่ test ของเพื่อน

การแบ่งงานจาก README คือ Windsurf ทำ Gateway/Web และ Compose, Gun ทำ User/Auth, Sea ทำ Course และ CI, Yuri ทำ Enrollment, Safe ทำ Notification และ release images ดังนั้นการเปลี่ยนแปลงใหม่ทั้งหมดของ Gun อยู่ใน `services/user-auth/` ไฟล์ส่วนกลางและบริการของเพื่อนยังใช้ตามเจ้าของเดิม

ก่อนเริ่ม branch gun ยังมีแต่โครงและรายการงาน จึงรับ commit ที่อยู่บน main ด้วย fast-forward เพื่อใช้ Gateway/API contract ล่าสุดที่ PM ทำไว้ ไม่ได้เขียน Gateway ใหม่หรือ commit งานแทนเพื่อน

## 2. Auth อยู่ตรงไหนในระบบ

เมื่อผู้ใช้กดสมัครบัญชีบนหน้าเว็บ JavaScript ส่ง HTTP request ไป Gateway Gateway อ่าน path `/api/auth/register` แล้วส่งต่อไป User/Auth Service Auth ตรวจข้อมูล สร้างผู้ใช้ และส่ง JSON กลับ Gateway ส่งผลนั้นต่อให้หน้าเว็บ

เมื่อกด Login เส้นทางเหมือนกัน แต่ใช้ `/api/auth/login` และส่งแค่ email/password Auth ตรวจว่าข้อมูลตรงกับบัญชีที่เคยสร้างหรือไม่ แล้วคืนข้อมูลผู้ใช้

Course ใช้สำหรับข้อมูลรายวิชา Enrollment ใช้ studentId ของผู้ใช้และ courseId ของวิชา Notification ใช้ข้อความยืนยันหลังลงทะเบียน ส่วน Auth ไม่ได้สร้างรายวิชาหรือบันทึกการลงทะเบียน

Gateway เป็นจุดรับคำขอจาก browser ทำให้หน้าเว็บไม่ต้องรู้ URL ของแต่ละ backend ใน Docker ชื่อ `user-auth` เป็น hostname ที่ container อื่นเรียกได้ `localhost` ภายใน Gateway หมายถึง Gateway container เอง จึงใช้ `http://user-auth:3000` เพื่อเรียก Auth

## 3. ไฟล์แต่ละตัวทำหน้าที่อะไร

- **package.json**: บอกชื่อบริการ เวอร์ชัน dependencies และคำสั่ง npm ของโปรเจกต์ `express` จำเป็นตอนรัน ส่วน TypeScript/types/tsx ใช้ตอนพัฒนาและ build
- **package-lock.json**: ล็อกเวอร์ชันย่อยและ integrity ของ dependencies ให้เครื่อง Gun กับ CI ติดตั้งชุดเดียวกัน `npm ci` ใช้ไฟล์นี้โดยตรง
- **tsconfig.json**: กำหนดให้ TypeScript ตรวจชนิดข้อมูลแบบ strict และ compile ไฟล์ `src/*.ts` เป็น JavaScript ใน `dist/`
- **src/index.ts**: จุดเริ่มแอป อ่าน PORT เปิด HTTP server บน `0.0.0.0` เพื่อรับคำขอใน container และปิด server เมื่อได้รับ SIGINT/SIGTERM
- **src/config.ts**: ตรวจ PORT ให้เป็นจำนวนเต็ม 1–65535 ถ้าไม่ได้ตั้งใช้ 3000 ถ้าตั้งผิดให้หยุดก่อนเปิด server เพื่อไม่รันผิดพอร์ตโดยเงียบ ๆ
- **src/app.ts**: สร้าง Express app อ่าน JSON กำหนด routes, health check, Content-Type และรูปแบบ error แยกจาก index เพื่อให้ test เปิด server ของตัวเองบนพอร์ตสุ่มได้
- **src/validation.ts**: ตรวจ input ก่อนสร้างบัญชีหรือ Login ทั้งข้อมูลขาด type ผิด และความยาว พร้อมปรับ email ให้ค้นหาเป็นรูปแบบเดียวกัน
- **src/password.ts**: แปลงรหัสผ่านเป็น hash ด้วย scrypt และตรวจรหัสผ่านที่ส่งมาตอน Login
- **src/user-store.ts**: เก็บผู้ใช้ใน Map สร้าง studentId ตรวจ email ซ้ำ และแปลงข้อมูลภายในให้เหลือเฉพาะข้อมูลที่เปิดเผยได้
- **src/auth-service.ts**: รวมขั้นตอนธุรกิจ Register/Login เรียก validation, store และ password functions โดยไม่ผูกกับ HTTP ทำให้แยกทดสอบได้
- **src/errors.ts**: class HttpError เก็บ status/code/message สำหรับส่ง error ที่คาดไว้ เช่น email ซ้ำหรือรหัสผ่านผิด
- **tests/**: automated Unit และ Integration Tests ตรวจผลด้วย assertions ถ้าผลไม่ตรงจะทำให้ npm test ล้มเหลว
- **Dockerfile**: สูตรสร้าง image ของ Auth ตั้งแต่ compile ไปจนถึงโปรแกรมที่พร้อมรัน
- **.dockerignore**: กัน node_modules, dist ของเครื่อง, .env, tests และไฟล์ที่ไม่จำเป็นออกจาก Docker build context
- **scripts/smoke.cjs**: ยิง HTTP ไป Auth ที่เปิดอยู่ ตรวจ 6 กรณีหลักโดยใช้บัญชีสมมติใหม่
- **scripts/docker-smoke.cjs**: build image เปิด container ชั่วคราว รอ healthy เรียก smoke แล้วลบ container ทดสอบของตัวเอง
- **TEST_SPEC.md**: บอกว่าทดสอบอะไร วิธีทดสอบ และผลที่ควรได้ เชื่อมกับข้อกำหนดของ PM
- **VERIFICATION.md**: บันทึกสิ่งที่ตรวจจริงและสิ่งที่ยังติดปัญหา แยกผล local/CI/Docker
- **HANDOFF.md**: รายละเอียดที่เพื่อนต้องใช้เชื่อม Gateway, Enrollment, CI และ release
- **gun_work.md**: checklist ของ Gun ข้อที่ยังต้องยืนยันหรือยังตรวจไม่ได้จะไม่ติ๊กว่าจบ

## 4. Register ทำงานอย่างไร

ตัวอย่าง HTTP request:

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Demo Student",
  "email": "ada@example.test",
  "password": "demo-password"
}
```

โปรแกรมตรวจ name ให้เป็นข้อความไม่ว่างหลัง trim และไม่เกิน 100 ตัวอักษร ตรวจ email ให้มีรูปแบบอีเมลและยาวไม่เกิน 254 ตัวอักษร ตรวจ password ให้เป็นข้อความไม่ใช่ช่องว่างล้วน ยาว 8–128 ตัวอักษร

email ถูก trim และแปลงเป็นตัวพิมพ์เล็ก ดังนั้น `ADA@EXAMPLE.TEST` และ `ada@example.test` เป็นบัญชีเดียวกัน name ถูก trim ส่วน password เก็บความหมายของตัวพิมพ์และช่องว่างเดิม ไม่แก้สิ่งที่ผู้ใช้ตั้ง

ถ้า email ยังไม่เคยใช้ โปรแกรมสร้าง passwordHash และ studentId เช่น `S` ตามด้วย UUID แล้วบันทึกเฉพาะ studentId/name/email/passwordHash ลง store ผลสำเร็จเป็น HTTP 201 เพราะเพิ่งสร้างข้อมูลใหม่

response มีรูปแบบ:

```json
{
  "user": {
    "studentId": "S0d3d43f3-667b-4d14-9523-c9b8accc6d1b",
    "name": "Demo Student",
    "email": "ada@example.test"
  }
}
```

ID ข้างต้นเป็นตัวอย่าง ต้องใช้ ID ที่ server ของตนคืนจริง server ไม่ยอมใช้ studentId หรือ passwordHash ที่ client แอบส่งมาแทนค่าที่สร้างเอง

ถ้า email ซ้ำคืน 409 พร้อม code EMAIL_EXISTS ถ้าข้อมูลผิดคืน 400 พร้อม code VALIDATION_ERROR การสมัคร email เดียวกันพร้อมกัน 2 คำขอจะสำเร็จเพียงคำขอเดียว อีกคำขอได้ 409 เพราะตรวจซ้ำอีกครั้งในขั้นบันทึกหลัง hash เสร็จ

## 5. Login ทำงานอย่างไร

ส่ง HTTP POST ไป `/api/auth/login`:

```json
{
  "email": "ada@example.test",
  "password": "demo-password"
}
```

โปรแกรมตรวจ input ค้นหาผู้ใช้จาก email แล้วใช้ salt ของ hash เดิมคำนวณ hash ของ password ที่ส่งมา ถ้าตรงคืน HTTP 200 พร้อม user ที่มี studentId เดิม ถ้าไม่ตรงหรือไม่มีบัญชีคืน 401 INVALID_CREDENTIALS ใช้ข้อความเดียวกันเพื่อไม่บอกว่าบัญชีใดมีอยู่

ข้อมูลไม่ครบเป็น 400 เพราะรูปแบบคำขอผิด ต่างจาก 401 ที่รูปแบบคำขอครบแต่ข้อมูลบัญชีไม่ตรง

ผล Login นี้ไม่มี token ตามตัวเลือกใน contract ของ PM จึงยืนยันได้ว่ารหัสผ่านถูกต้อง แต่ยังไม่ได้ทำระบบ session หรือป้องกันผู้ใช้จากการเรียก Enrollment โดยส่ง studentId เอง ต้องเข้าใจข้อจำกัดนี้เวลาอธิบายเดโม

## 6. Hash, salt และรหัสผ่าน

Hash คือค่าที่คำนวณจากรหัสผ่าน ใช้ตรวจความตรงกันโดยไม่เก็บรหัสผ่านเดิม ไม่ใช่การเข้ารหัสที่มีคำสั่งถอดกลับเป็น password

Salt คือค่าสุ่มที่เพิ่มเข้าไปก่อนคำนวณ hash ทำให้ผู้ใช้ที่ตั้งรหัสผ่านเดียวกันได้ hash ต่างกัน โปรแกรมใช้ salt สุ่มที่มี entropy 16 bytes ต่อบัญชี และ scrypt ของ Node.js เก็บเป็นข้อความ `scrypt$<salt>$<hash>` เฉพาะใน store

scrypt ถูกออกแบบให้ใช้ทั้งเวลาและหน่วยความจำในการคำนวณ จึงเหมาะกับรหัสผ่านมากกว่าการ hash ทั่วไปที่คำนวณเร็ว โปรแกรมใช้แบบ asynchronous เพื่อไม่คำนวณบน event loop โดยตรง และใช้ timingSafeEqual เปรียบเทียบค่า hash

Public response แยก field อย่างชัดเจน ไม่มี password/passwordHash/salt จึงไม่ทำให้ hash หลุดออก API แม้ store ภายในจะมีข้อมูลนั้น

## 7. HTTP status และ error ที่ใช้

- **200**: Login/health สำเร็จ
- **201**: สร้างบัญชีสำเร็จ
- **400**: ข้อมูลจำเป็นขาด/type ผิด หรือ JSON เสีย
- **401**: email/password ไม่ตรงกับบัญชี
- **404**: path ไม่มีใน Auth
- **409**: email ถูกใช้แล้ว
- **413**: body เกิน 16 KB
- **415**: Content-Type หรือ encoding ไม่รองรับ
- **500**: ปัญหาภายในที่ไม่ควรเกิดจากข้อมูลผิดทั่วไป โปรแกรมคืนข้อความทั่วไปไม่เปิดเผย stack/request
- **502**: Gateway ติดต่อ Auth ไม่ได้ เป็น response ที่ Gateway เป็นผู้สร้าง

ตัวอย่าง error:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect."
  }
}
```

Frontend อ่าน error.message ไปแสดงได้ และ tests ตรวจ error.code/status เพื่อให้ผลไม่ขึ้นกับถ้อยคำที่ใช้แสดงอย่างเดียว

## 8. Health check คืออะไร

`GET /health` ไม่ต้องสมัครบัญชีก่อน ตอบ `{ "status": "ok", "service": "user-auth" }` เพื่อให้ Docker/Compose รู้ว่า HTTP server รับคำขอได้

Health check นี้ไม่ได้ทดสอบ Register/Login ทั้งหมด จึงมี smoke test เพิ่มเพื่อพิสูจน์ว่าฟังก์ชันหลักทำงาน Health ผ่านอย่างเดียวไม่ได้แปลว่าระบบลงทะเบียนเรียนทั้งชุดพร้อมใช้งาน

## 9. เปิด Auth ในเครื่องทีละขั้น

เปิด PowerShell จาก root repo:

```powershell
Set-Location services/user-auth
npm ci
npm run build
npm test
npm start
```

`npm ci` ติดตั้ง dependencies ตาม lockfile `npm run build` ตรวจ TypeScript และสร้าง dist `npm test` build แล้วทดสอบ `npm start` รัน JavaScript ที่ compile แล้ว

ปล่อย terminal แรกเปิดอยู่ เปิด PowerShell อีกหน้าต่างใน `services/user-auth` แล้วตรวจ:

```powershell
Invoke-RestMethod 'http://localhost:3000/health'
$account = @{ name = 'Demo Student'; email = 'ada@example.test'; password = 'demo-password' }
$registered = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/register' -ContentType 'application/json' -Body ($account | ConvertTo-Json)
$registered.user
$login = @{ email = 'ada@example.test'; password = 'demo-password' }
$signedIn = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/login' -ContentType 'application/json' -Body ($login | ConvertTo-Json)
$signedIn.user
```

studentId ของ registered และ signedIn ต้องตรงกัน ถ้าสมัคร email เดิมอีกครั้งได้ 409 ถือว่าทำงานถูกต้อง ใช้ email ใหม่เมื่ออยากทดสอบสมัครอีกคน ถ้า Invoke-RestMethod พบ 4xx จะรายงาน error ใน terminal ซึ่งเป็นผลที่คาดไว้สำหรับกรณีข้อมูลผิด

ถ้าพอร์ต 3000 ถูกใช้ ให้ตั้ง PORT ก่อนเปิดโปรแกรม:

```powershell
$env:PORT = '3001'
npm start
```

แล้วเปลี่ยน URL ทดสอบเป็น localhost:3001 เมื่อต้องการหยุด กด Ctrl+C ใน terminal ที่เปิด server ใช้ `npm run dev` ตอนแก้โค้ดเพื่อให้โหลด source ใหม่อัตโนมัติ

## 10. Tests ต่างกันอย่างไร

**Unit Test** ตรวจส่วนย่อยโดยไม่เปิด HTTP เช่น validation ปฏิเสธ password สั้น, password ที่ hash ตรวจกลับได้, store ไม่ overwrite email ซ้ำ มี 17 รายการตามจำนวนที่รายงานโดย Node test runner บางรายการวนตรวจ input หลายชุด

**Auth API Integration Test** เปิด Express ผ่าน HTTP จริง ตรวจว่าร่วมกันตั้งแต่ route, validation, service, hash, store และ error response ทำงานถูกต้อง รวม 26 รายการ บวก health อีก 1 รายการ

**Gateway Integration Test** เปิด Gateway source ของ PM และ Auth ของ Gun เป็นสอง HTTP servers จริง ยิง request ผ่าน Gateway แล้วตรวจผล Auth ไม่ใช้ fake Auth หรือเขียน proxy จำลองใหม่ มี 7 รายการ

ทั้งหมดรวม 51 tests ถ้าข้อใดผิด assertion จะล้มเหลว Node คืน exit code ที่ไม่ใช่ 0 และ CI ต้องหยุด ไม่ใส่คำสั่งที่ทำให้ failure ถูกละเลย

`npm run test:unit` รันเฉพาะ Unit, `npm run test:integration` รันเฉพาะ HTTP/Gateway ไม่จำเป็นต้องรันซ้ำทั้งสามคำสั่งถ้า npm test ผ่านแล้ว

**Smoke Test** ยิง 6 กรณีหลักไปแอปที่เปิดอยู่ ใช้ตรวจเร็วหลังรันโปรแกรมหรือเปิด container ไม่แทน 51 tests ที่ละเอียดกว่า

**Full-system E2E/UAT** ต้องทดสอบตั้งแต่ Login ถึงลงทะเบียนและข้อความยืนยันผ่านหน้าเว็บจริง ยังต้องรอบริการของเพื่อนครบ จึงไม่อ้างว่า Gateway/Auth integration เป็นหลักฐาน E2E ทั้งระบบ

## 11. Dockerfile ทำอะไรบ้าง

Image คือชุดไฟล์โปรแกรมพร้อม runtime ที่บรรจุไว้ Container คือ process ที่เปิดใช้งานจาก image เดียวกันสามารถสร้าง containers ได้หลายครั้ง

Dockerfile ของ Auth ใช้ Node 24 แบบ Debian slim และมี 2 stages ตามแนวทาง multi-stage build:

1. **build stage**: กำหนด WORKDIR, copy package/lock, npm ci รวมเครื่องมือพัฒนา, copy TypeScript source แล้ว compile เป็น dist
2. **runtime stage**: เริ่มจาก Node image ใหม่ ติดตั้งเฉพาะ dependencies ที่ใช้รัน copy dist จาก build stage ตั้ง PORT/NODE_ENV รันด้วยผู้ใช้ node และสั่ง `node dist/index.js`

Runtime จึงไม่มี TypeScript compiler และ tests จากเครื่องพัฒนา `.dockerignore` กัน .env/node_modules/dist เดิมของเครื่องไม่ให้ปะปนตอน build

`EXPOSE 3000` เป็นข้อมูลว่าบริการใช้พอร์ตใด ไม่ได้เปิดพอร์ต host ให้เอง `docker run -p 127.0.0.1:3001:3000` จึงแปลว่าเข้าผ่าน localhost:3001 ของเครื่อง แล้วส่งเข้า port 3000 ใน container

## 12. ทดสอบ container เมื่อ Docker พร้อม

เปิด Docker Desktop จน engine พร้อม แล้วรันใน services/user-auth:

```powershell
docker info
npm run test:docker
```

Script สร้าง image registration-auth:dev เปิด container ชื่อสุ่ม พอร์ตสุ่มผูกกับ localhost รอ healthy ยิง smoke 6 กรณี แล้วลบเฉพาะ container ของตนเอง ไม่ลบ images/volumes ของงานอื่น

ถ้าอยากเปิดไว้ลองเอง:

```powershell
docker build -t registration-auth:dev .
docker run --rm --name registration-auth-demo -p 127.0.0.1:3001:3000 registration-auth:dev
```

เปิด terminal อีกหน้าต่างแล้วรัน:

```powershell
npm run test:smoke -- http://127.0.0.1:3001
```

Compose ของทีมใช้ port 3000 ภายในทุก service ได้เพราะแยก container ไม่ชนกัน Gateway เปิดออก host ที่ 8080 อย่างไรก็ตาม Course/Enrollment/Notification ยังไม่มี implementation ใน main ที่ตรวจ จึงไม่รัน `docker compose up --build -d` ทั้งชุดตอนนี้

## 13. Commit, push, PR และ CI/CD ต่างกันอย่างไร

**Commit** เก็บ snapshot การเปลี่ยนแปลงใน Git บนเครื่อง **Push** ส่ง commit ไป branch gun บน GitHub **Pull Request** ขอให้ทีมตรวจและรวม gun เข้า main ไม่ได้หมายความว่า merge สำเร็จแล้ว

งานนี้แบ่งเป็นขั้นโครงบริการ, ฟังก์ชัน Auth, tests, Docker, เอกสาร แต่ละขั้นตรวจแล้ว commit/push แยก เพื่อย้อนดูการพัฒนาและตรวจแต่ละส่วนได้

Workflow CI ของ Sea ตั้งให้รันเมื่อ PR ไป main หรือ push main เท่านั้น Push gun จึงไม่รัน CI จนกว่าจะเปิด PR ที่เข้ากับ path filter ของ service

CI job verify ติดตั้ง dependencies, build TypeScript, รันทดสอบ และ build Docker image ถ้า verify ไม่ผ่าน ทีมยังไม่ควร merge งานโดยอ้างว่า CI ผ่าน

เมื่อ merge เข้า main job publish ใช้ secrets ของทีมเข้าสู่ Docker Hub และ push image เป็น latest และ commit SHA เมื่อทีม push tag v* release workflow ของ Safe จะทดสอบ/build/push image ทั้ง 5 บริการพร้อม version tag

การส่ง image เข้า Registry คือแจกจ่าย artifact ส่วนการเปิด container จาก image เป็นการรันระบบ เป็นคนละขั้น การเห็น image บน Docker Hub อย่างเดียวไม่พิสูจน์ว่า flow ลงทะเบียนเรียนผ่านทั้งหมด

ไม่สร้าง secrets, release tag หรือ merge main แทน PM/Safe งาน Gun เตรียม service และรายละเอียดให้ workflow กลางใช้งาน

## 14. ข้อจำกัดที่ต้องอธิบายตรง ๆ

- Store เป็น Map ใน RAM ไม่ใช่ MongoDB โปรแกรมหรือ container restart แล้วผู้ใช้หาย เหมาะกับเดโมตาม README
- ไม่มีบัญชีจริงหรือบัญชี default ต้อง Register ก่อน Login ค่ารหัสผ่านตัวอย่างในคู่มือนี้ใช้ทดสอบเท่านั้น
- ไม่มี session/JWT/authorization ของ API อื่น เพราะ contract อนุญาตให้ละ token ในเดโม อย่าอธิบายว่า Login นี้ทำระบบ production ปลอดภัยครบแล้ว
- ไม่มี rate limit, password reset, email verification, persistent database หรือการแชร์ผู้ใช้ข้าม replicas เพราะอยู่นอกขอบเขตเดโมที่ทีมกำหนด
- Docker Desktop และ CI ต้องตรวจผลจริง ดู VERIFICATION.md ว่าตรวจอะไรผ่านและอะไรยังติดปัญหา
- API contract ยังเป็น draft งานโค้ดตรงรูปแบบและ Gateway tests ผ่าน แต่การยืนยันร่วมกับเพื่อนยังต้องเกิดจากทีมจริง

## 15. เนื้อหาวิชาที่นำมาใช้

อ่านไฟล์ใน deploy2 เป็นเอกสารอ้างอิง แยกจากคำสั่งของ Gun ไม่รันคำสั่งสร้าง Git repository, cloud resources หรือ release ตาม lab โดยอัตโนมัติ

- **งานกลุ่ม.pdf**: บทบาท Tester, automation บน CI/CD, Login, Unit Test และ image ต่อสมาชิก ใช้กำหนดงานส่งของ Auth
- **Deployment Syllabus**: แนวคิด build/release/deployment, Docker, automation และตรวจหลัง deploy ใช้วางลำดับงานและอธิบายหลักฐาน
- **part1**: SDLC และระดับ testing ใช้แยก Unit/Integration/ระบบรวม
- **part2**: Git branch/commit/push และ GitHub Actions ใช้แบ่งขั้นและตรวจ workflow trigger จริง
- **part3**: Docker, container/port และ Express/MongoDB ใช้สร้าง HTTP service; เลือก memory storage ตาม README ของโครงงานซึ่งอนุญาตไว้
- **part4**: Dockerfile/.dockerignore, build/run, Registry และ Compose ใช้ทำ image ของ Auth กับคำสั่งส่งต่อทีม
- **typescript addon และ tsconfig.zip**: TypeScript strict types, interface/class และ compile source ใช้เป็นพื้นฐานโครง src/dist
- **software testing และ robot3.robot**: Test Specification, positive/negative cases, setup/teardown, automation ใช้ทำ TEST_SPEC และ Node test suites ที่ CI เดิมรันได้ ไม่ย้าย tests ของ SauceDemo มาอ้างว่าเป็น tests ของ Auth
- **4 for showcase**: Dev/Test/Staging/UAT และเครื่องมือโชว์งาน ใช้แยกการทดสอบบริการออกจาก UAT ของทีม
- **k8s**: แนวคิดจัดการ container หลาย instance เป็นความรู้ต่อยอด โครงงานนี้ใช้ Compose ตาม README จึงไม่เพิ่ม Kubernetes manifests นอกงาน Gun

เอกสารทางการที่ตรวจประกอบ: [Node.js crypto/scrypt](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback), [Express API](https://expressjs.com/en/api/), [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)

## 16. ตัวอย่างอธิบายตอนนำเสนอ

“ผมรับผิดชอบ User/Auth Service ใช้ TypeScript และ Express รับสมัครบัญชีกับ Login ตาม API contract ของทีม เก็บ password เป็น scrypt hash ไม่ส่ง hash กลับ API สร้าง studentId ให้ Enrollment ใช้ เขียน Unit/API/Gateway Integration Tests รวม 51 รายการ มี Dockerfile ของบริการตัวเองและ smoke script เพื่อทดสอบหลังรัน container โค้ดและผลตรวจอยู่บน branch gun ส่วน CI/การ publish ใช้ workflow กลางของทีม สถานะจริงดู VERIFICATION.md และระบบนี้ใช้ข้อมูลสมมติใน memory สำหรับเดโมครับ”
