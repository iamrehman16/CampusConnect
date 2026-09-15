// features/admin/components/StatCard.tsx
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import type { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;         // e.g. "+12 this week"
  icon: SvgIconComponent;
  iconColor?: string;   // MUI color token e.g. 'primary.main'
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'primary.main',
  loading = false,
}: StatCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: iconColor, fontSize: 22 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>

        {loading ? (
          <Skeleton width={64} height={36} />
        ) : (
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {value.toLocaleString()}
          </Typography>
        )}

        {sub && !loading && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}