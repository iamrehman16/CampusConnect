import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { InstallMobileRounded } from "@/shared/icons";
import { usePwaInstall } from "@/shared/hooks/usePwaInstall";

interface InstallAppButtonProps {
  variant?: "button" | "listItem";
  onDone?: () => void;
}

/**
 * "Install CampusConnect" entry point (BACKLOG.md J5). Renders nothing when
 * the app is already installed or the browser can't install it. Chromium uses
 * the native prompt; iOS Safari has none, so it gets written instructions.
 */
export function InstallAppButton({ variant = "button", onDone }: InstallAppButtonProps) {
  const { isInstallable, needsIosGuidance, triggerInstall } = usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!isInstallable && !needsIosGuidance) return null;

  const handleClick = () => {
    if (isInstallable) void triggerInstall();
    else setGuideOpen(true);
    onDone?.();
  };

  return (
    <>
      {variant === "listItem" ? (
        <ListItemButton onClick={handleClick} sx={{ minHeight: 44 }}>
          <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
            <InstallMobileRounded />
          </ListItemIcon>
          <ListItemText
            primary="Install app"
            primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9375rem" }}
          />
        </ListItemButton>
      ) : (
        <Button variant="outlined" startIcon={<InstallMobileRounded />} onClick={handleClick}>
          Install CampusConnect
        </Button>
      )}
      <Dialog open={guideOpen} onClose={() => setGuideOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Install CampusConnect</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            In Safari, tap the Share button, then choose “Add to Home Screen”. CampusConnect will
            open full screen like any other app.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuideOpen(false)}>Got it</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
