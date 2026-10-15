import { randomUUID } from 'node:crypto';
import { HttpError } from './errors';

export interface Enrollment {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  status: 'confirmed';
}

export class EnrollmentStore {
  private readonly enrollments = new Map<string, Enrollment>();

  private static key(studentId: string, courseId: string): string {
    return `${studentId}\u0000${courseId}`;
  }

  create(studentId: string, courseId: string): Enrollment {
    // Keep duplicate check and insertion synchronous: parallel requests cannot enroll twice.
    const key = EnrollmentStore.key(studentId, courseId);
    if (this.enrollments.has(key)) {
      throw new HttpError(409, 'ENROLLMENT_EXISTS', 'Student is already enrolled in this course.');
    }
    const enrollment: Enrollment = { enrollmentId: `E${randomUUID()}`, studentId, courseId, status: 'confirmed' };
    this.enrollments.set(key, enrollment);
    return { ...enrollment };
  }

  listByStudent(studentId: string): Enrollment[] {
    return [...this.enrollments.values()]
      .filter((enrollment) => enrollment.studentId === studentId)
      .map((enrollment) => ({ ...enrollment }));
  }
}
