import { Box, TextField, ToggleButton, Typography, useTheme } from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { DEPARTMENTS, SEMESTERS } from "./onboarding.constants";

interface StepAcademicProps {
  control: Control<any>;
}

export function StepAcademic({ control }: StepAcademicProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Academic Info
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We use this to surface relevant resources and connect you with the
          right mentors.
        </Typography>
      </Box>

      <Controller
        name="department"
        control={control}
        rules={{ required: "Department is required" }}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            select
            label="Department"
            fullWidth
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            SelectProps={{ native: true }}
          >
            <option value="" disabled />
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </TextField>
        )}
      />

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Current Semester
        </Typography>
        <Controller
          name="semester"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {SEMESTERS.map((s) => (
                <ToggleButton
                  key={s}
                  value={s}
                  selected={field.value === s}
                  onChange={() => field.onChange(s)}
                  size="small"
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50% !important",
                    border: `1px solid ${theme.palette.divider} !important`,
                    fontWeight: 600,
                    "&.Mui-selected": {
                      background: theme.palette.primary.main,
                      color: "#fff",
                      borderColor: `${theme.palette.primary.main} !important`,
                    },
                  }}
                >
                  {s}
                </ToggleButton>
              ))}
            </Box>
          )}
        />
      </Box>
    </Box>
  );
}
