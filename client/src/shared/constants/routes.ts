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
  CONTRIBUTORS: "/contributors",
  ONBOARDING: "/onboarding",
  FAQ:"/faq"
} as const;
