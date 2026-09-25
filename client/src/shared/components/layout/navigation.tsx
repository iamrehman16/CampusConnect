import type { ReactNode } from "react";
import { ROUTES } from "@/shared/constants/routes";
import {
  Dashboard,
  LibraryBooks,
  SmartToyOutlined,
  Chat,
  People,
  Forum,
  AdminPanelSettings,
} from "@/shared/icons";
import { useTotalUnread } from "@/features/chat/hooks/chat-hooks";
import { usePendingRequestCount } from "@/features/mentorship/hooks/mentorship.hooks";

/**
 * Single source of truth for app navigation (BACKLOG.md D5). Sidebar and
 * bottom nav both render from this list, so labels, icons, order and
 * badges can't drift apart.
 *
 * IA decision: 5 primary destinations on every device — Home, Library,
 * Ask AI, Messages, Mentors. Community is a 6th item on desktop, where
 * the sidebar has room; on mobile the bottom bar stays at 5 (the
 * comfortable maximum for thumb targets) and Community is reached from
 * Home and the account menu.
 */
export type NavBadge = "messages" | "mentorRequests";

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: NavBadge;
  /** Hidden from the mobile bottom bar (still in the sidebar). */
  desktopOnly?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { key: "home", label: "Home", icon: <Dashboard />, path: ROUTES.HOME },
  { key: "library", label: "Library", icon: <LibraryBooks />, path: ROUTES.RESOURCES },
  { key: "ai", label: "Ask AI", icon: <SmartToyOutlined />, path: ROUTES.AI_CHAT },
  { key: "messages", label: "Messages", icon: <Chat />, path: ROUTES.CHAT, badge: "messages" },
  { key: "mentors", label: "Mentors", icon: <People />, path: ROUTES.MENTORS, badge: "mentorRequests" },
  { key: "community", label: "Community", icon: <Forum />, path: ROUTES.COMMUNITY, desktopOnly: true },
];

export const ADMIN_NAV: NavItem = {
  key: "admin",
  label: "Admin",
  icon: <AdminPanelSettings />,
  path: ROUTES.ADMIN,
};

/** Whether `path` is the active section for the current location. */
export function isNavActive(pathname: string, path: string): boolean {
  if (path === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Badge counts for nav items, fetched once per render tree. */
export function useNavBadges(): Record<NavBadge, number> {
  const messages = useTotalUnread();
  const { data: mentorRequests = 0 } = usePendingRequestCount();
  return { messages, mentorRequests };
}
