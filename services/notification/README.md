# Notification Service — ส่งต่องาน Safe

สถานะตรวจ: 16 ตุลาคม 2026 รูปแบบ API ด้านล่างตรงกับโค้ดปัจจุบัน แต่ยังรอ Yuri และ Windsurf ยืนยันร่วมกัน

## การเชื่อมต่อ

- พอร์ต `3000` ปรับด้วย environment variable `PORT`
- URL ภายใน Compose: `http://notification:3000`
- Image: `<namespace กลุ่ม>/registration-notification:<version>`
- `GET /health` → `200 {"status":"ok","service":"notification"}`
- ไม่ต้องใช้ credentials ของอีเมลหรือ SMS

## สร้างข้อความยืนยัน

Enrollment เรียกหลังลงทะเบียนสำเร็จ: `POST /api/notifications`
Header: `Content-Type: application/json`

```json
{"enrollmentId":"E001","studentId":"S001","courseId":"CS101"}
```

ตอบ `201`:

```json
{
  "notification": {
    "enrollmentId": "E001",
    "message": "นักศึกษา S001 ลงทะเบียนวิชา CS101 สำเร็จ (รหัสการลงทะเบียน: E001)",
    "createdAt": "2026-10-16T00:00:00.000Z"
  }
}
```

createdAt เป็นเวลาจริงรูปแบบ ISO 8601 Gateway ใช้ notification.message แสดงหน้าเว็บได้ แต่รูปแบบการส่งต่อผ่าน Enrollment ยังรอทีมยืนยัน

เมื่อขาดค่าที่จำเป็น ตอบ `400`:

```json
{"error":{"code":"MISSING_FIELDS","message":"ต้องระบุ enrollmentId, studentId และ courseId"}}
```

## อ่านข้อความ

`GET /api/notifications/E001` → `200` พร้อม JSON รูปแบบเดียวกับตอนสร้าง
หากไม่พบ ตอบ `404`:

```json
{"error":{"code":"NOT_FOUND","message":"ไม่พบข้อความยืนยันสำหรับ enrollmentId: E001"}}
```

ข้อมูลเก็บใน memory หายเมื่อ restart และ enrollmentId เดิมจะทับรายการเดิม เวอร์ชันนี้ไม่ส่งอีเมลหรือ SMS จริง

## ตรวจสอบในโฟลเดอร์ services/notification

```sh
npm ci
npm run build
npm run test:unit
npm test -- --runInBand
npm run test:docker
```

npm test รวม Unit Test และ HTTP tests เดิมทั้งหมด
npm run test:docker build image แล้วเปิด container ชั่วคราว ตรวจ health → POST → GET ผ่าน HTTP และลบ container เมื่อจบ โดยไม่ publish พอร์ตบนเครื่อง

## ผลตรวจล่าสุด

| รายการ | ผล |
|---|---|
| TypeScript build | ผ่าน |
| Unit Test ข้อความยืนยัน | ผ่าน 2/2 |
| HTTP tests เดิม | ยังยืนยันไม่ได้: sandbox ไม่อนุญาต listen (`EPERM`) ทั้ง 5 กรณี |
| Docker script syntax | ผ่าน sh -n |
| Docker build/runtime | ยังยืนยันไม่ได้: sandbox เข้า Docker socket ไม่ได้ |
| Enrollment → Notification → เว็บ | ยังไม่ได้ทดสอบ ไม่มีโค้ด Enrollment/Gateway ใน checkout นี้ |
| Release ทั้ง 5 images | ยังไม่มีหลักฐาน Actions/Docker Hub ที่ตรวจยืนยัน |

## รายการส่งต่อทีม

1. Yuri ยืนยันว่าจะส่ง enrollmentId, studentId, courseId และกำหนดพฤติกรรมเมื่อ Notification ล้มเหลว
2. Windsurf ยืนยันการส่งต่อ JSON และการแสดง notification.message บนเว็บ
3. เมื่อรวมโค้ด ทดสอบลงทะเบียนผ่าน Gateway ตรวจข้อความและ GET notification ด้วย enrollmentId เดียวกัน พร้อมบันทึกผล
4. ทดสอบข้อมูลขาดและไม่พบ enrollmentId
5. รัน HTTP tests และ Docker smoke test ใน Terminal/CI ที่เข้าถึงพอร์ตและ Docker ได้ แล้วบันทึกผลจริง
6. เมื่อทุก service พร้อม ตรวจ Secrets DOCKERHUB_USERNAME และ DOCKERHUB_TOKEN ของกลุ่ม รวมถึงผล release workflow ทั้ง 5 images พร้อม version tag

Safe ดูแล .github/workflows/release-images.yml ซึ่งปัจจุบันทำงานเมื่อ push tag v* ต้องตรวจ run ที่ตรงกับ tag จริงก่อนติ๊กเผยแพร่สำเร็จ
