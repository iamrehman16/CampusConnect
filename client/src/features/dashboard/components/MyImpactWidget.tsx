import { Box, LinearProgress, Skeleton, Stack, Typography } from "@mui/material";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipValueType } from "recharts";
import { useAuth } from "@/shared/hooks/useAuth";
import { useChartTheme } from "@/shared/hooks/useChartTheme";
import { UserRole } from "@/shared/types/enums";
import { TierChip } from "@/features/reputation/components/TierChip";
import { TIER_DISPLAY } from "@/features/reputation/utils/tier-display";
import { MentorRating } from "@/features/mentorship/components/MentorRating";
import { useMyImpact } from "../hooks/dashboard.hooks";
import { ROUTES } from "@/shared/constants/routes";
import { HomeSection } from "./HomeSection";

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" noWrap display="block">
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.tertiary" noWrap display="block">
          {hint}
        </Typography>
      )}
    </Box>
  );
}

const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${d.toLocaleString("default", { month: "short", timeZone: "UTC" })}`;
};

/**
 * "My impact" (BACKLOG.md E15): what a contributor's work has earned —
 * reputation and its 30-day trend, progress to the next tier, downloads, AI
 * citations, mentees and rating. Contributors and admins only.
 */
export function MyImpactWidget() {
  const { user } = useAuth();
  const isContributor = user?.role === UserRole.CONTRIBUTOR || user?.role === UserRole.ADMIN;
  const { data, isLoading, isError } = useMyImpact(isContributor);
  const c = useChartTheme();

  if (!isContributor) return null;
  if (isError) return null; // Home still works without it; the failure toasts globally.

  return (
    <HomeSection title="Your impact" action={{ label: "Leaderboard", to: ROUTES.LEADERBOARD }}>
      {isLoading || !data ? (
        <Skeleton variant="rounded" height={180} />
      ) : (
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="h4" component="p" fontWeight={700} lineHeight={1.1}>
                {data.score}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                reputation
              </Typography>
              <TierChip tier={data.tier} />
              {data.pointsThisMonth > 0 && (
                <Typography variant="caption" color="success.main" fontWeight={600} sx={{ ml: "auto" }}>
                  +{data.pointsThisMonth} this month
                </Typography>
              )}
            </Stack>

            {data.nextTier ? (
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.round(data.tierFraction * 100)}
                  aria-label={`Progress to ${TIER_DISPLAY[data.nextTier.tier].label}`}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {data.nextTier.pointsToGo} more {data.nextTier.pointsToGo === 1 ? "point" : "points"} to{" "}
                  {TIER_DISPLAY[data.nextTier.tier].label}
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                You've reached the top tier.
              </Typography>
            )}
          </Box>

          <Box sx={{ height: 72 }} aria-label="Reputation over the last 30 days">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.history} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="date" hide />
                <Tooltip
                  formatter={(v: TooltipValueType | undefined) => [v ?? 0, "Reputation"]}
                  labelFormatter={(l: unknown) => shortDate(String(l))}
                  contentStyle={{
                    background: c.tooltipBg,
                    border: `1px solid ${c.tooltipBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={c.primary}
                  fill={c.primary}
                  fillOpacity={0.12}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 1.5,
            }}
          >
            <Stat label="Downloads" value={data.downloads.toLocaleString()} hint={`${data.resources} ${data.resources === 1 ? "resource" : "resources"}`} />
            <Stat label="AI citations" value={data.aiCitations} hint="resource-days" />
            <Stat
              label="Mentees"
              value={data.mentees.active}
              hint={`${data.mentees.completed} completed`}
            />
            <Stat
              label="Rating"
              value={
                data.rating.average === null ? (
                  "—"
                ) : (
                  <MentorRating average={data.rating.average} count={data.rating.count} />
                )
              }
            />
          </Box>
        </Stack>
      )}
    </HomeSection>
  );
}
