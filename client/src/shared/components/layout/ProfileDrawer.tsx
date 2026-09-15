import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import { UserRole } from '@/shared/types/enums';
import { alpha } from '@mui/material/styles';

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: 280,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* User info header — tapping navigates to profile */}
      <Box
        onClick={() => handleNavigate(ROUTES.PROFILE)}
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            fontSize: '1.25rem',
            fontWeight: 700,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email}
          </Typography>
          <Typography
            variant="caption"
            color="primary.main"
            fontWeight={600}
            sx={{ mt: 0.25, display: 'block' }}
          >
            View profile →
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Nav items */}
      <List sx={{ px: 1, py: 1, flex: 1 }}>
        <ListItemButton
          onClick={() => handleNavigate(ROUTES.PROFILE)}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            minHeight: 44,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText
            primary="My Profile"
            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
          />
        </ListItemButton>

        {isAdmin && (
          <ListItemButton
            onClick={() => handleNavigate(ROUTES.ADMIN)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              minHeight: 44,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Admin Panel"
              primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
            />
          </ListItemButton>
        )}
      </List>

      <Divider />

      {/* Logout */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            minHeight: 44,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              color: 'error.main',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          />
        </ListItemButton>
      </List>
    </Drawer>
  );
}