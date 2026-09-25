// features/admin/components/TopContributorsTable.tsx
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { TopContributor } from '../types/admin.dto';
import UserAvatar from "@/shared/components/UserAvatar";

interface Props { data: TopContributor[] }

const MEDAL = ['🥇', '🥈', '🥉'];

export default function TopContributorsTable({ data }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
      {data.map((c, i) => (
        <Box
          key={c.userId}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1,
            py: 0.75,
            borderRadius: 2,
            bgcolor: i === 0 ? 'action.hover' : 'transparent',
          }}
        >
          <Typography sx={{ width: 24, textAlign: 'center', fontSize: 16 }}>
            {MEDAL[i] ?? `#${i + 1}`}
          </Typography>
          <UserAvatar name={c.name} avatar={c.avatar} size={32} />
          <Typography variant="body2" sx={{ flex: 1, fontWeight: i === 0 ? 600 : 400 }}>
            {c.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {c.uploads} uploads
          </Typography>
        </Box>
      ))}
    </Box>
  );
}