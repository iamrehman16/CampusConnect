import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { LightMode as LightModeIcon, DarkMode as DarkModeIcon } from "@/shared/icons";
import { useThemeModeContext } from '@/shared/hooks/useThemeModeContext';
import { BrandLockup } from "@/shared/components/BrandMark";

interface NavbarProps {
  onSignIn: () => void;
}

export default function Navbar({ onSignIn }: NavbarProps) {
  const { mode, toggle } = useThemeModeContext();

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: { xs: 2, md: 6 },
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <BrandLockup size={30} />
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton
          onClick={toggle}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          {mode === 'dark' ? (
            <LightModeIcon fontSize="small" />
          ) : (
            <DarkModeIcon fontSize="small" />
          )}
        </IconButton>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5 }}>
          <Button variant="outlined" size="small" onClick={onSignIn} sx={{ borderRadius: 6, px: 2.5, textTransform: 'none', fontWeight: 600 }}>
            Sign in
          </Button>
          <Button variant="contained" size="small" onClick={onSignIn} sx={{ borderRadius: 6, px: 2.5, textTransform: 'none', fontWeight: 600 }}>
            Join now
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}