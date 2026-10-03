/**
 * Centralized route path constants.
 * Always import from here — never hardcode paths in components.
 */
export const ROUTES = {
  /** Public landing (unauthenticated users are sent here). */
  AUTH: "/auth",
  LOGIN: "/login",
  SIGNUP: "/signup",
  /** Where the server sends the browser back after Google (BACKLOG.md F2/F3). */
  GOOGLE_CALLBACK: "/auth/google/callback",
  HOME: "/",
  RESOURCES: "/resources",
  RESOURCE_DETAIL: "/resources/:id",
  AI_CHAT: "/ai",
  CHAT: "/chat",
  COMMUNITY: "/community",
  LEADERBOARD: "/leaderboard",
  PROFILE: "/profile",
  PUBLIC_PROFILE: "/profile/:userId",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_RESOURCES: "/admin/resources",
  // Mentors section (BACKLOG.md D5 — directory + mentorship merged).
  MENTORS: "/mentors",
  MY_MENTORS: "/mentors/mine",
  MENTORING: "/mentors/mentoring",
  /** Legacy — redirect to MENTORS / MY_MENTORS / MENTORING. */
  CONTRIBUTORS: "/contributors",
  MENTORSHIP: "/mentorship",
  SETTINGS: "/settings",
  ONBOARDING: "/onboarding",
  FAQ:"/faq"
} as const;
