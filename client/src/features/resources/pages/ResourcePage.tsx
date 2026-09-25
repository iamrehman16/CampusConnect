import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  Fab,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { Search as SearchIcon, Add as AddIcon, Inbox as InboxIcon } from "@/shared/icons";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "react-router-dom";
import {
  useCourseFacets,
  useDeleteResource,
  useMyResources,
  useResources,
} from "../hooks/resource.hooks";
import { ResourceCard } from "../components/ResourceCard";
import { ResourceRow } from "../components/ResourceRow";
import { CreateResourceModal } from "../components/CreateResourceModal";
import { EditResourceModal } from "../components/EditResourceModal";
import { ApprovalStatus, ResourceSort, ResourceType, UserRole } from "@/shared/types/enums";
import type { Resource, ResourceFilterParams } from "../types/resource.dto";
import { RESOURCE_TYPE_LABEL } from "../utils/resource-labels";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";

type TabType = "all" | "mine";
type ViewMode = "grid" | "list";
type Filters = Pick<ResourceFilterParams, "type" | "semester" | "course" | "sort" | "status">;

const VIEW_KEY = "cc-library-view";
const GRID_SX = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
} as const;

const SORT_LABEL: Record<ResourceSort, string> = {
  newest: "Newest",
  popular: "Most downloaded",
  oldest: "Oldest",
};

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  Approved: "Approved",
  Pending: "In review",
  Rejected: "Rejected",
};

function readViewMode(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid"; // storage blocked (private mode) — default is fine
  }
}

/**
 * Route entry: the desktop top bar's global search lands here as
 * /resources?q=… — keying on q starts a fresh search each time (including
 * when the Library is already open) without syncing state in an Effect.
 */
export default function ResourcePageRoute() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  return <ResourcePage key={q} initialSearch={q} />;
}

function CardSkeleton() {
  return <Skeleton variant="rounded" height={148} />;
}

/**
 * Library (BACKLOG.md D7): compact filter bar (search, course, type,
 * semester, sort), active-filter chips with clear, grid/list toggle, and
 * real empty/no-results/error states.
 */
