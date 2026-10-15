# รายการงานของ Sea — ระบบลงทะเบียนเรียนรายวิชา

**ตำแหน่ง:** นักพัฒนา (Developer)  
**บริการที่รับผิดชอบ:** Course Service  
**ไฟล์แผนงานหลัก:** `../../work/member-work-file.md`

## วิธีใช้ไฟล์นี้

ไฟล์นี้เป็นรายการงานเฉพาะของ Sea ส่วน `../../work/member-work-file.md` เป็นแผนงานหลักร่วมกันของกลุ่ม ใช้ไฟล์หลักเป็นแหล่งอ้างอิงเรื่องขอบเขตระบบ สัญญา API และการ Deploy เมื่อทำงานเสร็จและตรวจสอบแล้ว ให้อัปเดตเครื่องหมายในไฟล์นี้และรายการที่ตรงกันในไฟล์หลักให้ตรงกัน

ทำเฉพาะงานที่ได้รับมอบหมายให้ Sea หากต้องเปลี่ยนขอบเขตหรือแก้ส่วนของบริการอื่น ให้คุยกับเจ้าของบริการก่อน ตรวจสถานะ Git และรักษาการแก้ไขเดิมไว้ ห้าม Commit หรือ Push งานของสมาชิกคนอื่น

## งานที่ต้องทำ

ความสำคัญ: **P0** จำเป็นต่อการส่งงานและเดโม; **P1** ทำต่อหลัง P0 หรือเมื่อมีเวลา

- [x] **P0:** ตกลงโครงสร้างข้อมูลรายวิชาและรูปแบบ JSON กับ Windsurf และ Yuri
- [x] **P0:** ทำ Endpoint แสดงรายการและรายละเอียดรายวิชา พร้อมข้อมูลตัวอย่างจำนวนน้อย
- [x] **P1:** เพิ่ม Endpoint สำหรับเพิ่มหรือแก้ไขรายวิชา หากอยู่ในขอบเขตที่กลุ่มตกลง
- [x] **P0:** เขียน Unit Test อย่างน้อย 1 รายการสำหรับการอ่านหรือค้นหารายวิชา
- [x] **P0:** ทำ Integration Test สำหรับ Course API ร่วมกับ Tester
- [x] **P0:** ทำ Dockerfile และ build/test scripts ของ Course; รับผิดชอบ CI workflow ทั้ง 5 service และส่งรายละเอียด build/test ให้ Safe สำหรับ release
- [x] **P1:** ตรวจการเรียก Course Service ผ่าน Gateway และแก้ปัญหาร่วมกับผู้ทดสอบ

## สิ่งที่ต้องประสาน

- แจ้ง Endpoint และตัวอย่างข้อมูลรายวิชาให้ Windsurf สำหรับหน้าเว็บ
- แจ้งรูปแบบ Course ID และข้อมูลรายวิชาให้ Yuri เพื่อใช้ใน Enrollment Service
- ใช้ข้อมูลตัวอย่างในเดโม หลีกเลี่ยงการเพิ่มฟังก์ชันที่ไม่จำเป็น เช่น ระบบตารางเรียนซับซ้อน
- ใช้ GitHub Secrets สำหรับข้อมูล Registry และข้อมูลลับอื่น ๆ

## ส่งต่องาน

เมื่อ Course API พร้อม ให้แจ้ง Endpoint และตัวอย่าง Request/Response พร้อมผล Unit Test และ Integration Test

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

### งานตั้งต้นของ Sea: Course Service

- โฟลเดอร์ที่รับผิดชอบ: services/course/
- สร้างไฟล์ตั้งต้นของ service ตามรายการด้านบน โดยมี Express app, GET /health, scripts build/test และ Dockerfile
- ตกลง Course ID และ JSON ของรายวิชากับ Windsurf และ Yuri ก่อนเชื่อมระบบ
- แจ้ง Windsurf เรื่องพอร์ต, health endpoint, environment variables, ชื่อ image registration-course และคำสั่ง build/test
- ทำ endpoint แสดงรายวิชาและข้อมูลตัวอย่าง จากนั้นเพิ่ม unit test และ integration test ที่จำเป็น
- ไม่แก้ workflow กลางหรือไฟล์ deploy; ส่งข้อมูล build/test ให้ Sea และ Safe
- ใช้ Docker Hub namespace ของกลุ่มที่ Windsurf กำหนด ไม่ต้องสร้าง token ส่วนตัวสำหรับ Actions





