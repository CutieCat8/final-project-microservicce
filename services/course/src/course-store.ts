export interface Course {
  courseId: string;
  name: string;
  description: string;
}

export const INITIAL_COURSES: readonly Course[] = Object.freeze([
  {
    courseId: 'CS101',
    name: 'Introduction to Computing',
    description: 'Fundamentals of computer programming, algorithms, and systems.'
  },
  {
    courseId: 'CS102',
    name: 'Data Structures and Algorithms',
    description: 'Design, analysis, and implementation of core data structures.'
  },
  {
    courseId: 'CS103',
    name: 'Database Systems',
    description: 'Relational database design, SQL querying, and transaction processing.'
  },
  {
    courseId: 'CS104',
    name: 'Web and Cloud Computing',
    description: 'Web development, microservice architecture, and cloud deployment.'
  }
]);

export class CourseStore {
  private readonly courses: Map<string, Course>;

  constructor(initialCourses: readonly Course[] = INITIAL_COURSES) {
    this.courses = new Map();
    for (const c of initialCourses) {
      this.courses.set(c.courseId, { ...c });
    }
  }

  list(term?: string): Course[] {
    const all = Array.from(this.courses.values());
    if (!term || !term.trim()) return all;

    const query = term.trim().toLowerCase();
    return all.filter(
      (c) =>
        c.courseId.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );
  }

  findById(courseId: string): Course | undefined {
    const course = this.courses.get(courseId);
    return course ? { ...course } : undefined;
  }

  create(course: Course): Course {
    const entry = { ...course };
    this.courses.set(entry.courseId, entry);
    return { ...entry };
  }

  update(courseId: string, updates: Partial<Omit<Course, 'courseId'>>): Course | undefined {
    const existing = this.courses.get(courseId);
    if (!existing) return undefined;
    const updated: Course = {
      ...existing,
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {})
    };
    this.courses.set(courseId, updated);
    return { ...updated };
  }
}
