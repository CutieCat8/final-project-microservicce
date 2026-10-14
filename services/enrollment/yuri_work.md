# รายการงานของ Yuri — ระบบลงทะเบียนเรียนรายวิชา

**ตำแหน่ง:** ผู้ทดสอบ (Tester)  
**บริการที่รับผิดชอบ:** Enrollment Service  
**ไฟล์แผนงานหลัก:** `../../work/member-work-file.md`

## วิธีใช้ไฟล์นี้

ไฟล์นี้เป็นรายการงานเฉพาะของ Yuri ส่วน `../../work/member-work-file.md` เป็นแผนงานหลักร่วมกันของกลุ่ม ใช้ไฟล์หลักเป็นแหล่งอ้างอิงเรื่องขอบเขตระบบ สัญญา API และการ Deploy เมื่อทำงานเสร็จและตรวจสอบแล้ว ให้อัปเดตเครื่องหมายในไฟล์นี้และรายการที่ตรงกันในไฟล์หลักให้ตรงกัน

ทำเฉพาะงานที่ได้รับมอบหมายให้ Yuri หากต้องเปลี่ยนขอบเขตหรือแก้ส่วนของบริการอื่น ให้คุยกับเจ้าของบริการก่อน ตรวจสถานะ Git และรักษาการแก้ไขเดิมไว้ ห้าม Commit หรือ Push งานของสมาชิกคนอื่น

## งานที่ต้องทำ

ความสำคัญ: **P0** จำเป็นต่อการส่งงานและเดโม; **P1** ทำต่อหลัง P0 หรือเมื่อมีเวลา

- [ ] **P0:** ตกลงข้อมูลผู้ใช้และรายวิชาที่ Enrollment ต้องใช้ร่วมกับ Gun และ Sea
- [ ] **P0:** ทำ Endpoint ลงทะเบียนเรียนและแสดงรายการลงทะเบียนของนักศึกษา
- [ ] **P0:** จัดการกรณีไม่พบรายวิชา ข้อมูลไม่ครบ และลงทะเบียนซ้ำ
- [ ] **P0:** จัดทำกรณีทดสอบสำเร็จและล้มเหลวสำหรับการลงทะเบียน
- [ ] **P0:** เขียน Unit Test อย่างน้อย 1 รายการ และจัดทำ Integration / End-to-End Test
- [ ] **P0:** ทดสอบลำดับการลงทะเบียนผ่าน Gateway และตรวจข้อความตอบกลับจาก Notification
- [ ] **P0:** ทำ Dockerfile และ build/test scripts ของ Enrollment แล้วส่งรายละเอียดให้ Sea ตั้ง CI และ Safe ตั้ง release
- [ ] **P1:** ตรวจผล CI และรายงานปัญหาให้เจ้าของบริการที่เกี่ยวข้อง

## สิ่งที่ต้องประสาน

- ใช้ User ID จาก Gun และ Course ID จาก Sea ตาม API Contract ที่กลุ่มตกลง
- ตกลงรูปแบบคำขอและคำตอบกับ Windsurf ก่อนเชื่อม Gateway
- ตกลงข้อมูลที่ส่งให้ Safe เพื่อสร้างข้อความยืนยัน
- ใช้ข้อมูลทดสอบเท่านั้น และลบข้อมูลทดสอบหลังตรวจเสร็จ

## ส่งต่องาน

เมื่อ Enrollment API พร้อม ให้แจ้ง Endpoint, ตัวอย่างผลการลงทะเบียน และผลกรณีทดสอบแต่ละกรณี

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

### งานตั้งต้นของ Yuri: Enrollment Service

- โฟลเดอร์ที่รับผิดชอบ: services/enrollment/
- สร้างไฟล์ตั้งต้นของ service ตามรายการด้านบน โดยมี Express app, GET /health, scripts build/test และ Dockerfile
- ตกลง User ID กับ Gun, Course ID กับ Sea, และรูปแบบข้อมูลยืนยันกับ Safe ก่อนทำ endpoint
- แจ้ง Windsurf เรื่องพอร์ต, health endpoint, environment variables, ชื่อ image registration-enrollment และคำสั่ง build/test
- จัดทำ test cases สำหรับลงทะเบียนสำเร็จ ไม่พบรายวิชา ข้อมูลไม่ครบ และลงทะเบียนซ้ำ
- ทดสอบลำดับการเรียก Enrollment ผ่าน Gateway และช่วยตรวจ Integration Test/CI ตามบทบาท Tester
- ไม่แก้ workflow กลางหรือไฟล์ deploy; Windsurf ดูแล Compose, Sea ดูแล CI และ Safe ดูแล release





