/**
 * Centralized route path constants.
 * Always import from here — never hardcode paths in components.
 */
export const ROUTES = {
  AUTH: "/auth",
  HOME: "/",
  RESOURCES: "/resources",
  RESOURCE_DETAIL: "/resources/:id",
  AI_CHAT: "/ai",
  CHAT: "/chat",
  COMMUNITY: "/community",
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
  SETTINGS: "/profile?tab=settings",
  ONBOARDING: "/onboarding",
  FAQ:"/faq"
} as const;
