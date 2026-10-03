import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  Link,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import UserAvatar from "@/shared/components/UserAvatar";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/hooks/useAuth";
import { TierChip } from "../components/TierChip";
import { useLeaderboard } from "../hooks/reputation.hooks";
import type { LeaderboardPeriod } from "../types/reputation.types";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

/**
 * Who is earning reputation (BACKLOG.md E15): this month's earners, or
 * lifetime. People can opt out in Settings; suspended accounts never appear.
 */
export default function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("month");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useLeaderboard(period, 20);

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Leaderboard"
        subtitle="Members whose uploads, posts and mentoring are helping others the most."
      />

      <ToggleButtonGroup
        exclusive
        size="small"
        value={period}
        onChange={(_, v: LeaderboardPeriod | null) => v && setPeriod(v)}
        aria-label="Leaderboard period"
        sx={{ mb: 2 }}
      >
        {PERIODS.map((p) => (
          <ToggleButton key={p.value} value={p.value} sx={{ textTransform: "none", px: 2 }}>
            {p.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Couldn't load the leaderboard.
        </Alert>
      )}

      {isLoading && (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={56} />
          ))}
        </Stack>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <Card sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {period === "month" ? "No one has earned points this month yet" : "No one has earned reputation yet"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Share a resource, help in the community or mentor someone to get on the board.
          </Typography>
        </Card>
      )}

      {data && data.length > 0 && (
        <Card>
          {data.map((e) => {
            const isMe = e.id === user?._id;
            return (
              <ButtonBase
                key={e.id}
                onClick={() => navigate(ROUTES.PUBLIC_PROFILE.replace(":userId", e.id))}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  textAlign: "left",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: isMe ? "primary.subtle" : "transparent",
                  "&:last-of-type": { borderBottom: 0 },
                  "&:hover": { bgcolor: isMe ? "primary.subtle" : "action.hover" },
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color={e.rank <= 3 ? "primary.main" : "text.tertiary"}
                  sx={{ width: 24 }}
                >
                  {e.rank}
                </Typography>
                <UserAvatar name={e.name} avatar={e.avatar} size={36} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {e.name || "Unnamed member"}
                      {isMe ? " (you)" : ""}
                    </Typography>
                    <TierChip tier={e.tier} hideNewcomer />
                  </Stack>
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {period === "month" ? `+${e.points}` : e.points}
                  <Typography component="span" variant="caption" color="text.secondary">
                    {" "}
                    pts
                  </Typography>
                </Typography>
              </ButtonBase>
            );
          })}
        </Card>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Don't want to be listed?{" "}
        <Link component={RouterLink} to={ROUTES.SETTINGS} underline="hover">
          Hide yourself in Settings
        </Link>
        . Your reputation and profile stay as they are.
      </Typography>
    </PageContainer>
  );
}
