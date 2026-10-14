# วิธี Deploy และ Docker Hub

## ชื่อ image กลาง

ทุก image ใช้ Docker Hub namespace เดียวกันและชื่อ repository ตามนี้:

| Service | Image |
|---|---|
| Gateway/Web | `registration-gateway` |
| User/Auth | `registration-auth` |
| Course | `registration-course` |
| Enrollment | `registration-enrollment` |
| Notification | `registration-notification` |

ตัวอย่างชื่อเต็มคือ `<DOCKERHUB_USERNAME>/registration-gateway:latest`.

## ตั้งค่าอัตโนมัติครั้งเดียว

Windsurf หรือ repo admin เลือก Docker Hub namespace ของกลุ่ม และเพิ่ม GitHub Actions repository secrets ที่ **Settings → Secrets and variables → Actions**:

- `DOCKERHUB_USERNAME`: Docker Hub namespace/username
- `DOCKERHUB_TOKEN`: Docker Hub access token ที่มีสิทธิ์ push image

Safe ดูแล release workflow; Sea ดูแล CI workflow. ห้ามวาง token ใน `.env`, source code, workflow YAML หรือ commit ใด ๆ

## วิธีที่ 1: ให้ GitHub Actions push อัตโนมัติ (แนะนำ)

1. สมาชิกเปิด Pull Request; CI จะ install, build, run tests และลอง build image โดยยังไม่ push
2. หลัง merge การเปลี่ยนแปลง service เข้า `main`, workflow ของ service นั้นจะ push image เป็น `latest` และ commit SHA
3. เมื่อพร้อมออก version ให้สร้างและ push Git tag เช่น `v0.1.0`; `release-images.yml` จะ build/test และ push image ทั้งห้าเป็น `v0.1.0` และ `latest`
4. ตรวจผลที่แท็บ **Actions** และหน้า Docker Hub ของ namespace กลุ่ม

## วิธีที่ 2: Build และ push ด้วยตนเอง

ใช้เมื่อได้รับสิทธิ์จากกลุ่มและต้องการเผยแพร่เฉพาะ image ที่ตนรับผิดชอบ:

```bash
docker login -u <DOCKERHUB_USERNAME>
docker build -t <DOCKERHUB_USERNAME>/registration-gateway:v0.1.0 ./services/gateway-web
docker push <DOCKERHUB_USERNAME>/registration-gateway:v0.1.0
```

ทำซ้ำโดยเปลี่ยน image name และ build context ให้ตรงกับบริการของตน อย่าใส่ access token ในคำสั่งหรือไฟล์ที่ commit; `docker login` จะถามรหัสผ่าน/token แบบโต้ตอบ

## เปิดระบบจาก image ที่เผยแพร่

1. สร้างไฟล์ `.env` ที่ root จาก `.env.example` และกำหนด `DOCKERHUB_USERNAME` กับ `IMAGE_TAG` เช่น `v0.1.0`
2. ดึงและเปิด image ทั้งชุด:

```bash
docker compose --env-file .env -f deploy/docker-compose.release.yml pull
docker compose --env-file .env -f deploy/docker-compose.release.yml up -d
docker compose --env-file .env -f deploy/docker-compose.release.yml ps
```

3. เปิด `http://localhost:8080` และตรวจ `GET /health`; หยุดระบบด้วย:

```bash
docker compose --env-file .env -f deploy/docker-compose.release.yml down
```

ห้าม commit `.env`. สำหรับพัฒนาในเครื่อง ใช้ `docker compose up --build -d` ที่ root หลังทุก service มี Dockerfile แล้ว
