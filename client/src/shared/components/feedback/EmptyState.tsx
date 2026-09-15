import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

/**
 * Empty-state placeholder for lists/grids with no data.
 */
export default function EmptyState({
  message = 'No items found.',
  icon,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
        opacity: 0.6,
      }}
    >
      {icon || <InboxIcon sx={{ fontSize: 64 }} />}
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
