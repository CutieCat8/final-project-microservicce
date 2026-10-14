# ระบบลงทะเบียนเรียนรายวิชา

โครงงานกลุ่มตัวอย่างระบบไมโครเซอร์วิสสำหรับให้นักศึกษาเข้าสู่ระบบ ดูรายวิชา ลงทะเบียนเรียน และรับข้อความยืนยันการลงทะเบียน

## ภาพรวมการทำงาน

```text
Browser → API Gateway / Web → User/Auth Service
                          ├→ Course Service
                          └→ Enrollment Service → Notification Service
```

ระบบมี 5 ไมโครเซอร์วิสตามบทบาทของสมาชิก แต่ละบริการพัฒนาและทดสอบแยกกัน มี `Dockerfile` และ Docker image ของตัวเอง ส่วน repo นี้เป็นที่รวม source code, Docker Compose, เอกสาร และ GitHub Actions เพื่อให้ทำงานร่วมกันและเปิดระบบทั้งชุดได้ง่าย

> Docker Hub ใช้เก็บและแจกจ่าย Docker image ส่วน Docker Compose ใช้สร้างเครือข่ายและเปิด containers ให้บริการเรียกหากันผ่านชื่อ service

## ผู้รับผิดชอบไฟล์ส่วนกลาง

- **Windsurf (PM):** API Gateway/Web, `docker-compose.yml`, `deploy/docker-compose.release.yml`, API contract และประสาน integration
- **Sea (Developer):** CI workflow ของบริการทั้ง 5 ใน `.github/workflows/ci-*.yml`
- **Safe (Developer):** `release-images.yml` สำหรับเผยแพร่ Docker Images ไป Docker Hub; Sea ช่วย review workflow
- **เจ้าของแต่ละบริการ:** source code, tests, `Dockerfile` และ `.dockerignore` ของบริการตน พร้อมส่งคำสั่ง build/test, พอร์ต และ health endpoint ให้ผู้ดูแล workflow

## สมาชิกและบริการ

| สมาชิก | ตำแหน่ง | โฟลเดอร์บริการที่เสนอ |
|---|---|---|
| Windsurf | PM | `services/gateway-web/` |
| Gun | Tester | `services/user-auth/` |
| Sea | Developer | `services/course/` |
| Yuri | Tester | `services/enrollment/` |
| Safe | Developer | `services/notification/` |

## โครงสร้าง repo

```text
final-project-microservicce/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── services/
│   ├── gateway-web/       (Windsurf: windsurf_work.md, src/)
│   ├── user-auth/         (Gun: gun_work.md, src/)
│   ├── course/            (Sea: sea_work.md, src/)
│   ├── enrollment/        (Yuri: yuri_work.md, src/)
│   └── notification/      (Safe: safe_work.md, src/)
├── .github/workflows/
│   ├── ci-gateway-web.yml
│   ├── ci-user-auth.yml
│   ├── ci-course.yml
│   ├── ci-enrollment.yml
│   ├── ci-notification.yml
│   └── release-images.yml
├── docs/
│   ├── README.md
│   ├── api-contract.md
│   ├── test-specifications.md
│   └── deployment.md
├── deploy/docker-compose.release.yml
└── work/ (สรุปและ work file ของกลุ่ม)
```

ในแต่ละโฟลเดอร์บริการมี work file ของเจ้าของและโฟลเดอร์ `src/` เป็นจุดเริ่มต้น เจ้าของสร้าง `package.json`, `tests/`, `Dockerfile` และ `.dockerignore` เพิ่มตาม work file และทำ `GET /health`; ไฟล์ work file ช่วยให้ GitHub เก็บโฟลเดอร์ไว้ได้ ไม่ต้องใช้ `.gitkeep`

## เริ่มต้นทำงานใน repo

Windsurf เตรียม repo นี้ไว้แล้ว จึงไม่ต้องรัน `git init` หรือเพิ่ม `origin` ซ้ำ สมาชิกคนอื่นให้ขอ URL จาก Windsurf แล้วทำบนเครื่องของตนเอง:

```bash
git clone <URL-ของ-repo-กลุ่ม>
cd final-project-microservicce
git switch -c feature/<ชื่อบริการ>-<งาน>
```

