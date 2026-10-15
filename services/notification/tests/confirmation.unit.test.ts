import { createConfirmation } from "../src/confirmation";

describe("ข้อความยืนยันการลงทะเบียน", () => {
  it("ระบุนักศึกษา วิชา รหัสการลงทะเบียน และเวลาที่สร้างได้ถูกต้อง", () => {
    const result = createConfirmation(
      { enrollmentId: "E001", studentId: "S001", courseId: "CS101" },
      new Date("2026-10-16T00:00:00.000Z"),
    );
    expect(result).toEqual({
      enrollmentId: "E001",
      message: "นักศึกษา S001 ลงทะเบียนวิชา CS101 สำเร็จ (รหัสการลงทะเบียน: E001)",
      createdAt: "2026-10-16T00:00:00.000Z",
    });
  });

  it("สร้างข้อความแยกตามรายการโดยไม่แก้ข้อมูลต้นทาง", () => {
    const input = Object.freeze({ enrollmentId: "E002", studentId: "S002", courseId: "CS202" });
    const result = createConfirmation(input);
    expect(result.enrollmentId).toBe("E002");
    expect(result.message).toContain("S002 ลงทะเบียนวิชา CS202 สำเร็จ");
    expect(Number.isNaN(Date.parse(result.createdAt))).toBe(false);
  });
});
