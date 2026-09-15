import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ForumIcon from '@mui/icons-material/Forum';
import { ROUTES } from '@/shared/constants/routes';

const NAV_ITEMS = [
  { label: 'Home', icon: <DashboardIcon />, path: ROUTES.HOME },
  { label: 'Resources', icon: <LibraryBooksIcon />, path: ROUTES.RESOURCES },
  { label: 'AI Chat', icon: <SmartToyIcon />, path: ROUTES.AI_CHAT },
  { label: 'Community', icon: <ForumIcon />, path: ROUTES.COMMUNITY },
];

/**
 * Mobile bottom navigation bar.
 * Only visible below the `md` breakpoint (handled by AppLayout).
 */
export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Find the active nav item index
  const activeIndex = NAV_ITEMS.findIndex(
    (item) =>
      location.pathname === item.path ||
      (item.path !== ROUTES.HOME && location.pathname.startsWith(item.path)),
  );

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        elevation: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
      elevation={0}
    >
      <BottomNavigation
        value={activeIndex === -1 ? 0 : activeIndex}
        onChange={(_, newValue) => {
          navigate(NAV_ITEMS[newValue].path, { replace: true });
        }}
        showLabels
        sx={{
          bgcolor: 'background.paper',
          height: 64,
          '& .Mui-selected': {
            color: 'primary.main',
          },
          '& .MuiBottomNavigationAction-root': {
            minWidth: 48,
            padding: '6px 0',
            '@media (pointer: coarse)': {
              padding: '8px 0',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.6875rem',
            },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.label}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