function ResourcePage({ initialSearch }: { initialSearch: string }) {
  const { user } = useAuth();
  const canCreate = user?.role === UserRole.CONTRIBUTOR || user?.role === UserRole.ADMIN;

  const [tab, setTab] = useState<TabType>("all");
  const [view, setView] = useState<ViewMode>(readViewMode);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Resource | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [filters, setFilters] = useState<Filters>({});

  const { data: courses = [] } = useCourseFacets();

  // The public list is always approved (server-enforced); status only
  // applies to "My uploads".
  const activeFilters = useMemo(
    () => ({
      ...filters,
      status: tab === "mine" ? filters.status : undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [filters, tab, debouncedSearch],
  );

  const allQuery = useResources(activeFilters);
  // Contributor/Admin-only endpoint; also skip it until the "mine" tab is open.
  const myQuery = useMyResources(activeFilters, { enabled: canCreate && tab === "mine" });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    tab === "all" ? allQuery : myQuery;

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const resources = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const { mutate: deleteResource } = useDeleteResource();
  const handleDelete = useCallback(
    (resource: Resource) => {
      if (window.confirm(`Delete "${resource.title}"?`)) deleteResource(resource._id);
    },
    [deleteResource],
  );

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K] | undefined) =>
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));

  const changeView = (next: ViewMode | null) => {
    if (!next) return;
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // storage blocked — the choice just won't persist
    }
  };

  // Active filter chips (search included) — each removable, plus Clear all.
  const chips: { key: string; label: string; onDelete: () => void }[] = [
    ...(debouncedSearch.trim()
      ? [{ key: "q", label: `“${debouncedSearch.trim()}”`, onDelete: () => setSearchTerm("") }]
      : []),
    ...(filters.course ? [{ key: "course", label: filters.course, onDelete: () => setFilter("course", undefined) }] : []),
    ...(filters.type ? [{ key: "type", label: RESOURCE_TYPE_LABEL[filters.type], onDelete: () => setFilter("type", undefined) }] : []),
    ...(filters.semester ? [{ key: "sem", label: `Semester ${filters.semester}`, onDelete: () => setFilter("semester", undefined) }] : []),
    ...(tab === "mine" && filters.status ? [{ key: "status", label: STATUS_LABEL[filters.status], onDelete: () => setFilter("status", undefined) }] : []),
  ];
  const clearAll = () => {
    setFilters((prev) => ({ sort: prev.sort }));
    setSearchTerm("");
  };

  const selectedCourse = courses.find((c) => c.course.toLowerCase() === filters.course?.toLowerCase()) ?? null;

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Library"
        subtitle="Notes, slides and past papers shared by seniors and contributors."
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              Upload
            </Button>
          )
        }
      >
        {canCreate && (
          <Tabs value={tab} onChange={(_, t: TabType) => setTab(t)} aria-label="Library sections">
            <Tab value="all" label="All resources" />
            <Tab value="mine" label="My uploads" />
          </Tabs>
        )}
      </PageHeader>

      {/* ── Filter bar ── */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr 1fr",
            md: "minmax(220px, 2fr) minmax(180px, 1.4fr) repeat(3, minmax(130px, 1fr)) auto",
          },
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <TextField
          placeholder="Search titles, topics, tags…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
            htmlInput: { "aria-label": "Search the library" },
          }}
        />
        <Autocomplete
          size="small"
          options={courses}
          value={selectedCourse}
          onChange={(_, c) => setFilter("course", c?.course)}
          getOptionLabel={(c) => c.course}
          isOptionEqualToValue={(a, b) => a.course === b.course}
          renderOption={(props, c) => {
            const { key, ...rest } = props as typeof props & { key: string };
            return (
              <Box component="li" key={key} {...rest} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                <span>
                  <Typography component="span" variant="body2" fontWeight={600}>{c.course}</Typography>{" "}
                  <Typography component="span" variant="caption" color="text.tertiary">{c.subject}</Typography>
                </span>
                <Typography component="span" variant="caption" color="text.tertiary">{c.count}</Typography>
              </Box>
            );
          }}
          renderInput={(params) => <TextField {...params} placeholder="Any course" label="Course" />}
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
        />
        <TextField select label="Type" value={filters.type ?? ""} onChange={(e) => setFilter("type", e.target.value as ResourceType)}>
          <MenuItem value="">Any type</MenuItem>
          {Object.values(ResourceType).map((t) => (
            <MenuItem key={t} value={t}>{RESOURCE_TYPE_LABEL[t]}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Semester"
          value={filters.semester ?? ""}
          onChange={(e) => setFilter("semester", e.target.value ? Number(e.target.value) : undefined)}
        >
          <MenuItem value="">Any semester</MenuItem>
          {Array.from({ length: 8 }, (_, i) => (
            <MenuItem key={i + 1} value={i + 1}>Semester {i + 1}</MenuItem>
          ))}
        </TextField>
        {tab === "mine" ? (
          <TextField select label="Status" value={filters.status ?? ""} onChange={(e) => setFilter("status", e.target.value as ApprovalStatus)}>
            <MenuItem value="">Any status</MenuItem>
            {Object.values(ApprovalStatus).map((s) => (
              <MenuItem key={s} value={s}>{STATUS_LABEL[s]}</MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField select label="Sort" value={filters.sort ?? ResourceSort.NEWEST} onChange={(e) => setFilter("sort", e.target.value as ResourceSort)}>
            {Object.values(ResourceSort).map((s) => (
              <MenuItem key={s} value={s}>{SORT_LABEL[s]}</MenuItem>
            ))}
          </TextField>
        )}
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, v: ViewMode | null) => changeView(v)}
          aria-label="Layout"
          sx={{ justifySelf: { xs: "end", md: "auto" } }}
        >
          <ToggleButton value="grid" aria-label="Grid view">
            <Tooltip title="Grid"><LayoutGrid size={16} /></Tooltip>
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view">
            <Tooltip title="List"><ListIcon size={16} /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Result summary + active filters ── */}
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ minHeight: 32, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ mr: 0.5 }}>
          {isLoading ? "Loading…" : `${total} ${total === 1 ? "resource" : "resources"}`}
        </Typography>
        {chips.map((c) => (
          <Chip key={c.key} label={c.label} onDelete={c.onDelete} variant="outlined" />
        ))}
        {chips.length > 0 && (
          <Button size="small" variant="text" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </Stack>

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}
        >
          Couldn't load resources.
        </Alert>
      )}

      {/* ── Results ── */}
      {isLoading ? (
        <Box sx={GRID_SX}>
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </Box>
      ) : resources.length === 0 && !isError ? (
        <Card sx={{ py: 7, px: 3, textAlign: "center" }}>
          <Box sx={{ color: "text.tertiary", mb: 1 }}>
            <InboxIcon fontSize="large" />
          </Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {tab === "mine" && chips.length === 0 ? "You haven't uploaded anything yet" : "No resources match"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            {tab === "mine" && chips.length === 0
              ? "Share your notes — approved uploads also power the AI assistant."
              : "Try a different search or remove a filter."}
          </Typography>
          {chips.length > 0 ? (
            <Button variant="outlined" onClick={clearAll}>Clear filters</Button>
          ) : (
            tab === "mine" && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                Upload a resource
              </Button>
            )
          )}
        </Card>
      ) : view === "grid" ? (
        <Box sx={GRID_SX}>
          {resources.map((r) => (
            <ResourceCard
              key={r._id}
              resource={r}
              onEdit={canCreate ? setEditTarget : undefined}
              onDelete={canCreate ? handleDelete : undefined}
            />
          ))}
        </Box>
      ) : (
        <Card sx={{ p: 0.5 }}>
          {resources.map((r) => <ResourceRow key={r._id} resource={r} />)}
        </Card>
      )}

      <Box ref={sentinelRef} sx={{ py: 2 }}>
        {isFetchingNextPage && (
          <Box sx={GRID_SX}>
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </Box>
        )}
      </Box>

      {canCreate && (
        <Fab
          color="primary"
          aria-label="Upload a resource"
          onClick={() => setCreateOpen(true)}
          sx={{ position: "fixed", bottom: 80, right: 20, display: { xs: "flex", sm: "none" } }}
        >
          <AddIcon />
        </Fab>
      )}

      <CreateResourceModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditResourceModal open={Boolean(editTarget)} resource={editTarget} onClose={() => setEditTarget(null)} />
    </PageContainer>
  );
}
