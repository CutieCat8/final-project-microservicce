export interface ConfirmationInput {
  enrollmentId: string;
  studentId: string;
  courseId: string;
}

export function createConfirmation(input: ConfirmationInput, now = new Date()) {
  const { enrollmentId, studentId, courseId } = input;
  return {
    enrollmentId,
    message: `นักศึกษา ${studentId} ลงทะเบียนวิชา ${courseId} สำเร็จ (รหัสการลงทะเบียน: ${enrollmentId})`,
    createdAt: now.toISOString(),
  };
}
