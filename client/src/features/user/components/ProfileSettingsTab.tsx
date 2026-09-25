import React, { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { Save } from "@/shared/icons";
import type { UpdateUserDto } from "../types/user.dto";
import {
  DEFAULT_MAX_ACTIVE_MENTEES,
  MAX_MENTOR_TOPICS,
  type ProfileUserViewModel,
} from "../types/profile.types";

interface ProfileSettingsTabProps {
  user: ProfileUserViewModel | null;
  onSave: (dto: UpdateUserDto) => void;
  isSaving: boolean;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const CAPACITIES = Array.from({ length: 10 }, (_, i) => i + 1);

const sameTopics = (a: string[], b: string[]) =>
  a.length === b.length && a.every((t, i) => t === b[i]);

// BACKLOG.md D2 — was hardcoded to the old primary (#6C63FF) and a bare
// white-overlay background; now themed so it tracks the current
// primary/mode instead of drifting from the palette on the next rebrand.
const fieldSx = (theme: Theme) => ({
  "& .MuiOutlinedInput-root": {
    background: alpha(theme.palette.text.primary, 0.03),
    "& fieldset": { borderColor: alpha(theme.palette.text.primary, 0.1) },
    "&:hover fieldset": { borderColor: alpha(theme.palette.primary.main, 0.4) },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
});

const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  user,
  onSave,
  isSaving,
}) => {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    academicInfo: user?.academicInfo ?? "",
    expertise: user?.expertise ?? "",
    semester: user?.semester ?? "",
    isOpenToMentor: user?.isOpenToMentor ?? false,
    mentorBio: user?.mentorBio ?? "",
    mentorTopics: user?.mentorTopics ?? ([] as string[]),
    maxActiveMentees: user?.maxActiveMentees ?? DEFAULT_MAX_ACTIVE_MENTEES,
  });
  // Tracks which user id `form` was last synced from, so the form resets
  // once the initially-null user data loads (adjusting state during render,
  // not in an Effect, per React's "you might not need an effect" guidance).
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setForm({
      name: user.name ?? "",
      academicInfo: user.academicInfo ?? "",
      expertise: user.expertise ?? "",
      semester: user.semester ?? "",
      isOpenToMentor: user.isOpenToMentor,
      mentorBio: user.mentorBio ?? "",
      mentorTopics: user.mentorTopics,
      maxActiveMentees: user.maxActiveMentees,
    });
  }

  const isDirty =
    form.name !== (user?.name ?? "") ||
    form.academicInfo !== (user?.academicInfo ?? "") ||
    form.expertise !== (user?.expertise ?? "") ||
    Number(form.semester) !== (user?.semester ?? 0) ||
    form.isOpenToMentor !== (user?.isOpenToMentor ?? false) ||
    form.mentorBio !== (user?.mentorBio ?? "") ||
    !sameTopics(form.mentorTopics, user?.mentorTopics ?? []) ||
    form.maxActiveMentees !==
      (user?.maxActiveMentees ?? DEFAULT_MAX_ACTIVE_MENTEES);

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = () => {
    const dto: UpdateUserDto = {};
    if (form.name.trim()) dto.name = form.name.trim();
    if (form.academicInfo !== (user?.academicInfo ?? "")) {
      dto.academicInfo = form.academicInfo.trim();
    }
    if (form.expertise !== (user?.expertise ?? "")) {
      dto.expertise = form.expertise.trim();
    }
    if (form.semester) dto.semester = Number(form.semester);
    if (form.isOpenToMentor !== (user?.isOpenToMentor ?? false)) {
      dto.isOpenToMentor = form.isOpenToMentor;
    }
    if (form.mentorBio !== (user?.mentorBio ?? "")) {
      dto.mentorBio = form.mentorBio.trim();
    }
    if (!sameTopics(form.mentorTopics, user?.mentorTopics ?? [])) {
      dto.mentorTopics = form.mentorTopics;
    }
    if (
      form.maxActiveMentees !==
      (user?.maxActiveMentees ?? DEFAULT_MAX_ACTIVE_MENTEES)
    ) {
      dto.maxActiveMentees = form.maxActiveMentees;
    }
    onSave(dto);
  };

  return (
    <Box>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 2.5, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.7rem" }}
      >
        Personal Information
      </Typography>

      <Stack spacing={2.5}>
        <TextField
          label="Display Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          size="small"
          sx={fieldSx}
          inputProps={{ maxLength: 60 }}
        />

        <TextField
          label="Academic Information"
          value={form.academicInfo}
          onChange={handleChange("academicInfo")}
          fullWidth
          size="small"
          sx={fieldSx}
          inputProps={{ maxLength: 120 }}
          helperText={`${form.academicInfo.length}/120`}
          FormHelperTextProps={{ sx: { textAlign: "right", mr: 0 } }}
        />

        <TextField
          label="Expertise"
          value={form.expertise}
          onChange={handleChange("expertise")}
          fullWidth
          multiline
          rows={3}
          size="small"
          sx={fieldSx}
          inputProps={{ maxLength: 300 }}
          helperText={`${form.expertise.length}/300`}
          FormHelperTextProps={{ sx: { textAlign: "right", mr: 0 } }}
        />

        <TextField
          select
          label="Semester"
          value={form.semester}
          onChange={handleChange("semester")}
          fullWidth
          size="small"
          sx={fieldSx}
        >
          <MenuItem value="">
            <em>Not specified</em>
          </MenuItem>
          {SEMESTERS.map((s) => (
            <MenuItem key={s} value={s}>
              Semester {s}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Divider sx={{ my: 3, borderColor: "divider" }} />

      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.7rem" }}
      >
        Mentoring
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={form.isOpenToMentor}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isOpenToMentor: e.target.checked }))
            }
          />
        }
        label="I'm open to mentoring other students"
        sx={{ mb: 1 }}
      />

      {form.isOpenToMentor && (
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="What can you help with?"
            value={form.mentorBio}
            onChange={handleChange("mentorBio")}
            fullWidth
            multiline
            rows={3}
            size="small"
            sx={fieldSx}
            inputProps={{ maxLength: 500 }}
            helperText={`${form.mentorBio.length}/500`}
            FormHelperTextProps={{ sx: { textAlign: "right", mr: 0 } }}
          />

          <Autocomplete
            multiple
            freeSolo
            options={[] as string[]}
            value={form.mentorTopics}
            onChange={(_, value) =>
              setForm((prev) => ({
                ...prev,
                mentorTopics: Array.from(
                  new Set(value.map((v) => v.trim()).filter(Boolean)),
                ).slice(0, MAX_MENTOR_TOPICS),
              }))
            }
            renderTags={(value, getTagProps) =>
              value.map((topic, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={topic} size="small" {...tagProps} />;
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Topics you mentor on"
                placeholder="Type a subject or course and press Enter"
                size="small"
                sx={fieldSx}
                helperText={`Up to ${MAX_MENTOR_TOPICS} topics · ${form.mentorTopics.length} added`}
              />
            )}
          />

          <TextField
            select
            label="Maximum mentees at a time"
            value={form.maxActiveMentees}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                maxActiveMentees: Number(e.target.value),
              }))
            }
            fullWidth
            size="small"
            sx={fieldSx}
          >
            {CAPACITIES.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      <Divider sx={{ my: 3, borderColor: "divider" }} />

      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={
            isSaving ? (
              <CircularProgress size={16} sx={{ color: "inherit" }} />
            ) : (
              <Save />
            )
          }
          onClick={handleSubmit}
          disabled={!isDirty || isSaving || !form.name.trim()}
          sx={{
            // Gradient/shadow come from the theme's containedPrimary
            // override — no need to duplicate them (and risk drifting
            // from the palette) here.
            px: 3,
            "&:disabled": {
              background: (theme) => alpha(theme.palette.text.primary, 0.07),
              color: (theme) => alpha(theme.palette.text.primary, 0.3),
            },
          }}
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </Stack>
    </Box>
  );
};

export default ProfileSettingsTab;
