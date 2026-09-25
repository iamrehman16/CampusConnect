import { Box, Skeleton, Typography } from "@mui/material";
import { useMyProfile } from "@/features/user/hooks/profile-hooks";

function timeOfDay(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Home header (BACKLOG.md D6). A plain, stable greeting — the old one picked
 * a random motivational line per render and styled the first name in
 * italic accent colour — plus the student's department and semester, which
 * is what the rest of Home is personalised by.
 */
export function GreetingStatsCard() {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading) {
    return (
      <Box>
        <Skeleton width={280} height={36} />
        <Skeleton width={200} height={20} />
      </Box>
    );
  }

  const firstName = profile?.name?.trim().split(/\s+/)[0];
  const context = [
    profile?.department,
    profile?.semester ? `Semester ${profile.semester}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight={700} sx={{ letterSpacing: "-0.01em" }}>
        {timeOfDay(new Date().getHours())}
        {firstName ? `, ${firstName}` : ""}
      </Typography>
      {context && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {context}
        </Typography>
      )}
    </Box>
  );
}
