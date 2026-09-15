// features/admin/components/ChartCard.tsx
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  children: React.ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  height = 280,
  loading = false,
  children,
}: ChartCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: height }}>
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 2 }} />
        ) : (
          children
        )}
      </Box>
    </Paper>
  );
}