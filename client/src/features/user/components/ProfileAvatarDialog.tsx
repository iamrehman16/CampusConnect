import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

const avatarFiles = [
  "alpha1.svg",
  "alpha2.svg",
  "alpha3.svg",
  "alpha4.svg",
  "beta1.svg",
  "beta2.svg",
  "beta3.svg",
  "beta4.svg",
];

const avatars = avatarFiles.map((file) => ({
  id: file,
  src: new URL(`../../../assets/avatars/${file}`, import.meta.url).href,
}));

interface ProfileAvatarDialogProps {
  open: boolean;
  selectedAvatar?: string;
  onClose: () => void;
  onSelect: (avatar: string) => void;
}

export default function ProfileAvatarDialog({
  open,
  selectedAvatar,
  onClose,
  onSelect,
}: ProfileAvatarDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Choose Avatar</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pick an avatar from the available set. Your selection will be applied to your profile immediately.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
            gap: 2,
          }}
        >
          {avatars.map((avatar) => {
            const selected = selectedAvatar === avatar.src;
            return (
              <Box
                key={avatar.id}
                onClick={() => onSelect(avatar.src)}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  border: selected ? "2px solid" : "1px solid",
                  borderColor: selected ? "primary.main" : "divider",
                  p: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: (theme) => theme.transitions.create(["border-color", "transform"], {
                    duration: theme.transitions.duration.shortest,
                  }),
                  '&:hover': {
                    transform: "translateY(-2px)",
                    borderColor: "primary.main",
                  },
                }}
              >
                <Avatar
                  src={avatar.src}
                  alt={avatar.id}
                  sx={{ width: 64, height: 64 }}
                />
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
