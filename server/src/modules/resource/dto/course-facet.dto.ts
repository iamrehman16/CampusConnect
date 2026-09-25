/** One course in the Library's course filter (GET /resources/courses). */
export class CourseFacetDto {
  course: string;
  subject: string;
  /** Approved resources for this course. */
  count: number;
}
