# รายการงานของ Safe — ระบบลงทะเบียนเรียนรายวิชา

**ตำแหน่ง:** นักพัฒนา (Developer)  
**บริการที่รับผิดชอบ:** Notification Service  
**เอกสารอ้างอิงปัจจุบัน:** `../../README.md` และ [Notification README](README.md)
**หมายเหตุ:** ไม่พบ `work/member-work-file.md` ใน checkout นี้

## วิธีใช้ไฟล์นี้

ไฟล์นี้เป็นรายการงานเฉพาะของ Safe ส่วนแผนงานหลัก `work/member-work-file.md` ยังไม่มีใน checkout นี้ ใช้ README ที่ root อ้างอิงขอบเขตชั่วคราว ใช้ไฟล์หลักเป็นแหล่งอ้างอิงเรื่องขอบเขตระบบ สัญญา API และการ Deploy เมื่อทำงานเสร็จและตรวจสอบแล้ว ให้อัปเดตเครื่องหมายในไฟล์นี้และรายการที่ตรงกันในไฟล์หลักให้ตรงกัน

ทำเฉพาะงานที่ได้รับมอบหมายให้ Safe หากต้องเปลี่ยนขอบเขตหรือแก้ส่วนของบริการอื่น ให้คุยกับเจ้าของบริการก่อน ตรวจสถานะ Git และรักษาการแก้ไขเดิมไว้ ห้าม Commit หรือ Push งานของสมาชิกคนอื่น

## งานที่ต้องทำ

ความสำคัญ: **P0** จำเป็นต่อการส่งงานและเดโม; **P1** ทำต่อหลัง P0 หรือเมื่อมีเวลา

- [ ] **P0:** ตกลงข้อมูลที่จำเป็นสำหรับข้อความยืนยันร่วมกับ Yuri และ Windsurf
- [x] **P0:** ทำ Endpoint สร้างข้อความยืนยันแบบจำลองหลังลงทะเบียนสำเร็จ
- [x] **P0:** เตรียม JSON ข้อความตอบกลับสำหรับ Gateway โดยไม่เชื่อมอีเมลหรือ SMS (ยังรอทดสอบหน้าเว็บจริงกับทีม)
- [x] **P0:** เขียน Unit Test สำหรับข้อความยืนยัน — ผ่าน 2/2 ด้วย npm run test:unit
- [ ] **P0:** ทำ Integration Test ร่วมกับ Yuri สำหรับลำดับการลงทะเบียนและการยืนยัน
- [ ] **P0:** ทำ Dockerfile และ build/test scripts ของ Notification; ดูแล release-images.yml และการเผยแพร่ image ทั้ง 5 ไป Docker Hub
- [ ] **P1:** ตรวจการเรียก Notification Service จาก Enrollment และแก้ปัญหาร่วมกับผู้ทดสอบ

## สิ่งที่ต้องประสาน

- รับ Enrollment ID และข้อมูลที่จำเป็นจาก Yuri ตาม API Contract ที่กลุ่มตกลง
- ตกลง Response ที่ Gateway จะแสดงกับ Windsurf
- ทำข้อความยืนยันภายในระบบเท่านั้นในเวอร์ชันแรก ไม่ต้องเชื่อมผู้ให้บริการอีเมลหรือ SMS
- ใช้ GitHub Secrets สำหรับข้อมูล Registry และข้อมูลลับอื่น ๆ

## ส่งต่องาน

เมื่อ Notification API พร้อม ให้แจ้ง Endpoint, ตัวอย่างข้อความตอบกลับ และผล Unit Test กับ Integration Test

## ตั้งค่าโปรเจกต์และส่งงาน

### ขั้นตอนที่สมาชิกทุกคนทำบนเครื่องของตนเอง

