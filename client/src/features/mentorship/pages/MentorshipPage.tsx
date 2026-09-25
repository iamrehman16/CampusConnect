import { useCallback, useRef } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { useUserProfile } from "@/features/user/hooks/profile-hooks";
import { MentorshipCard } from "../components/MentorshipCard";
import { useMentorships } from "../hooks/mentorship.hooks";
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
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMentorships(view, SECTION_STATUSES[section]);

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

/**
 * One side of the mentorship lifecycle — requests/active/past as a mentee
 * ("My mentors") or as a mentor ("Mentoring"). Rendered inside the Mentors
 * section (MentorsLayout, BACKLOG.md D5), which owns the page header and
 * the tab between the two views.
 */
export default function MentorshipPage({ view }: { view: MentorshipView }) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: profile } = useUserProfile(user?._id ?? "");
  const section: Section =
    params.get("section") === "active" || params.get("section") === "past"
      ? (params.get("section") as Section)
      : "pending";

  const setSection = (v: Section) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (v === "pending") next.delete("section");
        else next.set("section", v);
        return next;
      },
      { replace: true },
    );

  const max = profile?.maxActiveMentees ?? 3;
  const used = profile?.activeMenteeCount ?? 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {view === "mentor" && profile?.isOpenToMentor && (
        <Typography variant="body2" color="text.secondary">
          {used} of {max} mentee slots in use
        </Typography>
      )}
      {view === "mentor" && profile && !profile.isOpenToMentor && (
        <Alert severity="info">
          You're not open to mentoring, so people can't send you requests. Turn
          it on in Settings.
        </Alert>
      )}

      <ToggleButtonGroup
        exclusive
        size="small"
        value={section}
        onChange={(_, v: Section | null) => v && setSection(v)}
        aria-label="Filter mentorships"
        sx={{ alignSelf: "flex-start" }}
      >
        {(Object.keys(SECTION_LABEL) as Section[]).map((s) => (
          <ToggleButton key={s} value={s} sx={{ px: 2 }}>
            {SECTION_LABEL[s]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <MentorshipList
        key={`${view}-${section}`}
        view={view}
        section={section}
      />
    </Box>
  );
}
