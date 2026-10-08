import { Box, Button, IconButton, Stack, Tooltip } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { DarkMode, LightMode } from "@/shared/icons";
import { useThemeModeContext } from "@/shared/hooks/useThemeModeContext";
import { BrandLockup } from "@/shared/components/BrandMark";
import { ROUTES } from "@/shared/constants/routes";

export function LandingNav() {
  const { mode, toggle } = useThemeModeContext();
  return (
    <Box
      component="nav"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        bgcolor: "surface.canvas",
        borderBottom: "1px solid",
        borderColor: "border.subtle",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ maxWidth: 1120, mx: "auto", px: { xs: 2, sm: 3 }, height: 60 }}
      >
        <BrandLockup size={30} />
        <Stack direction="row" alignItems="center" gap={1}>
          <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
            <IconButton onClick={toggle} aria-label="Toggle colour theme" sx={{ color: "text.secondary" }}>
              {mode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Button component={RouterLink} to={ROUTES.LOGIN} variant="text" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
            Sign in
          </Button>
          <Button component={RouterLink} to={ROUTES.SIGNUP} variant="contained" size="small" sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            Get started
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
