import { Box, Typography, Skeleton, Stack, Button } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { ResourceCard } from "@/features/resources/components/ResourceCard";
import { useTrendingResources } from "@/features/resources/hooks/resource.hooks";
import { ROUTES } from "@/shared/constants/routes";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TrendingCardSkeleton() {
  return (
    <Box
      sx={{
        minWidth: { xs: 220, sm: 240 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        p: 2,
        height: 180,
        flexShrink: 0,
      }}
    >
      <Stack direction="row" gap={1} mb={1.5}>
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{ borderRadius: 1.5 }}
        />
        <Skeleton
          variant="rounded"
          width={70}
          height={20}
          sx={{ borderRadius: 10 }}
        />
      </Stack>
      <Skeleton variant="text" width="85%" height={18} />
      <Skeleton variant="text" width="60%" height={14} />
      <Skeleton
        variant="rounded"
        width={80}
        height={16}
        sx={{ mt: 1, borderRadius: 10 }}
      />
      <Stack direction="row" justifyContent="space-between" mt={2}>
        <Skeleton variant="text" width={70} height={12} />
        <Skeleton variant="text" width={40} height={12} />
      </Stack>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrendingResourcesRow() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useTrendingResources();

  const resources = data?.data ?? [];

  if (isError) return null;

  return (
    <Box>
      {/* ── Section header ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
      >
        <Stack direction="row" alignItems="center" gap={0.75}>
          <WhatshotIcon sx={{ fontSize: 18, color: "primary.light" }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Trending Resources
          </Typography>
        </Stack>

        <Button
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(ROUTES.RESOURCES)}
          sx={{ color: "text.secondary", fontWeight: 500 }}
        >
          See all
        </Button>
      </Stack>

      {/* ── Horizontal scroll row ── */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
          // hide scrollbar visually but keep functional
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          // ensure cards don't collapse on flex
          "& > *": { flexShrink: 0 },
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <TrendingCardSkeleton key={i} />
            ))
          : resources.map((resource) => (
              <Box key={resource._id} sx={{ width: { xs: 220, sm: 260 } }}>
                <ResourceCard resource={resource} />
              </Box>
            ))}
      </Box>
    </Box>
  );
}
