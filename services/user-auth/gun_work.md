# รายการงานของ Gun — ระบบลงทะเบียนเรียนรายวิชา

**ตำแหน่ง:** ผู้ทดสอบ (Tester)  
**บริการที่รับผิดชอบ:** User / Auth Service  
**ไฟล์แผนงานหลัก:** `../../work/member-work-file.md`

## วิธีใช้ไฟล์นี้

ไฟล์นี้เป็นรายการงานเฉพาะของ Gun ส่วน `../../work/member-work-file.md` เป็นแผนงานหลักร่วมกันของกลุ่ม ใช้ไฟล์หลักเป็นแหล่งอ้างอิงเรื่องขอบเขตระบบ สัญญา API และการ Deploy เมื่อทำงานเสร็จและตรวจสอบแล้ว ให้อัปเดตเครื่องหมายในไฟล์นี้และรายการที่ตรงกันในไฟล์หลักให้ตรงกัน

ทำเฉพาะงานที่ได้รับมอบหมายให้ Gun หากต้องเปลี่ยนขอบเขตหรือแก้ส่วนของบริการอื่น ให้คุยกับเจ้าของบริการก่อน ตรวจสถานะ Git และรักษาการแก้ไขเดิมไว้ ห้าม Commit หรือ Push งานของสมาชิกคนอื่น

## งานที่ต้องทำ

ความสำคัญ: **P0** จำเป็นต่อการส่งงานและเดโม; **P1** ทำต่อหลัง P0 หรือเมื่อมีเวลา

- [ ] **P0:** ยืนยันข้อมูลผู้ใช้และรูปแบบคำตอบของ Register / Login กับ Windsurf
- [x] **P0:** ทำ Endpoint สมัครบัญชีและเข้าสู่ระบบสำหรับเดโม พร้อมตรวจข้อมูลที่จำเป็น
- [x] **P0:** หากบันทึกรหัสผ่าน ให้เก็บเฉพาะค่าแฮช ห้ามเก็บรหัสผ่านแบบข้อความธรรมดา
- [x] **P0:** จัดทำกรณีทดสอบ Login สำเร็จ รหัสผ่านไม่ถูกต้อง และข้อมูลคำขอไม่ครบ
- [x] **P0:** เขียน Unit Test อย่างน้อย 1 รายการ
- [ ] **P0:** ทำ Integration Test สำหรับ Auth API ร่วมกับ Windsurf และตรวจผลใน GitHub Actions
- [ ] **P0:** ทำ Dockerfile และ build/test scripts ของ Auth แล้วส่งรายละเอียดให้ Sea ตั้ง CI และ Safe ตั้ง release
- [ ] **P1:** ตรวจการเชื่อมต่อ Gateway กับ Auth Service และรายงานผล CI

## สิ่งที่ต้องประสาน

- แจ้ง API Path, ชื่อฟิลด์ และรูปแบบผลลัพธ์ให้ Windsurf ก่อนเชื่อม Gateway
- แจ้งข้อมูลระบุตัวผู้ใช้ที่ Enrollment Service ต้องใช้ให้ Yuri
- ใช้บัญชีตัวอย่างสำหรับทดสอบ ห้ามใช้ข้อมูลจริงของนักศึกษา
- ใช้ GitHub Secrets สำหรับข้อมูล Registry และข้อมูลลับอื่น ๆ

## ส่งต่องาน

เมื่อ Auth API พร้อม ให้แจ้ง Endpoint และตัวอย่าง Request/Response ที่ใช้ทดสอบ พร้อมระบุผล Unit Test และ Integration Test

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

### งานตั้งต้นของ Gun: User/Auth Service

- โฟลเดอร์ที่รับผิดชอบ: services/user-auth/
- สร้างไฟล์ตั้งต้นของ service ตามรายการด้านบน โดยมี Express app, GET /health, scripts build/test และ Dockerfile
- แจ้ง Windsurf ว่าจะใช้พอร์ต, health endpoint, environment variables, ชื่อ image registration-auth และคำสั่ง build/test อะไร
- จัดทำ test cases สำหรับสมัครบัญชีและเข้าสู่ระบบ ทั้งกรณีสำเร็จและกรณีข้อมูลผิด; อย่าใช้ข้อมูลนักศึกษาจริง
- ทดสอบ service ของตนและช่วยตรวจ CI/Integration Test ตามบทบาท Tester
- ไม่แก้ workflow กลางหรือไฟล์ deploy; Sea ดูแล CI, Safe ดูแล release และ Windsurf ดูแล Compose/deploy
- ใช้ Docker Hub namespace ของกลุ่มที่ Windsurf กำหนด การ push อัตโนมัติใช้ Secrets กลาง ไม่ต้องแชร์ token ส่วนตัว





