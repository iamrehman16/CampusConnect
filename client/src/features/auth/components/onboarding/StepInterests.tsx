import { Box, Chip, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { INTEREST_OPTIONS, EXPERTISE_OPTIONS } from "./onboarding.constants";

interface StepInterestsProps {
  control: Control<any>;
}

export function StepInterests({ control }: StepInterestsProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Interests & Expertise
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pick what excites you and what you're good at. Select as many as you
          like.
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Interests
        </Typography>
        <Controller
          name="interests"
          control={control}
          render={({ field }) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {INTEREST_OPTIONS.map((opt) => {
                const selected = (field.value as string[]).includes(opt);
                return (
                  <Chip
                    key={opt}
                    label={opt}
                    clickable
                    color={selected ? "primary" : "default"}
                    variant={selected ? "filled" : "outlined"}
                    onClick={() => {
                      const current = field.value as string[];
                      field.onChange(
                        selected
                          ? current.filter((v) => v !== opt)
                          : [...current, opt],
                      );
                    }}
                  />
                );
              })}
            </Box>
          )}
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Expertise
        </Typography>
        <Controller
          name="expertise"
          control={control}
          render={({ field }) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {EXPERTISE_OPTIONS.map((opt) => {
                const selected = (field.value as string[]).includes(opt);
                return (
                  <Chip
                    key={opt}
                    label={opt}
                    clickable
                    color={selected ? "secondary" : "default"}
                    variant={selected ? "filled" : "outlined"}
                    onClick={() => {
                      const current = field.value as string[];
                      field.onChange(
                        selected
                          ? current.filter((v) => v !== opt)
                          : [...current, opt],
                      );
                    }}
                  />
                );
              })}
            </Box>
          )}
        />
      </Box>
    </Box>
  );
}