1. ติดตั้ง Git, Node.js LTS ที่กลุ่มตกลง และ Docker Desktop แล้วเปิด Docker Desktop
2. ขอสิทธิ์เข้าถึง repo กลุ่มจาก Windsurf; ถ้าเป็นเครื่องใหม่ให้ clone repo และสร้าง branch สำหรับงานของตน ห้ามรัน git init หรือเพิ่ม origin ซ้ำ
3. ตรวจ git status ก่อนแก้ไข ทำงานในโฟลเดอร์ service ที่รับผิดชอบเท่านั้น
4. เริ่ม service ด้วยไฟล์ package.json, package-lock.json, tsconfig.json, src/index.ts, src/app.ts, tests, Dockerfile และ .dockerignore ของตนเอง; ต้องมี GET /health และ scripts สำหรับ build กับ test
5. รัน npm install, npm run build และ npm test ในโฟลเดอร์ service ของตน ก่อนเปิด Pull Request
6. สร้าง image ในเครื่องด้วย docker build -t <ชื่อ-image>:dev . จากโฟลเดอร์ service; ทดสอบระบบรวมด้วย docker compose up --build -d ที่ root repo เมื่อ Compose พร้อมแล้ว
7. push branch ของตนและเปิด Pull Request เข้าสาขาหลัก รอ CI ผ่านก่อนรวมงาน ห้าม push ตรงเข้า main
8. ห้าม commit .env, password, access token หรือข้อมูลจริงของนักศึกษา

### ขอบเขตไฟล์ที่แต่ละคนดูแล

เจ้าของ service ดูแล source code, package.json/package-lock.json, tsconfig.json, tests, Dockerfile และ .dockerignore ในโฟลเดอร์ของตนเอง; Sea ดูแล CI, Safe ดูแล release workflow และ Windsurf ดูแล Compose/deploy

Windsurf ดูแล docker-compose.yml และ deploy/docker-compose.release.yml; Sea ดูแล CI workflow ของทั้ง 5 service; Safe ดูแล release-images.yml เจ้าของ service ส่งชื่อ image, พอร์ต, health endpoint, environment และคำสั่ง build/test ให้ผู้ดูแลที่เกี่ยวข้อง

การเผยแพร่ Docker Hub ใช้ namespace กลางของกลุ่ม ผู้ดูแล repo ตั้ง GitHub Actions Secrets DOCKERHUB_USERNAME และ DOCKERHUB_TOKEN เพียงครั้งเดียว สมาชิกไม่ต้องสร้างหรือส่ง token ส่วนตัวให้กัน

### งานตั้งต้นของ Safe: Notification Service

- โฟลเดอร์ที่รับผิดชอบ: services/notification/
- สร้างไฟล์ตั้งต้นของ service ตามรายการด้านบน โดยมี Express app, GET /health, scripts build/test และ Dockerfile
- ตกลงข้อมูล Enrollment ID และข้อความตอบกลับกับ Yuri และ Windsurf
- แจ้ง Windsurf เรื่องพอร์ต, health endpoint, environment variables, ชื่อ image registration-notification และคำสั่ง build/test
- ทำ endpoint สร้างข้อความยืนยันภายในระบบและ unit test อย่างน้อย 1 รายการ ไม่ต้องเชื่อมอีเมลหรือ SMS
- ดูแล release-images.yml ตามขอบเขต Safe; ส่งข้อมูล build/test ให้ Sea และการเชื่อมต่อให้ Windsurf ไม่แก้ CI หรือ deploy ของผู้อื่น
- ใช้ Docker Hub namespace ของกลุ่มที่ Windsurf กำหนด ไม่ต้องสร้าง token ส่วนตัวสำหรับ Actions






## ผลตรวจ 16 ตุลาคม 2026

- Build ผ่าน และ Unit Test ผ่าน 2/2
- มี Dockerfile, build/test scripts และ release workflow แล้ว แต่ข้อเผยแพร่ยังไม่ติ๊ก เพราะยังไม่ยืนยัน Docker build/runtime และ image ทั้ง 5
- HTTP tests 5 กรณีติด listen EPERM และ Docker ติดสิทธิ์ socket ของ sandbox ต้องตรวจต่อใน Terminal/CI ที่เข้าถึงได้
- เพิ่ม npm run test:docker เพื่อตรวจ health/create/retrieve ใน container ชั่วคราว
- ตัวอย่าง API และรายการทดสอบร่วมทีมอยู่ใน [README.md](README.md)
- ยังไม่ได้ยืนยัน API ร่วมทีม ทำ Integration Test หรือเผยแพร่ image; งาน Safe commit แล้ว และรวม origin/main ที่เครื่องมีถึง 104b7e9 เข้า safe แล้ว ยังไม่ได้ push
