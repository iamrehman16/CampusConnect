import { useCallback, useRef } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { useAuth } from "@/shared/hooks/useAuth";
import { useUserProfile } from "@/features/user/hooks/profile-hooks";
import { MentorshipCard } from "../components/MentorshipCard";
import {
  useMentorships,
  usePendingRequestCount,
} from "../hooks/mentorship.hooks";
import {
  PAST_STATUSES,
  type MentorshipStatus,
  type MentorshipView,
} from "../types/mentorship.dto";

type Section = "pending" | "active" | "past";

const SECTION_STATUSES: Record<Section, readonly MentorshipStatus[]> = {
  pending: ["pending"],
  active: ["active"],
  past: PAST_STATUSES,
};

const SECTION_LABEL: Record<Section, string> = {
  pending: "Pending",
  active: "Active",
  past: "Past",
};

const EMPTY_COPY: Record<MentorshipView, Record<Section, string>> = {
  mentor: {
    pending: "No requests waiting for you.",
    active: "You aren't mentoring anyone right now.",
    past: "Nothing here yet.",
  },
  mentee: {
    pending: "You have no requests waiting for a reply.",
    active: "You don't have a mentor yet. Find one in the directory.",
    past: "Nothing here yet.",
  },
};

function MentorshipList({
  view,
  section,
}: {
  view: MentorshipView;
  section: Section;
}) {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMentorships(view, SECTION_STATUSES[section]);

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observer.current?.disconnect();
      if (!node || isFetchingNextPage) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (isError) return <Alert severity="error">Couldn't load this list.</Alert>;
  if (items.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
        {EMPTY_COPY[view][section]}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {items.map((m) => (
        <MentorshipCard key={m.id} mentorship={m} view={view} />
      ))}
      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <CircularProgress size={20} />
        </Box>
      )}
    </Stack>
  );
}

export default function MentorshipPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: profile } = useUserProfile(user?._id ?? "");
  // Someone who isn't a mentor has nothing on the mentor tab — open on "My
  // mentors" unless the URL says otherwise.
  const tabParam = params.get("tab");
  const view: MentorshipView =
    tabParam === "mentee" || tabParam === "mentor"
      ? tabParam
      : profile && !profile.isOpenToMentor
        ? "mentee"
        : "mentor";
  const section: Section =
    params.get("section") === "active" || params.get("section") === "past"
      ? (params.get("section") as Section)
      : "pending";

  const { data: pendingCount = 0 } = usePendingRequestCount();

  const update = (patch: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        return next;
      },
      { replace: true },
    );

  const max = profile?.maxActiveMentees ?? 3;
  const used = profile?.activeMenteeCount ?? 0;

  return (
    <PageContainer>
      <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Mentorship
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Requests you've received and the mentors you've asked.
          </Typography>
        </Box>

        <Tabs
          value={view}
          onChange={(_, v: MentorshipView) => update({ tab: v, section: undefined })}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            value="mentor"
            label={
              pendingCount > 0
                ? `As mentor (${pendingCount} new)`
                : "As mentor"
            }
            sx={{ textTransform: "none" }}
          />
          <Tab value="mentee" label="My mentors" sx={{ textTransform: "none" }} />
        </Tabs>

        {view === "mentor" && profile?.isOpenToMentor && (
          <Typography variant="caption" color="text.secondary">
            {used} of {max} mentee slots in use
          </Typography>
        )}
        {view === "mentor" && profile && !profile.isOpenToMentor && (
          <Alert severity="info">
            You're not open to mentoring, so people can't send you new requests.
            Turn it on in Profile → Settings.
          </Alert>
        )}

        <ToggleButtonGroup
          exclusive
          size="small"
          value={section}
          onChange={(_, v: Section | null) =>
            v && update({ section: v === "pending" ? undefined : v })
          }
          aria-label="Filter mentorships"
        >
          {(Object.keys(SECTION_LABEL) as Section[]).map((s) => (
            <ToggleButton key={s} value={s} sx={{ textTransform: "none", px: 2 }}>
              {SECTION_LABEL[s]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <MentorshipList key={`${view}-${section}`} view={view} section={section} />
      </Box>
    </PageContainer>
  );
}