ก่อนเริ่มและก่อนส่งงาน ให้ตรวจ `git status --short --branch` สมาชิกทำงานในโฟลเดอร์บริการที่รับผิดชอบ แล้วเปิด Pull Request เข้าสาขาหลักตามที่กลุ่มตกลง อย่าแก้ไฟล์ของบริการอื่นหรือ commit ไฟล์ `.env` และ token

### เตรียมเครื่องของสมาชิกทุกคน

- ติดตั้ง Git, Node.js รุ่น LTS ที่กลุ่มเลือก และ Docker Desktop; เปิด Docker Desktop ไว้ก่อนใช้ Compose
- ใช้ Node version และคำสั่งที่กำหนดใน `README`/`package.json` ของบริการเมื่อเริ่มสร้างโค้ด
- เข้าถึง GitHub repo ของกลุ่ม และตรวจว่า clone กับ push branch ของตนเองได้
- ตั้งค่าบัญชี Docker Hub และเข้าสู่ระบบ Docker Desktop เฉพาะผู้ที่ต้อง build/push image จากเครื่องตนเอง; การเผยแพร่อัตโนมัติใช้ GitHub Actions ของ repo กลุ่ม

## เปิดระบบในเครื่องด้วย Docker Compose

รันเมื่อสร้าง `docker-compose.yml` และ Dockerfile ขั้นต้นของทุกบริการแล้ว:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f <service-name>
```

เปิด URL ที่กลุ่มกำหนดใน `docker-compose.yml` (แนะนำ `http://localhost:8080`) และตรวจ `GET /health` ของแต่ละบริการ หากต้องการหยุดระบบ:

```bash
docker compose down
```

## Docker Hub และการเผยแพร่ image

ให้กลุ่มใช้ Docker Hub namespace เดียวกัน และแยก repository/image ต่อบริการ เช่น:

```text
<dockerhub-namespace>/registration-gateway
<dockerhub-namespace>/registration-auth
<dockerhub-namespace>/registration-course
<dockerhub-namespace>/registration-enrollment
<dockerhub-namespace>/registration-notification
```

### ตั้งค่าอัตโนมัติครั้งเดียวโดย Windsurf หรือ repo admin

1. สร้างหรือเลือก Docker Hub namespace ของกลุ่ม และกำหนดชื่อ image ทั้ง 5 ให้สมาชิกทราบ
2. สร้าง Docker Hub access token ที่มีสิทธิ์เขียน image สำหรับ automation อย่าใช้หรือส่งรหัสผ่านบัญชีให้สมาชิก
3. Windsurf หรือ repo admin ไปที่ GitHub repo → **Settings → Secrets and variables → Actions** แล้วเพิ่ม Secrets:
   - `DOCKERHUB_USERNAME` — Docker Hub namespace/username ที่ใช้เผยแพร่
   - `DOCKERHUB_TOKEN` — access token จาก Docker Hub
4. Sea ดูแล CI workflow ของทั้ง 5 บริการใน `.github/workflows/ci-*.yml`; Safe ดูแล `release-images.yml` สำหรับ build และ push image เมื่อ push tag เช่น `v0.1.0` โดยเจ้าของบริการส่งคำสั่ง build/test, พอร์ต และ health check ให้ทั้งคู่
5. ตรวจแท็บ **Actions** ว่า workflow สำเร็จ แล้วตรวจ image และ tag ใน Docker Hub

Secrets เป็นการตั้งค่าร่วมของ repo โดยผู้มีสิทธิ์จัดการเท่านั้น สมาชิกแต่ละคนไม่ต้องสร้าง token ของตนหรือใส่ token ในไฟล์งาน หากสมาชิกจำเป็นต้อง push image ด้วยตนเอง ให้ใช้ token ที่ได้รับมอบหมายและเก็บไว้ใน Docker credential store; ห้าม commit token

สำหรับขั้นตอนตั้งแต่ build/push จนเปิดระบบจาก image ดู [คู่มือ Deploy และ Docker Hub](docs/deployment.md)

### ทดลอง build และ push ด้วยตนเอง (ถ้าได้รับสิทธิ์)

```bash
docker login -u <dockerhub-username>
docker build -t <dockerhub-namespace>/registration-course:v0.1.0 ./services/course
docker push <dockerhub-namespace>/registration-course:v0.1.0
docker pull <dockerhub-namespace>/registration-course:v0.1.0
```

