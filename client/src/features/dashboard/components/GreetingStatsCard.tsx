import { Box, Typography, Skeleton, Stack } from "@mui/material";
import { useMyProfile } from "@/features/user/hooks/profile-hooks";
import { useMyStats } from "@/features/dashboard/hooks/dashboard.hooks";
import { UserRole } from "@/shared/types/enums";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(" ")[0];

  const messages = {
    morning: [
      `Rise and shine, {name} — let's make today count.`,
      `Good morning, {name}. Your campus awaits.`,
      `Morning, {name}! Great things start early.`,
    ],
    afternoon: [
      `Good afternoon, {name}. Keep the momentum going.`,
      `Hey {name}, the day's still young — keep pushing.`,
      `Afternoon, {name}. Half the day done, half to go.`,
    ],
    evening: [
      `Evening, {name}. Wrapping up or just getting started?`,
      `Good evening, {name}. Night owls get things done too.`,
      `Hey {name}, burning the midnight oil? We've got you.`,
    ],
  };

  const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const pool = messages[bucket];
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked.replace("{name}", firstName);
}

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getRoleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    [UserRole.STUDENT]: "Student",
    [UserRole.CONTRIBUTOR]: "Contributor",
    [UserRole.ADMIN]: "Admin",
  };
  return map[role] ?? role;
}

// ─── Stat dot separator ───────────────────────────────────────────────────────

function Dot() {
  return (
    <Typography
      component="span"
      variant="caption"
      color="text.disabled"
      sx={{ mx: 0.75, userSelect: "none" }}
    >
      ·
    </Typography>
  );
}

// ─── Single inline stat ───────────────────────────────────────────────────────

interface InlineStatProps {
  value: number;
  label: string;
}

function InlineStat({ value, label }: InlineStatProps) {
  return (
    <Typography component="span" variant="caption" color="text.secondary">
      <Typography
        component="span"
        variant="caption"
        fontWeight={700}
        color="text.primary"
      >
        {value.toLocaleString()}
      </Typography>{" "}
      {label}
    </Typography>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GreetingStatsCard() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: stats, isLoading: statsLoading } = useMyStats();

  const isLoading = profileLoading || statsLoading;
  const isContributorOrAdmin =
    profile?.role === UserRole.CONTRIBUTOR || profile?.role === UserRole.ADMIN;

  if (isLoading) {
    return (
      <Box sx={{ py: { xs: 2, sm: 2.5 } }}>
        <Skeleton width={320} height={36} sx={{ mb: 1 }} />
        <Skeleton width={180} height={18} sx={{ mb: 2 }} />
        <Skeleton width={260} height={16} />
      </Box>
    );
  }

  const greeting = profile?.name ? getGreeting(profile.name) : "";
  // Split greeting at the name so we can style it separately
  const firstName = profile?.name?.split(" ")[0] ?? "";
  const [before, after] = greeting.split(firstName);

  return (
    <Box sx={{ py: { xs: 2, sm: 2.5 } }}>
      {/* ── Greeting line ── */}
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ lineHeight: 1.3, mb: 0.5 }}
      >
        {before}
        <Typography
          component="span"
          variant="h5"
          fontWeight={700}
          fontStyle="italic"
          sx={{ color: "primary.light" }}
        >
          {firstName}
        </Typography>
        {after}
      </Typography>

      {/* ── Role + member since ── */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {getRoleLabel(profile?.role ?? UserRole.STUDENT)}
        {profile?.createdAt && (
          <>
            <Typography
              component="span"
              variant="body2"
              color="text.disabled"
              sx={{ mx: 0.75 }}
            >
              ·
            </Typography>
            Member since {formatMemberSince(profile.createdAt)}
          </>
        )}
      </Typography>

      {/* ── Inline stats row ── */}
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0}>
        {/* Students: posts + upvotes always */}
        <InlineStat value={stats?.postCount ?? 0} label="posts" />
        <Dot />
        <InlineStat value={stats?.totalUpvotesReceived ?? 0} label="upvotes" />

        {isContributorOrAdmin && (
          <>
            {/* Desktop: show resources + downloads always */}
            <Box sx={{ display: { xs: "none", sm: "contents" } }}>
              <Dot />
              <InlineStat value={stats?.resourceCount ?? 0} label="resources" />
              <Dot />
              <InlineStat
                value={stats?.totalDownloads ?? 0}
                label="downloads"
              />
            </Box>

            {/* Mobile: show resources + downloads only for contributor/admin */}
            <Box sx={{ display: { xs: "contents", sm: "none" } }}>
              <Dot />
              <InlineStat value={stats?.resourceCount ?? 0} label="resources" />
              <Dot />
              <InlineStat
                value={stats?.totalDownloads ?? 0}
                label="downloads"
              />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
