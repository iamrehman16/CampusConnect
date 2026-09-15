import { Box, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";

interface StepProfileProps {
  control: Control<any>;
  userName: string;
}

export function StepProfile({ control, userName }: StepProfileProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Hey, {userName.split(" ")[0]} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Let's set up your CampusConnect profile. This helps peers and mentors
          find you.
        </Typography>
      </Box>

      <Controller
        name="displayName"
        control={control}
        rules={{ required: "Display name is required" }}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="Display Name"
            fullWidth
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="bio"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Short Bio (optional)"
            placeholder="e.g. Final-year CS student passionate about AI and open source"
            fullWidth
            multiline
            rows={3}
            inputProps={{ maxLength: 200 }}
            helperText={`${field.value?.length ?? 0}/200`}
          />
        )}
      />
    </Box>
  );
}
