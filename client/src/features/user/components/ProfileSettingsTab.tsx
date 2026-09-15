import React, { useEffect, useState } from "react";
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
import { Save } from "@mui/icons-material";
import type { UpdateUserDto } from "../types/user.dto";
import type { ProfileUserViewModel } from "../types/profile.types";

interface ProfileSettingsTabProps {
  user: ProfileUserViewModel | null;
  onSave: (dto: UpdateUserDto) => void;
  isSaving: boolean;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.03)",
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(108,99,255,0.4)" },
    "&.Mui-focused fieldset": { borderColor: "#6C63FF" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#6C63FF" },
};

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

  // Sync when user data loads
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        academicInfo: user.academicInfo ?? "",
        expertise: user.expertise ?? "",
        semester: user.semester ?? "",
      });
    }
  }, [user?.name, user?.academicInfo, user?.expertise, user?.semester]);

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

      <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.07)" }} />

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
            background: "linear-gradient(135deg, #6C63FF, #5753d0)",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            "&:disabled": {
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.3)",
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
