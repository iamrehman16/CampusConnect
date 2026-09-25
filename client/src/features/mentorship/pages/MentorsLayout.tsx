import { Navigate, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { ROUTES } from "@/shared/constants/routes";
import { usePendingRequestCount } from "../hooks/mentorship.hooks";

const TABS = [
  { path: ROUTES.MENTORS, label: "Find a mentor" },
  { path: ROUTES.MY_MENTORS, label: "My mentors" },
  { path: ROUTES.MENTORING, label: "Mentoring" },
] as const;

/**
 * The Mentors section (BACKLOG.md D5): the mentor directory and both sides
 * of the mentorship lifecycle used to be two top-level nav items
 * ("Mentors", "Mentorship"). One section, three tabs.
 */
export default function MentorsLayout() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { data: pending = 0 } = usePendingRequestCount();
  const current = TABS.find((t) => t.path === pathname)?.path ?? ROUTES.MENTORS;

  return (
    <PageContainer width="default">
      <PageHeader
        title="Mentors"
        subtitle="Find a senior or contributor who can help, and keep track of your mentorships."
      >
        <Tabs
          value={current}
          onChange={(_, path: string) => navigate(path)}
          aria-label="Mentors sections"
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {TABS.map((t) => (
            <Tab
              key={t.path}
              value={t.path}
              label={t.path === ROUTES.MENTORING && pending > 0 ? `${t.label} · ${pending}` : t.label}
            />
          ))}
        </Tabs>
      </PageHeader>
      {/* key: reset per-tab scroll/filter state when switching tabs */}
      <Outlet key={pathname + (pathname === ROUTES.MENTORS ? search : "")} />
    </PageContainer>
  );
}

/**
 * Legacy /mentorship?tab=mentor|mentee[&section=…] links (old bookmarks and
 * notifications created before D5) → the matching Mentors tab.
 */
export function LegacyMentorshipRedirect() {
  const [params] = useSearchParams();
  const target = params.get("tab") === "mentee" ? ROUTES.MY_MENTORS : ROUTES.MENTORING;
  const section = params.get("section");
  return <Navigate to={section ? `${target}?section=${section}` : target} replace />;
}
