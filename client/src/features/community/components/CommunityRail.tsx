import { useMemo } from "react";
import { Box, ButtonBase, Card, Skeleton, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import InlineError from "@/shared/components/feedback/InlineError";
import UserAvatar from "@/shared/components/UserAvatar";
import { ROUTES } from "@/shared/constants/routes";
import { TierChip } from "@/features/reputation/components/TierChip";
import { useTopContributors } from "../hooks/community.hooks";
import type { Post } from "../types/community.dto";

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ py: 1.5 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ px: 2, pb: 1 }}>
        {title}
      </Typography>
      {children}
    </Card>
  );
}

const rowSx = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 1.25,
  px: 2,
  py: 0.875,
  textAlign: "left",
  "&:hover": { bgcolor: "action.hover" },
} as const;

/**
 * Community's right rail (BACKLOG.md D9), from real data: the members with
 * the most reputation, and the most-discussed posts in the loaded feed.
 * Replaces a static "Community Rules" card; the rules shrink to one line.
 */
export function CommunityRail({ posts, onOpenPost }: { posts: Post[]; onOpenPost: (id: string) => void }) {
  const navigate = useNavigate();
  const { data: contributors, isLoading, isError, refetch } = useTopContributors(5);
  const active = useMemo(
    () => [...posts].filter((p) => p.commentCount > 0).sort((a, b) => b.commentCount - a.commentCount).slice(0, 4),
    [posts],
  );

  return (
    <Stack spacing={2.5}>
      <RailCard title="Top contributors">
        {isLoading ? (
          <Stack spacing={1} sx={{ px: 2 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={32} />
            ))}
          </Stack>
        ) : isError ? (
          <InlineError compact message="Couldn't load contributors." onRetry={refetch} />
        ) : !contributors?.length ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
            No one has earned reputation yet.
          </Typography>
        ) : (
          contributors.map((c, i) => (
            <ButtonBase
              key={c.id}
              sx={rowSx}
              onClick={() => navigate(ROUTES.PUBLIC_PROFILE.replace(":userId", c.id))}
            >
              <Typography variant="caption" color="text.tertiary" fontWeight={600} sx={{ width: 12 }}>
                {i + 1}
              </Typography>
              <UserAvatar name={c.name} avatar={c.avatar} size={28} />
              <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1, minWidth: 0 }}>
                {c.name}
              </Typography>
              <TierChip tier={c.tier} hideNewcomer sx={{ height: 18, fontSize: "0.625rem" }} />
            </ButtonBase>
          ))
        )}
        <ButtonBase
          onClick={() => navigate(ROUTES.LEADERBOARD)}
          sx={{ ...rowSx, color: "primary.main", fontWeight: 600, fontSize: "0.8125rem" }}
        >
          See the leaderboard
        </ButtonBase>
      </RailCard>

      {active.length > 0 && (
        <RailCard title="Active discussions">
          {active.map((p) => (
            <ButtonBase key={p._id} sx={{ ...rowSx, display: "block" }} onClick={() => onOpenPost(p._id)}>
              <Typography variant="body2" fontWeight={500} sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {p.title}
              </Typography>
              <Typography variant="caption" color="text.tertiary">
                {p.commentCount} {p.commentCount === 1 ? "reply" : "replies"} · {p.author.name}
              </Typography>
            </ButtonBase>
          ))}
        </RailCard>
      )}

      <Box sx={{ px: 1 }}>
        <Typography variant="caption" color="text.tertiary">
          Be kind, keep it about learning, and no spam. Upvotes on your posts earn reputation.
        </Typography>
      </Box>
    </Stack>
  );
}
