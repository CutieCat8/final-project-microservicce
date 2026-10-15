import type { ServiceUrls } from './config';
import { HttpError } from './errors';
import type { Enrollment, EnrollmentStore } from './enrollment-store';
import { validateEnrollment, validateStudentId } from './validation';

const UPSTREAM_TIMEOUT_MS = 5_000;

export class EnrollmentService {
  constructor(
    private readonly store: EnrollmentStore,
    private readonly urls: ServiceUrls
  ) {}

  async enroll(body: unknown): Promise<Enrollment> {
    const { studentId, courseId } = validateEnrollment(body);
    await this.ensureCourseExists(courseId);
    const enrollment = this.store.create(studentId, courseId);
    await this.notify(enrollment);
    return enrollment;
  }

  list(studentId: unknown): Enrollment[] {
    return this.store.listByStudent(validateStudentId(studentId));
  }

  private async ensureCourseExists(courseId: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${this.urls.course}/api/courses/${encodeURIComponent(courseId)}`, {
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      });
    } catch {
      throw new HttpError(502, 'COURSE_SERVICE_UNAVAILABLE', 'Course service is unavailable.');
    }
    await response.body?.cancel();
    if (response.status === 404) throw new HttpError(404, 'COURSE_NOT_FOUND', 'Course not found.');
    if (!response.ok) throw new HttpError(502, 'COURSE_SERVICE_UNAVAILABLE', 'Course service is unavailable.');
  }

  // The enrollment is already saved, so a Notification outage must not turn it into an error.
  private async notify(enrollment: Enrollment): Promise<void> {
    try {
      const response = await fetch(`${this.urls.notification}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: enrollment.enrollmentId,
          studentId: enrollment.studentId,
          courseId: enrollment.courseId
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      });
      await response.body?.cancel();
      if (!response.ok) console.error(`Notification service rejected enrollment notice (${response.status}).`);
    } catch {
      console.error('Notification service is unavailable; enrollment kept without notice.');
    }
  }
}
