import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import PublicRoute from "@/app/routes/PublicRoute";
import RoleRoute from "@/app/routes/RoleRoute";
import AppLayout from "@/shared/components/layout/AppLayout";
import MainLayout from "@/shared/components/layout/MainLayout";
import { RouteErrorPage } from "@/shared/components/feedback/PageErrorBoundary";
import { UserRole } from "@/shared/types/enums";
import SuspenseWrapper from "./SuspenseWrapper";

// ── Eager-loaded (first paint) ──────────────────────────────────────
import LandingPage from "@/features/auth/pages/LandingPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignupPage from "@/features/auth/pages/SignupPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import OnboardingRoute from "./routes/OnboardingRoute";
import MentorsLayout, {
  LegacyMentorshipRedirect,
} from "@/features/mentorship/pages/MentorsLayout";

// ── Lazy-loaded (code-split) ────────────────────────────────────────
const ResourcePage = lazy(
  () => import("@/features/resources/pages/ResourcePage"),
);
const ResourceDetailPage = lazy(
  () => import("@/features/resources/pages/ResourceDetailPage"),
);
const AiChatPage = lazy(() => import("@/features/ai-chat/pages/AiChatPage"));
const AiChatLayout = lazy(
  () => import("@/features/ai-chat/pages/AiChatLayout"),
);
const ConversationsPage = lazy(
  () => import("@/features/chat/pages/ConversationsPage"),
);

const ConversationPage = lazy(
  () => import("@/features/chat/pages/ConversationPage"),
);

const ChatEmptyState = lazy(
  () => import("@/features/chat/components/ChatEmptyState"),
);

const CommunityPage = lazy(
  () => import("@/features/community/pages/CommunityPage"),
);

const MentorshipPage = lazy(
  () => import("@/features/mentorship/pages/MentorshipPage"),
);
const MentorDirectoryPage = lazy(
  () => import("@/features/contributors/pages/MentorDirectoryPage"),
);

const ProfilePage = lazy(() => import("@/features/user/pages/ProfilePage"));
const SettingsPage = lazy(() => import("@/features/user/pages/SettingsPage"));
const PublicProfilePage = lazy(
  () => import("@/features/user/pages/PublicProfilePage"),
);
// Admin pages — completely isolated bundle
const AdminDashboardPage = lazy(
  () => import("@/features/admin/pages/AdminDashboardPage"),
);

// add to lazy imports
const OnboardingPage = lazy(
  () => import("@/features/auth/pages/OnboardingPage"),
);

const LeaderboardPage = lazy(
  () => import("@/features/reputation/pages/LeaderboardPage"),
);

const FaqPage = lazy(
  () => import("@/features/info/pages/FAQPage"),
);


/**
 * Application route definitions.
 */
const router = createBrowserRouter([
  // ── Public routes (redirect if already authenticated) ─────────
  {
    element: <PublicRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: ROUTES.AUTH,
        element: <LandingPage />,
      },
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.SIGNUP, element: <SignupPage /> },
    ],
  },

  {
    element: <OnboardingRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: ROUTES.ONBOARDING,
        element: (
          <SuspenseWrapper>
            <OnboardingPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  // ── Protected routes (require authentication) ─────────────────
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Dashboard (home)
          {
            path: ROUTES.HOME,
            element: <DashboardPage />,
          },

          // Resources
          {
            path: ROUTES.RESOURCES,
            element: (
              <SuspenseWrapper>
                <MainLayout>
                  <ResourcePage />
                </MainLayout>
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTES.RESOURCE_DETAIL,
            element: (
              <SuspenseWrapper>
                <ResourceDetailPage />
              </SuspenseWrapper>
            ),
          },

          // AI Chat
          {
            path: ROUTES.AI_CHAT,
            element: (
              <SuspenseWrapper>
                <AiChatLayout />
              </SuspenseWrapper>
            ),
            children: [
              { index: true, element: <AiChatPage /> },
              { path: ":conversationId", element: <AiChatPage /> },
            ],
          },

          // Real-time Chat
          // Real-time Chat
          {
            path: ROUTES.CHAT,
            element: (
              <SuspenseWrapper>
                <ConversationsPage />
              </SuspenseWrapper>
            ),
            children: [
              {
                index: true,
                element: <ChatEmptyState />,
              },
              {
                path: ":conversationId",
                element: (
                  <SuspenseWrapper>
                    <ConversationPage />
                  </SuspenseWrapper>
                ),
              },
            ],
          },

          // Community
          {
            path: ROUTES.COMMUNITY,
            element: (
              <SuspenseWrapper>
                <CommunityPage />
              </SuspenseWrapper>
            ),
          },

          // Leaderboard (BACKLOG.md E15)
          {
            path: ROUTES.LEADERBOARD,
            element: (
              <SuspenseWrapper>
                <LeaderboardPage />
              </SuspenseWrapper>
            ),
          },

          // Profile
          {
            path: ROUTES.PROFILE,
            element: (
              <SuspenseWrapper>
                <ProfilePage />
              </SuspenseWrapper>
            ),
          },

          {
            path: ROUTES.SETTINGS,
            element: (
              <SuspenseWrapper>
                <SettingsPage />
              </SuspenseWrapper>
            ),
          },

          {
            path: ROUTES.PUBLIC_PROFILE,
            element: (
              <SuspenseWrapper>
                <PublicProfilePage />
              </SuspenseWrapper>
            ),
          },

          // Mentors section (BACKLOG.md D5): directory + both sides of
          // mentorship under one nav item, three tabs.
          {
            path: ROUTES.MENTORS,
            element: <MentorsLayout />,
            children: [
              {
                index: true,
                element: (
                  <SuspenseWrapper>
                    <MentorDirectoryPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: "mine",
                element: (
                  <SuspenseWrapper>
                    <MentorshipPage view="mentee" />
                  </SuspenseWrapper>
                ),
              },
              {
                path: "mentoring",
                element: (
                  <SuspenseWrapper>
                    <MentorshipPage view="mentor" />
                  </SuspenseWrapper>
                ),
              },
            ],
          },
          // Pre-D5 URLs (bookmarks, notifications already stored in the DB).
          {
            path: ROUTES.CONTRIBUTORS,
            element: <Navigate to={ROUTES.MENTORS} replace />,
          },
          {
            path: ROUTES.MENTORSHIP,
            element: <LegacyMentorshipRedirect />,
          },

          {
            path: ROUTES.FAQ,
            element: (
              <SuspenseWrapper>
                <MainLayout>
                  <FaqPage />
                </MainLayout>
              </SuspenseWrapper>
            ),
          },


          // ── Admin routes (role-gated) ─────────────────────────
          {
            element: <RoleRoute allowedRoles={[UserRole.ADMIN]} />,
            children: [
              {
                path: ROUTES.ADMIN,
                element: (
                  <SuspenseWrapper>
                    <AdminDashboardPage />
                  </SuspenseWrapper>
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  // ── Catch-all redirect ────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to={ROUTES.HOME} replace />,
  },
]);

export default router;
