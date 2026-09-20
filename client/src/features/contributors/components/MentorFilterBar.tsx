import { useEffect, useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DEPARTMENTS, SEMESTERS } from "@/features/auth/components/onboarding/onboarding.constants";
import type { MentorFilters, MentorSort } from "../types/mentor.dto";

type FilterPatch = Partial<
  Record<"q" | "dept" | "topic" | "semMin" | "semMax" | "sort", string | undefined>
>;

interface Props {
  filters: MentorFilters;
  hasActiveFilters: boolean;
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
}

const SEARCH_DEBOUNCE_MS = 400;
const WIDE = { gridColumn: { xs: "1 / -1", md: "auto" } } as const;

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
      label={label}
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
        htmlInput: { maxLength: 100 },
      }}
      sx={WIDE}
    />
  );
}

export function MentorFilterBar({ filters, hasActiveFilters, onChange, onReset }: Props) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1.4fr 1.4fr 1fr 1fr 1.2fr" },
        alignItems: "center",
      }}
    >
      <DebouncedText
        label="Search"
        placeholder="Name, topic or expertise"
        value={filters.search ?? ""}
        onCommit={(v) => onChange({ q: v || undefined })}
        icon
      />

      <TextField
        select
        size="small"
        label="Department"
        value={filters.department ?? ""}
        onChange={(e) => onChange({ dept: e.target.value || undefined })}
        sx={WIDE}
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

      <TextField
        select
        size="small"
        label="Sem from"
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
        size="small"
        label="Sem to"
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

      <Box sx={{ display: "flex", gap: 1, ...WIDE }}>
        <TextField
          select
          size="small"
          label="Sort by"
          fullWidth
          value={filters.sort}
          onChange={(e) => {
            const sort = e.target.value as MentorSort;
            onChange({ sort: sort === "score" ? undefined : sort });
          }}
        >
          <MenuItem value="score">Top reputation</MenuItem>
          <MenuItem value="active">Recently active</MenuItem>
        </TextField>
        {hasActiveFilters && (
          <Button size="small" onClick={onReset} sx={{ whiteSpace: "nowrap" }}>
            Clear
          </Button>
        )}
      </Box>
    </Box>
  );
}
