// src/router/routeConfig.ts
import { ROUTES } from "@/shared/constants/routes";

// Destructure into local constants for readability.
// These hold the actual pathname strings, e.g. ROUTES.HOME === "/"
const home = ROUTES.HOME;
const resources = ROUTES.RESOURCES;
const community = ROUTES.COMMUNITY;
const profile = ROUTES.PROFILE;
const chats = ROUTES.CHAT;
const contributors = ROUTES.CONTRIBUTORS;
const aichat = ROUTES.AI_CHAT;

// Dynamic segment: the chat list route + a :id param appended.
// We build this here rather than in ROUTES because ROUTES holds base paths —
// the ":id" suffix is a routeConfig concern, not a navigation-link concern.
const chat = ROUTES.CHAT + "/:conversationId";

export type TopBarMode = "standard" | "contextual" | "immersive";

export interface RouteConfig {
  title: string;
  topBarMode: TopBarMode;
  showBottomNav: boolean;
}

/**
 * Computed property keys [ ] are the critical detail here.
 *
 * Without brackets:  { home: {...} }   → key is the string "home"
 * With brackets:     { [home]: {...} } → key is the VALUE of the variable home (e.g. "/")
 *
 * getRouteConfig receives real pathnames like "/resources".
 * The lookup only works if the keys are also real pathnames.
 */
const routeConfig: Record<string, RouteConfig> = {
  // ── Standard pages ───────────────────────────────────────────────────────────
  [home]: {
    title: "CampusConnect",
    topBarMode: "standard",
    showBottomNav: true,
  },
  [resources]: {
    title: "Resources",
    topBarMode: "standard",
    showBottomNav: true,
  },
  [community]: {
    title: "Community",
    topBarMode: "standard",
    showBottomNav: true,
  },
  [profile]: {
    title: "Profile",
    topBarMode: "standard",
    showBottomNav: true,
  },

  // ── Contextual sub-pages ─────────────────────────────────────────────────────
  [chats]: {
    title: "Messages",
    topBarMode: "contextual",
    showBottomNav: true,
  },
  [contributors]: {
    title: "Contributors",
    topBarMode: "contextual",
    showBottomNav: true,
  },

  // ── Immersive pages ──────────────────────────────────────────────────────────
  [chat]: {
    title: "",
    topBarMode: "immersive",
    showBottomNav: false,
  },
  [aichat]: {
    title: "",
    topBarMode: "immersive",
    showBottomNav: false,
  },
};

/**
 * Resolves a live pathname to its RouteConfig.
 *
 * Three-stage strategy:
 * 1. Exact match  → static routes, O(1)
 * 2. Pattern match → dynamic segments like /chat/:id
 * 3. Fallback     → unknown routes never crash the shell
 */
export function getRouteConfig(pathname: string): RouteConfig {
  // 1. Exact match.
  if (routeConfig[pathname]) {
    return routeConfig[pathname];
  }

  // 2. Pattern match for dynamic segments.
  const pathnameSegments = pathname.split("/").filter(Boolean);

  for (const pattern of Object.keys(routeConfig)) {
    const patternSegments = pattern.split("/").filter(Boolean);

    if (patternSegments.length !== pathnameSegments.length) continue;

    const matches = patternSegments.every((seg, i) =>
      seg.startsWith(":")
        ? pathnameSegments[i].length > 0
        : seg === pathnameSegments[i],
    );

    if (matches) return routeConfig[pattern];
  }

  // 3. Fallback — uses the home variable, not a hardcoded "/".
  return routeConfig[home];
}
