# รายการงานของ Windsurf — ระบบลงทะเบียนเรียนรายวิชา

**ตำแหน่ง:** ผู้จัดการโครงการ (PM)  
**บริการที่รับผิดชอบ:** API Gateway / Web  
**ไฟล์แผนงานหลัก:** `../../work/member-work-file.md`

## วิธีใช้ไฟล์นี้

ไฟล์นี้เป็นรายการงานเฉพาะของ Windsurf ส่วน `../../work/member-work-file.md` เป็นแผนงานหลักร่วมกันของกลุ่ม ใช้ไฟล์หลักเป็นแหล่งอ้างอิงเรื่องขอบเขตระบบ สัญญา API และการ Deploy เมื่อทำงานเสร็จและตรวจสอบแล้ว ให้อัปเดตเครื่องหมายในไฟล์นี้และรายการที่ตรงกันในไฟล์หลักให้ตรงกัน

ทำเฉพาะงานที่ได้รับมอบหมายให้ Windsurf หากต้องเปลี่ยนขอบเขตหรือแก้ส่วนของบริการอื่น ให้คุยกับเจ้าของบริการก่อน ตรวจสถานะ Git และรักษาการแก้ไขเดิมไว้ ห้าม Commit หรือ Push งานของสมาชิกคนอื่น

## งานที่ต้องทำ

ความสำคัญ: **P0** จำเป็นต่อการส่งงานและเดโม; **P1** ทำต่อหลัง P0 หรือเมื่อมีเวลา

- [ ] **P0:** ยืนยันขอบเขตโครงงาน, API Path, รูปแบบ JSON และการยืนยันตัวตนร่วมกับสมาชิกทั้ง 4 คน
- [ ] **P0:** จัดทำ API Contract และ Test Specification ให้ครบ 5 service; ประสาน Sea (CI) และ Safe (release workflow) พร้อมดูแล Docker Compose
- [ ] **P0:** ทำหน้า Login และหน้าแสดงรายวิชา โดยให้เบราว์เซอร์ส่งคำขอผ่าน Gateway
- [ ] **P0:** ทำหน้าลงทะเบียนและแสดงข้อความตอบกลับจาก Enrollment / Notification
- [ ] **P0:** ทำ API Gateway เพื่อส่งคำขอไปยัง User/Auth, Course, Enrollment และบริการที่เกี่ยวข้อง
- [ ] **P0:** เพิ่ม Unit Test อย่างน้อย 1 รายการสำหรับ Gateway หรือ Web
- [ ] **P0:** ทำ Dockerfile และ build/test scripts ของ Gateway พร้อมส่งรายละเอียดให้ Sea ตั้ง CI และ Safe ตั้ง release workflow
- [ ] **P1:** จัดทำคู่มือเริ่มระบบทั้งหมดด้วย Docker Compose
- [ ] **P1:** ประสานการทดสอบรวม และตรวจว่าสมาชิกทุกคนอธิบายบริการ Test และ Image ของตนได้

## สิ่งที่ต้องประสาน

- รอ API Contract และ Endpoint จาก Gun, Sea, Yuri และ Safe ก่อนเชื่อมแต่ละบริการ
- ตกลงชื่อ Service และตัวแปร URL ที่ Docker Compose จะใช้ร่วมกัน
- Compose ต้องดึง Image จาก Docker Hub และให้บริการเรียกกันผ่านชื่อ Service บนเครือข่ายเดียวกัน
- ห้ามเก็บรหัสผ่านหรือ Access Token ไว้ในโค้ด ใช้ GitHub Secrets สำหรับข้อมูลลับ

## ส่งต่องาน

เมื่อ Gateway หรือหน้าเว็บพร้อมให้สมาชิกอื่นทดสอบ ให้รายงานสิ่งที่พร้อม วิธีตรวจสอบ และงานถัดไป โดยไม่กล่าวว่าได้แจ้งสมาชิกแล้วหากยังไม่ได้ส่งข้อความจริง

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

### งานส่วนกลางของ Windsurf ในฐานะ PM

- กำหนด API Contract, ชื่อ service, ชื่อ image และตัวแปร environment ร่วมกับสมาชิกก่อน integration
- ดูแล docker-compose.yml สำหรับ local integration และ deploy/docker-compose.release.yml สำหรับดึง image จาก Docker Hub
- ประสานงานกับ Sea (เจ้าของ CI workflow) และ Safe (เจ้าของ release-images.yml); เจ้าของ service ส่งคำสั่ง build/test และ health check ให้ทั้งคู่
- ตั้ง Docker Hub namespace และ GitHub Actions Secrets ของ repo กลุ่มครั้งเดียว แล้วตรวจว่า Actions เผยแพร่ image ได้
- รวมงานผ่าน Pull Request หลัง CI ผ่าน และเผยแพร่ tag เมื่อบริการครบและพร้อมเดโม
- งาน service ของ Windsurf อยู่ใน services/gateway-web/; งาน PM ส่วนกลางทำเฉพาะไฟล์ร่วมที่ระบุข้างต้น
