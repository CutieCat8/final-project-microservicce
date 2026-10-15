import express, { Request, Response } from "express";

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(express.json());

// ── ข้อมูลจำลอง (mock) ─────────────────────────────────────
// เก็บ notification ไว้ใน memory เพื่อจำลองการทำงาน
// key = enrollmentId, value = notification object
const notifications: Map<
  string,
  { enrollmentId: string; message: string; createdAt: string }
> = new Map();

// ── Health Check ─────────────────────────────────────────────
// ทุก service ต้องมี GET /health เพื่อให้ Docker Compose
// และ Gateway ตรวจว่า service พร้อมใช้งาน
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "notification" });
});

// ── POST /api/notifications ──────────────────────────────────
// Enrollment Service เรียก endpoint นี้หลังลงทะเบียนสำเร็จ
// เพื่อสร้างข้อความยืนยัน (mock — ไม่ส่งอีเมล/SMS จริง)
app.post("/api/notifications", (req: Request, res: Response) => {
  const { enrollmentId, studentId, courseId } = req.body;

  // ตรวจว่ามีข้อมูลครบ
  if (!enrollmentId || !studentId || !courseId) {
    res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "ต้องระบุ enrollmentId, studentId และ courseId",
      },
    });
    return;
  }

  // สร้างข้อความยืนยันแบบจำลอง
  const notification = {
    enrollmentId,
    message: `นักศึกษา ${studentId} ลงทะเบียนวิชา ${courseId} สำเร็จ (รหัสการลงทะเบียน: ${enrollmentId})`,
    createdAt: new Date().toISOString(),
  };

  // เก็บไว้ใน memory เพื่อให้ดึงดูได้ทีหลัง
  notifications.set(enrollmentId, notification);

  res.status(201).json({ notification });
});

// ── GET /api/notifications/:enrollmentId ─────────────────────
// Gateway หรือ client เรียก endpoint นี้เพื่อดูข้อความยืนยัน
app.get("/api/notifications/:enrollmentId", (req: Request, res: Response) => {
  const enrollmentId = req.params.enrollmentId as string;
  const notification = notifications.get(enrollmentId);

  if (!notification) {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `ไม่พบข้อความยืนยันสำหรับ enrollmentId: ${enrollmentId}`,
      },
    });
    return;
  }

  res.json({ notification });
});

export default app;
