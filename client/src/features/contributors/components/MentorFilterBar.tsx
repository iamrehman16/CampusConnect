import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Popover,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { Search as SearchIcon, Tune } from "@/shared/icons";
import { DEPARTMENTS, SEMESTERS } from "@/features/auth/components/onboarding/onboarding.constants";
import type { MentorFilters, MentorSort } from "../types/mentor.dto";

type FilterPatch = Partial<
  Record<"q" | "dept" | "topic" | "semMin" | "semMax" | "slots" | "sort", string | undefined>
>;

interface Props {
  filters: MentorFilters;
  hasActiveFilters: boolean;
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
}

const SEARCH_DEBOUNCE_MS = 400;

/** Debounced text input that writes to the URL once typing pauses. */
function DebouncedText({
  label,
  placeholder,
  value,
  onCommit,
  icon,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onCommit: (value: string) => void;
  icon?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  // External change (reset / back button) -> adopt it.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft.trim() === value) return;
    const t = setTimeout(() => onCommit(draft.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft, value, onCommit]);

  return (
    <TextField
      size="small"
      fullWidth
      label={label || undefined}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      slotProps={{
        input: icon
          ? {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }
          : undefined,
        htmlInput: { maxLength: 100, "aria-label": label || placeholder },
      }}
    />
  );
}

const semesterLabel = (min?: number, max?: number) =>
  min && max ? `Semester ${min}–${max}` : min ? `Semester ${min}+` : `Up to semester ${max}`;

/**
 * Mentor directory filters (BACKLOG.md D9): search and sort stay visible;
 * department, topic, semester range and "has a free slot" live in a
 * Filters popover, with active ones shown as removable chips. Was six
 * controls plus a switch in a row, for a directory of a handful of people.
 */
export function MentorFilterBar({ filters, hasActiveFilters, onChange, onReset }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const chips = [
    filters.department && { key: "dept", label: filters.department, clear: { dept: undefined } },
    filters.topic && { key: "topic", label: `Topic: ${filters.topic}`, clear: { topic: undefined } },
    (filters.semesterMin || filters.semesterMax) && {
      key: "sem",
      label: semesterLabel(filters.semesterMin, filters.semesterMax),
      clear: { semMin: undefined, semMax: undefined },
    },
    filters.hasCapacity && { key: "slots", label: "Has a free slot", clear: { slots: undefined } },
  ].filter(Boolean) as { key: string; label: string; clear: FilterPatch }[];

  return (
    <Box>
      <Stack direction="row" gap={1} alignItems="center">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <DebouncedText
            label=""
            placeholder="Search by name, topic or skill"
            value={filters.search ?? ""}
            onCommit={(v) => onChange({ q: v || undefined })}
            icon
          />
        </Box>
        <Badge color="primary" badgeContent={chips.length} invisible={chips.length === 0}>
          <Button
            variant="outlined"
            startIcon={<Tune sx={{ fontSize: 16 }} />}
            onClick={(e) => setAnchor(e.currentTarget)}
            aria-haspopup="dialog"
            sx={{ height: 40 }}
          >
            Filters
          </Button>
        </Badge>
        <TextField
          select
          size="small"
          value={filters.sort}
          onChange={(e) => {
            const sort = e.target.value as MentorSort;
            onChange({ sort: sort === "score" ? undefined : sort });
          }}
          slotProps={{ htmlInput: { "aria-label": "Sort mentors" } }}
          sx={{ width: { xs: 132, sm: 180 }, flexShrink: 0 }}
        >
          <MenuItem value="recommended">For you</MenuItem>
          <MenuItem value="score">Top reputation</MenuItem>
          <MenuItem value="active">Recently active</MenuItem>
        </TextField>
      </Stack>

      {(chips.length > 0 || hasActiveFilters) && (
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mt: 1.5 }}>
          {chips.map((c) => (
            <Chip key={c.key} label={c.label} onDelete={() => onChange(c.clear)} />
          ))}
          <Button size="small" onClick={onReset}>
            Clear all
          </Button>
        </Stack>
      )}

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, p: 2, width: 320, maxWidth: "calc(100vw - 32px)" } } }}
      >
        <Stack spacing={2}>
          <TextField
            select
            size="small"
            label="Department"
            value={filters.department ?? ""}
            onChange={(e) => onChange({ dept: e.target.value || undefined })}
          >
            <MenuItem value="">Any department</MenuItem>
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
          <DebouncedText
            label="Topic"
            placeholder="e.g. Algorithms"
            value={filters.topic ?? ""}
            onCommit={(v) => onChange({ topic: v || undefined })}
          />
          <Stack direction="row" gap={1.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester from"
              value={filters.semesterMin ?? ""}
              onChange={(e) => onChange({ semMin: e.target.value || undefined })}
            >
              <MenuItem value="">Any</MenuItem>
              {SEMESTERS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              size="small"
              label="to"
              value={filters.semesterMax ?? ""}
              onChange={(e) => onChange({ semMax: e.target.value || undefined })}
            >
              <MenuItem value="">Any</MenuItem>
              {SEMESTERS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Switch
                size="small"
                checked={!!filters.hasCapacity}
                onChange={(e) => onChange({ slots: e.target.checked ? "1" : undefined })}
              />
            }
            label="Only mentors with a free slot"
          />
          <Stack direction="row" justifyContent="space-between">
            <Button size="small" onClick={onReset} disabled={!hasActiveFilters}>
              Reset
            </Button>
            <Button size="small" variant="contained" onClick={() => setAnchor(null)}>
              Done
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </Box>
  );
}
