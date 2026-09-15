import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatIcon from '@mui/icons-material/Chat';
import ForumIcon from '@mui/icons-material/Forum';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { alpha, useTheme } from '@mui/material/styles';
import { ROUTES } from '@/shared/constants/routes';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/shared/types/enums';
import { People } from '@mui/icons-material';
import { useUIStore } from '@/shared/store/ui.store';
import { useThemeModeContext } from '@/shared/hooks/useThemeModeContext';

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

const MAIN_NAV = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: ROUTES.HOME },
  { label: 'Resources', icon: <LibraryBooksIcon />, path: ROUTES.RESOURCES },
  { label: 'AI Assistant', icon: <SmartToyIcon />, path: ROUTES.AI_CHAT },
  { label: 'Messages', icon: <ChatIcon />, path: ROUTES.CHAT },
  { label: 'Contributors', icon: <People />, path: ROUTES.CONTRIBUTORS },
  { label: 'Community', icon: <ForumIcon />, path: ROUTES.COMMUNITY },
];

const BOTTOM_NAV = [
  { label: 'Profile', icon: <PersonIcon />, path: ROUTES.PROFILE },
];

/**
 * Desktop sidebar navigation.
 * Permanent drawer visible at `md` breakpoint and above (handled by AppLayout).
 */
export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { mode, toggle } = useThemeModeContext();

  const isAdmin = user?.role === UserRole.ADMIN;

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== ROUTES.HOME && location.pathname.startsWith(path));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Logo / Brand */}
      <Box
        sx={{
          px: sidebarCollapsed ? 1 : 2.5,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}
      >
        {/* Logo — hidden when collapsed */}
        {!sidebarCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SmartToyIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              CampusConnect
            </Typography>
          </Box>
        )}

        {/* Toggle button */}
        <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Main Navigation */}
      <List sx={{ flex: 1, px: sidebarCollapsed ? 0.5 : 1.5, py: 1 }}>
        {MAIN_NAV.map((item) => (
          <Tooltip
            title={sidebarCollapsed ? item.label : ''}
            placement="right"
            arrow
            key={item.label}
          >
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                minHeight: 44,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                px: sidebarCollapsed ? 1 : 1.5,
                borderLeft: '3px solid',
                borderColor: isActive(item.path) ? 'primary.main' : 'transparent',
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarCollapsed ? 'unset' : 40,
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>

              {/* Label — hidden when collapsed */}
              {!sidebarCollapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 700 : 500,
                    fontSize: '0.875rem',
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <Tooltip title={sidebarCollapsed ? 'Admin Panel' : ''} placement="right" arrow>
              <ListItemButton
                selected={isActive(ROUTES.ADMIN)}
                onClick={() => navigate(ROUTES.ADMIN)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  minHeight: 44,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  px: sidebarCollapsed ? 1 : 1.5,
                  borderLeft: '3px solid',
                  borderColor: isActive(ROUTES.ADMIN) ? 'primary.main' : 'transparent',
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarCollapsed ? 'unset' : 40,
                    color: isActive(ROUTES.ADMIN) ? 'primary.main' : 'text.secondary',
                  }}
                >
                  <AdminPanelSettingsIcon />
                </ListItemIcon>

                {/* Label — hidden when collapsed */}
                {!sidebarCollapsed && (
                  <ListItemText
                    primary="Admin Panel"
                    primaryTypographyProps={{
                      fontWeight: isActive(ROUTES.ADMIN) ? 700 : 500,
                      fontSize: '0.875rem',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </>
        )}
      </List>

      <Divider />

      {/* Bottom actions */}
      <List sx={{ px: sidebarCollapsed ? 0.5 : 1.5, py: 1 }}>
        {BOTTOM_NAV.map((item) => (
          <Tooltip
            title={sidebarCollapsed ? item.label : ''}
            placement="right"
            arrow
            key={item.label}
          >
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                minHeight: 44,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                px: sidebarCollapsed ? 1 : 1.5,
                borderLeft: '3px solid',
                borderColor: isActive(item.path) ? 'primary.main' : 'transparent',
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarCollapsed ? 'unset' : 40,
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>

              {/* Label — hidden when collapsed */}
              {!sidebarCollapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 700 : 500,
                    fontSize: '0.875rem',
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        ))}
        <Tooltip
          title={sidebarCollapsed
            ? (mode === 'dark' ? 'Light mode' : 'Dark mode')
            : ''}
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={toggle}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              minHeight: 44,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              px: sidebarCollapsed ? 1 : 1.5,
              borderLeft: '3px solid transparent',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: sidebarCollapsed ? 'unset' : 40,
                color: 'text.secondary',
              }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </ListItemIcon>
            {!sidebarCollapsed && (
              <ListItemText
                primary={mode === 'dark' ? 'Light mode' : 'Dark mode'}
                primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
              />
            )}
          </ListItemButton>
        </Tooltip>
        <Tooltip title={sidebarCollapsed ? 'Logout' : ''} placement="right" arrow>
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: 1,
              minHeight: 44,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              px: sidebarCollapsed ? 1 : 1.5,
              borderLeft: '3px solid transparent',
              '&:hover': (theme ) => ({ bgcolor: alpha(theme.palette.error.main, 0.08) }),
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: sidebarCollapsed ? 'unset' : 40,
                color: 'error.main',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {!sidebarCollapsed && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ color: 'error.main', fontWeight: 500 }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </List>
    </Drawer>
  );
}
