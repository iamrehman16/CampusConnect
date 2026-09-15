import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import PublicRoute from "@/app/routes/PublicRoute";
import RoleRoute from "@/app/routes/RoleRoute";
import AppLayout from "@/shared/components/layout/AppLayout";
import MainLayout from "@/shared/components/layout/MainLayout";
import LoadingScreen from "@/shared/components/feedback/LoadingScreen";
import { UserRole } from "@/shared/types/enums";

// ── Eager-loaded (first paint) ──────────────────────────────────────
import AuthPage from "@/features/auth/pages/AuthPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import OnboardingRoute from "./routes/OnboardingRoute";

// ── Lazy-loaded (code-split) ────────────────────────────────────────
const ResourcePage = lazy(
  () => import("@/features/resources/pages/ResourcePage"),
);
const ResourceDetailPage = lazy(
  () => import("@/features/resources/pages/ResourceDetailPage"),
);
const AiChatPage = lazy(() => import("@/features/ai-chat/pages/AiChatPage"));
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

const ContributorsPage = lazy(
  () => import("@/features/contributors/pages/ContributorsPage"),
);

const ProfilePage = lazy(() => import("@/features/user/pages/ProfilePage"));
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

const FaqPage = lazy(
  () => import("@/features/info/pages/FAQPage"),
);


/**
 * Wraps a lazy component with Suspense fallback.
 */
function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

/**
 * Application route definitions.
 */
const router = createBrowserRouter([
  // ── Public routes (redirect if already authenticated) ─────────
  {
    element: <PublicRoute />,
    children: [
      {
        path: ROUTES.AUTH,
        element: <AuthPage />,
      },
    ],
  },

  {
    element: <OnboardingRoute />,
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
                <AiChatPage />
              </SuspenseWrapper>
            ),
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

          // Profile
          {
            path: ROUTES.PROFILE,
            element: (
              <SuspenseWrapper>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </SuspenseWrapper>
            ),
          },

          {
            path: ROUTES.PUBLIC_PROFILE,
            element: (
              <SuspenseWrapper>
                <MainLayout>
                  <PublicProfilePage />
                </MainLayout>
              </SuspenseWrapper>
            ),
          },

          {
            path: ROUTES.CONTRIBUTORS,
            element: (
              <SuspenseWrapper>
                <MainLayout>
                  <ContributorsPage />
                </MainLayout>
              </SuspenseWrapper>
            ),
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
