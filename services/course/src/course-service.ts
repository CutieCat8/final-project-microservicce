import type { Course, CourseStore } from './course-store';
import { HttpError } from './errors';
import { validateCourseId, validateCourseInput } from './validation';

export class CourseService {
  constructor(private readonly store: CourseStore) {}

  list(term?: string): Course[] {
    return this.store.list(term);
  }

  get(rawCourseId: unknown): Course {
    const courseId = validateCourseId(rawCourseId);
    const course = this.store.findById(courseId);
    if (!course) {
      throw new HttpError(404, 'COURSE_NOT_FOUND', `Course '${courseId}' not found.`);
    }
    return course;
  }

  create(body: unknown): Course {
    const input = validateCourseInput(body);
    const existing = this.store.findById(input.courseId);
    if (existing) {
      throw new HttpError(409, 'COURSE_ALREADY_EXISTS', `Course '${input.courseId}' already exists.`);
    }
    return this.store.create(input);
  }
}
