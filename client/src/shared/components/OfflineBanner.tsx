import { Alert, Collapse } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  return (
    <Collapse in={!isOnline}>
      <Alert
        icon={<WifiOffIcon fontSize="small" />}
        severity="warning"
        sx={{
          borderRadius: 0,
          py: 0.5,
          fontSize: '0.8rem',
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          '& .MuiAlert-icon': {
            color: 'warning.contrastText',
          },
        }}
      >
        You're offline — showing cached data
      </Alert>
    </Collapse>
  );
}