เปลี่ยน `course` เป็นโฟลเดอร์และชื่อ image ของบริการที่รับผิดชอบ อย่าเผยแพร่ image ที่ยังไม่ได้ผ่านการทดสอบหรือใช้ tag `latest` แทน version ในหลักฐานส่งงาน

### ลำดับ CI/CD ที่แนะนำ

เมื่อ merge การเปลี่ยนแปลงเข้า `main` ระบบจะทดสอบและเผยแพร่ image ของบริการที่เปลี่ยนแปลงไปยัง Docker Hub โดยอัตโนมัติ ส่วนการ push tag รูปแบบ `v*` จะทดสอบและเผยแพร่ image ทั้ง 5 บริการ

1. สมาชิก push branch และเปิด Pull Request
2. GitHub Actions ของบริการที่เปลี่ยนแปลงติดตั้ง dependencies, build, รัน unit/integration tests และตรวจว่า Docker image build ได้
3. รวม Pull Request หลัง CI ผ่าน โดย Sea ดูแล CI workflow และ Safe ช่วยตรวจ release workflow
4. Windsurf ในฐานะ PM สร้าง GitHub Release ที่มี tag เช่น `v0.1.0`; Safe ดูแล workflow เผยแพร่ image และ Sea ช่วยตรวจ CI
5. Release workflow build และ push image ทั้ง 5 ไป Docker Hub ด้วย version tag
6. ดึง image ที่เผยแพร่แล้วมาทดลองเปิดด้วย Compose และตรวจ health endpoints ก่อนนำเสนอ

## ขอบเขตงานที่ควรทำก่อน

เริ่มจาก API แบบง่ายและข้อมูลตัวอย่าง ไม่ต้องเชื่อมอีเมลหรือ SMS และไม่ต้องทำระบบ production เต็มรูปแบบ ควรตกลง API path, JSON fields, service names, ports และ image names ก่อนแยกงานพัฒนา

API เบื้องต้นที่เสนอ:

- `POST /api/auth/login`
- `GET /api/courses`
- `POST /api/enrollments`
- `GET /api/enrollments/:studentId`
- `GET /api/notifications/:enrollmentId`
- `GET /health` สำหรับทุกบริการ

## ไฟล์วางแผนของกลุ่ม

- [`PROJECT_SUMMARY.md`](work/PROJECT_SUMMARY.md) — สรุปแนวคิดและขอบเขตโครงงาน
- [`member-work-file.md`](work/member-work-file.md) — แผนงานหลักและกติกาการทำงานร่วมกัน
- [API Contract](docs/api-contract.md), [Test Specifications](docs/test-specifications.md), [Docker Hub/Deploy](docs/deployment.md) — เอกสารระบบและขั้นตอนที่กลุ่มใช้อ้างอิง
- `services/<service>/<member>_work.md` — รายการงานและขั้นตอน setup เฉพาะของสมาชิกในโฟลเดอร์บริการที่รับผิดชอบ

## ตัวอย่างที่ใช้อ้างอิง

โครงสร้าง monorepo, แยกโฟลเดอร์ service, ใช้ Compose เปิดทั้งระบบ และแยก CI ตามบริการดัดแปลงจาก [repo ตัวอย่างของเพื่อน](https://github.com/Boypemt/Cloud-deploy-final-project), [README](https://github.com/Boypemt/Cloud-deploy-final-project/blob/main/README.md), [Docker Compose](https://github.com/Boypemt/Cloud-deploy-final-project/blob/main/docker-compose.yml) และ [เอกสาร Pipeline](https://github.com/Boypemt/Cloud-deploy-final-project/blob/main/docs/PIPELINE.md) โดย README นี้เป็นแผนสำหรับระบบลงทะเบียนเรียน ไม่ได้นำข้อมูลลับหรือโค้ดของระบบตัวอย่างมาใช้

## เอกสารอ้างอิง

- [Docker Compose: `up`](https://docs.docker.com/reference/cli/docker/compose/up/)
- [Docker Hub access tokens](https://docs.docker.com/security/access-tokens/)
- [GitHub Actions secrets](https://docs.github.com/en/actions/reference/security/secrets)
