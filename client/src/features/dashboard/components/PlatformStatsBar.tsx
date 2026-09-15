import { Box, Typography, Skeleton, Stack, IconButton } from "@mui/material";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { usePublicStats } from "@/features/dashboard/hooks/dashboard.hooks";
import type { PublicStatsDto } from "../types/dashboard.types";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATS_CONFIG: {
  key: keyof PublicStatsDto;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "totalUsers",
    label: "Students",
    description:
      "Registered students actively learning and collaborating on campus.",
    icon: <PeopleOutlineIcon />,
  },
  {
    key: "availableMentors",
    label: "Mentors",
    description:
      "Contributors open to mentoring — sharing expertise and guiding peers.",
    icon: <SchoolOutlinedIcon />,
  },
  {
    key: "totalResources",
    label: "Resources",
    description:
      "Study materials, notes, slides, and past papers shared by contributors.",
    icon: <FolderOutlinedIcon />,
  },
  {
    key: "postsThisMonth",
    label: "Posts this month",
    description:
      "Discussions, questions, and updates posted in the last 30 days.",
    icon: <ForumOutlinedIcon />,
  },
];

// ─── Single info card ─────────────────────────────────────────────────────────

interface StatInfoCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number;
}

function StatInfoCard({ icon, label, description, value }: StatInfoCardProps) {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        bgcolor: "action.hover",
        borderRadius: 2,
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: "column",
        gap: 1,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Icon + value row */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Box sx={{ color: "primary.light", display: "flex" }}>{icon}</Box>
        <IconButton
          size="small"
          onClick={() => navigate(ROUTES.FAQ)}
          sx={{
            color: "text.disabled",
            p: 0,
            "&:hover": { color: "primary.main" },
          }}
          aria-label={`Learn more about ${label}`}
        >
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      <Typography variant="h5" fontWeight={700} lineHeight={1}>
        {value.toLocaleString()}
      </Typography>

      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ lineHeight: 1.5, display: { xs: "none", sm: "block" } }}
      >
        {description}
      </Typography>
    </Box>
  );
}

function StatInfoCardSkeleton() {
  return (
    <Box
      sx={{
        bgcolor: "action.hover",
        borderRadius: 2,
        p: { xs: 1.5, sm: 2 },
        flex: 1,
        minWidth: 0,
      }}
    >
      <Skeleton variant="circular" width={24} height={24} sx={{ mb: 1 }} />
      <Skeleton width={48} height={32} sx={{ mb: 0.5 }} />
      <Skeleton width={64} height={14} sx={{ mb: 0.5 }} />
      <Skeleton width="90%" height={12} />
      <Skeleton width="70%" height={12} />
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlatformStatsBar() {
  const { data: stats, isLoading, isError } = usePublicStats();

  if (isError) return null;

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        textTransform="uppercase"
        letterSpacing={0.8}
        display="block"
        mb={1.5}
      >
        Platform at a glance
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(4, 1fr)",
          },
          gap: 1.5,
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatInfoCardSkeleton key={i} />
            ))
          : STATS_CONFIG.map(({ key, label, description, icon }) => (
              <StatInfoCard
                key={key}
                icon={icon}
                label={label}
                description={description}
                value={stats?.[key] ?? 0}
              />
            ))}
      </Box>
    </Box>
  );
}
