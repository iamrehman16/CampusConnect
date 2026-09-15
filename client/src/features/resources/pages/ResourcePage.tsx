import { useState, useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Button,
  Skeleton,
  InputAdornment,
  Chip,
  Fab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import {
  useResources,
  useMyResources,
  useDeleteResource,
} from "../hooks/resource.hooks";
import { ResourceCard } from "../components/ResourceCard";
import { CreateResourceModal } from "../components/CreateResourceModal";
import { EditResourceModal } from "../components/EditResourceModal";
import { ApprovalStatus, ResourceType } from "@/shared/types/enums";
import type { Resource, ResourceFilterParams } from "../types/resource.dto";
import { useAuth } from "@/shared/hooks/useAuth";
import { UserRole } from "@/shared/types/enums";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { PageContainer } from '@/shared/components/PageContainer';
// ─── Filter bar config ────────────────────────────────────────────────────────

const RESOURCE_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  ...Object.values(ResourceType).map((v) => ({ value: v, label: v })),
];

const SEMESTER_OPTIONS = [
  { value: "", label: "All Semesters" },
  ...Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
  })),
];

// ─── Skeleton card ────────────────────────────────────────────────────────────

function ResourceCardSkeleton() {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        p: 2,
        height: 180,
      }}
    >
      <Stack direction="row" gap={1} mb={1.5}>
        <Skeleton variant="rounded" width={36} height={36} />
        <Skeleton
          variant="rounded"
          width={80}
          height={20}
          sx={{ borderRadius: 10 }}
        />
      </Stack>
      <Skeleton variant="text" width="80%" height={20} />
      <Skeleton variant="text" width="60%" height={16} />
      <Skeleton variant="text" width={80} height={16} sx={{ mt: 1 }} />
      <Stack direction="row" justifyContent="space-between" mt={2}>
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width={40} height={14} />
      </Stack>
    </Box>
  );
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabType = "all" | "mine";

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResourcePage() {
  const { user } = useAuth();
  const isContributor = user?.role === UserRole.CONTRIBUTOR;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canCreate = isContributor || isAdmin;

  const [tab, setTab] = useState<TabType>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Resource | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [filters, setFilters] = useState<
    Omit<ResourceFilterParams, "page" | "limit">
  >({
    search: "",
    type: undefined,
    semester: undefined,
    sort: undefined,
    status: ApprovalStatus.APPROVED,
    uploadedBy: undefined,
  });

  const { mutate: deleteResource } = useDeleteResource();

  // ── Infinite scroll sentinel ─────────────────────────────────────────────
  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  // ── Data hooks ────────────────────────────────────────────────────────────
  const allQuery = useResources(filters);
  const myQuery = useMyResources(filters);

  const activeQuery = tab === "all" ? allQuery : myQuery;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = activeQuery;

  // Trigger next page when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const resources = data?.pages.flatMap((p) => p.data) ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (field: keyof typeof filters) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prev) => ({
          ...prev,
          [field]: e.target.value || undefined,
        }));
      },
    [],
  );
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const handleDelete = useCallback(
    (resource: Resource) => {
      if (window.confirm(`Delete "${resource.title}"?`)) {
        deleteResource(resource._id);
      }
    },
    [deleteResource],
  );

  return (
    <PageContainer>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Page header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Resources
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse study materials shared by your peers
          </Typography>
        </Box>

        {/* Create button — desktop, visible to contributor/admin */}
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            Upload Resource
          </Button>
        )}
      </Stack>

      {/* Tabs: All / My Resources (contributor/admin only) */}
      {canCreate && (
        <Stack direction="row" gap={1} mb={2.5}>
          {(["all", "mine"] as TabType[]).map((t) => (
            <Chip
              key={t}
              label={t === "all" ? "All Resources" : "My Uploads"}
              onClick={() => setTab(t)}
              variant={tab === t ? "filled" : "outlined"}
              color={tab === t ? "primary" : "default"}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
      )}

      {/* Filter bar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        mb={3}
        alignItems={{ sm: "center" }}
      >
        <TextField
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          value={filters.type ?? ""}
          onChange={handleFilterChange("type")}
          sx={{ minWidth: 140 }}
          label="Type"
        >
          {RESOURCE_TYPE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          value={filters.semester ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              semester: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
          sx={{ minWidth: 140 }}
          label="Semester"
        >
          {SEMESTER_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* Error state */}
      {isError && (
        <Typography color="error" textAlign="center" py={6}>
          Failed to load resources. Please try again.
        </Typography>
      )}

      {/* Grid */}
      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                <ResourceCardSkeleton />
              </Grid>
            ))
          : resources.map((resource) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={resource._id}>
                <ResourceCard
                  resource={resource}
                  onEdit={canCreate ? (r) => setEditTarget(r) : undefined}
                  onDelete={canCreate ? handleDelete : undefined}
                />
              </Grid>
            ))}
      </Grid>

      {/* Empty state */}
      {!isLoading && resources.length === 0 && !isError && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No resources found
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {tab === "mine"
              ? "You haven't uploaded anything yet."
              : "Try adjusting your filters."}
          </Typography>
        </Box>
      )}

      {/* Infinite scroll sentinel */}
      <Box ref={sentinelRef} py={2} textAlign="center">
        {isFetchingNextPage && (
          <Grid container spacing={2}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                key={`skel-next-${i}`}
              >
                <ResourceCardSkeleton />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* FAB for mobile */}
      {canCreate && (
        <Fab
          color="primary"
          onClick={() => setCreateOpen(true)}
          sx={{
            position: "fixed",
            bottom: 80, // above bottom nav
            right: 20,
            display: { xs: "flex", sm: "none" },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Modals */}
      <CreateResourceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <EditResourceModal
        open={Boolean(editTarget)}
        resource={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </Box>
    </PageContainer>
  );
}
