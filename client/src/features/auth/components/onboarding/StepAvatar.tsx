import { Box, Typography, alpha, useTheme } from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { AVATARS, AVATAR_IMAGES } from "./onboarding.constants";

interface StepAvatarProps {
  control: Control<any>;
}

export function StepAvatar({ control }: StepAvatarProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Pick your Avatar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is how you'll appear across CampusConnect.
        </Typography>
      </Box>

      <Controller
        name="avatar"
        control={control}
        rules={{ required: "Please pick an avatar" }}
        render={({ field, fieldState }) => (
          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
                gap: 1.5,
              }}
            >
              {AVATARS.map((name) => {
                const selected = field.value === name;
                return (
                  <Box
                    key={name}
                    onClick={() => field.onChange(name)}
                    sx={{
                      borderRadius: 2,
                      border: `2px solid`,
                      borderColor: selected
                        ? theme.palette.primary.main
                        : "transparent",
                      cursor: "pointer",
                      overflow: "hidden",
                      aspectRatio: "1",
                      background: selected
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.common.white, 0.04),
                      transition: "border-color 0.15s, background 0.15s",
                      "&:hover": {
                        borderColor: selected
                          ? theme.palette.primary.main
                          : theme.palette.divider,
                      },
                    }}
                  >
                    <img src={AVATAR_IMAGES[name]} alt={name} />
                  </Box>
                );
              })}
            </Box>
            {fieldState.error && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 1, display: "block" }}
              >
                {fieldState.error.message}
              </Typography>
            )}
          </Box>
        )}
      />

      <Controller
        name="isOpenToMentor"
        control={control}
        render={({ field }) => (
          <Box
            onClick={() => field.onChange(!field.value)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderRadius: 2,
              border: `1px solid`,
              borderColor: field.value ? "primary.main" : "divider",
              background: field.value
                ? (theme) => alpha(theme.palette.primary.main, 0.08)
                : "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Box>
              <Typography variant="body1" fontWeight={600}>
                Open to Mentoring
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Let junior students send you mentor requests
              </Typography>
            </Box>
            <Box
              sx={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: field.value ? "primary.main" : "action.disabled",
                bgcolor: field.value ? "primary.main" : "action.disabled",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 3,
                  left: field.value ? 21 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  bgcolor: "common.white",
                  transition: "left 0.15s",
                }}
              />
            </Box>
          </Box>
        )}
      />
    </Box>
  );
}
