/** The slice of a Google profile the app cares about (BACKLOG.md F1/F2). */
export interface GoogleProfile {
  googleId: string;
  /** Lower-cased. */
  email: string;
  emailVerified: boolean;
  name: string;
}
