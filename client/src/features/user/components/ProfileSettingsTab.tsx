import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { Save } from "@mui/icons-material";
import type { UpdateUserDto } from "../types/user.dto";
import type { ProfileUserViewModel } from "../types/profile.types";

interface ProfileSettingsTabProps {
  user: ProfileUserViewModel | null;
  onSave: (dto: UpdateUserDto) => void;
  isSaving: boolean;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

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
    });
  }

  const isDirty =
    form.name !== (user?.name ?? "") ||
    form.academicInfo !== (user?.academicInfo ?? "") ||
    form.expertise !== (user?.expertise ?? "") ||
    Number(form.semester) !== (user?.semester ?? 0);

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
