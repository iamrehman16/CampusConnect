import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PeopleIcon from '@mui/icons-material/People';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ForumIcon from '@mui/icons-material/Forum';
import { useOverviewStats } from '@/features/admin/hooks/admin-hooks';

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

function StatRow({ icon, label, value }: StatRowProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" gap={1}>
        <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function RightRail() {
  const { data } = useOverviewStats();

  return (
    <Box
      sx={{
        display: { xs: 'none', lg: 'block' },
        width: 280,
        flexShrink: 0,
        position: 'sticky',
        top: 24,
        alignSelf: 'flex-start',
      }}
    >
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Platform
          </Typography>
        </Box>

        {/* Stats */}
        <Stack spacing={1.5} sx={{ px: 2, py: 2 }}>
          <StatRow
            icon={<PeopleIcon sx={{ fontSize: 16 }} />}
            label="Members"
            value={data?.users.total ?? '—'}
          />
          <Divider />
          <StatRow
            icon={<LibraryBooksIcon sx={{ fontSize: 16 }} />}
            label="Resources"
            value={data?.resources.total ?? '—'}
          />
          <Divider />
          <StatRow
            icon={<ForumIcon sx={{ fontSize: 16 }} />}
            label="Posts"
            value={data?.posts.total ?? '—'}
          />
        </Stack>

        {/* Footer note */}
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Typography variant="caption" color="text.disabled">
            Updated live
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}