import request from "supertest";
import app from "../src/app";

describe("Notification Service", () => {
  // ──────────────────────────────────────────────────────────
  // Test 1: Health Check — ตรวจว่า service พร้อมใช้งาน
  // ──────────────────────────────────────────────────────────
  describe("GET /health", () => {
    it("ควรตอบ status ok และชื่อ service", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: "ok",
        service: "notification",
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  // Test 2: สร้างข้อความยืนยันสำเร็จ
  // ──────────────────────────────────────────────────────────
  describe("POST /api/notifications", () => {
    it("ควรสร้างข้อความยืนยันเมื่อมีข้อมูลครบ", async () => {
      const res = await request(app).post("/api/notifications").send({
        enrollmentId: "E001",
        studentId: "S001",
        courseId: "CS101",
      });

      expect(res.status).toBe(201);
      expect(res.body.notification).toBeDefined();
      expect(res.body.notification.enrollmentId).toBe("E001");
      expect(res.body.notification.message).toContain("S001");
      expect(res.body.notification.message).toContain("CS101");
      expect(res.body.notification.createdAt).toBeDefined();
    });

    it("ควรตอบ 400 เมื่อขาดข้อมูลที่จำเป็น", async () => {
      const res = await request(app).post("/api/notifications").send({
        enrollmentId: "E002",
        // ขาด studentId และ courseId
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("MISSING_FIELDS");
    });
  });

  // ──────────────────────────────────────────────────────────
  // Test 3: ดึงข้อความยืนยันด้วย enrollmentId
  // ──────────────────────────────────────────────────────────
  describe("GET /api/notifications/:enrollmentId", () => {
    it("ควรดึงข้อความยืนยันที่สร้างไว้แล้ว", async () => {
      // สร้างข้อความยืนยันก่อน
      await request(app).post("/api/notifications").send({
        enrollmentId: "E010",
        studentId: "S010",
        courseId: "CS202",
      });

      // ดึงข้อความ
      const res = await request(app).get("/api/notifications/E010");

      expect(res.status).toBe(200);
      expect(res.body.notification.enrollmentId).toBe("E010");
      expect(res.body.notification.message).toContain("ลงทะเบียน");
    });

    it("ควรตอบ 404 เมื่อไม่พบ enrollmentId", async () => {
      const res = await request(app).get("/api/notifications/UNKNOWN");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
