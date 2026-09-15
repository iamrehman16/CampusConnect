// features/admin/AdminDashboardPage.tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import BarChartIcon from '@mui/icons-material/BarChart';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import OverviewSection from '../components/OverViewSection';
import AnalyticsSection from '../components/AnalyticsSection';
import ResourcesTab from '../components/ResourceTab';
import UsersTab from '../components/UserTab';
import { useOverviewStats } from '../hooks/admin-hooks';
import { PageContainer } from '@/shared/components/PageContainer';

type TabValue = 'overview' | 'resources' | 'users';

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<TabValue>('overview');

  // Reuse the already-cached overview stats for the pending badge —
  // no extra fetch, staleTime means this is already in cache from OverviewSection
  const { data: stats } = useOverviewStats();
  const pendingCount = stats?.resources.pending ?? 0;

  return (
    <PageContainer>
      <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Page header */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Admin dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Platform overview and moderation controls
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minHeight: 44 },
          }}
        >
          <Tab
            value="overview"
            label="Overview"
            icon={<BarChartIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            value="resources"
            label={
              <Badge
                badgeContent={pendingCount}
                color="warning"
                max={99}
                sx={{ '& .MuiBadge-badge': { right: -10, top: 4 } }}
              >
                Resources
              </Badge>
            }
            icon={<LibraryBooksIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            value="users"
            label="Users"
            icon={<ManageAccountsIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab panels — keep all mounted to preserve scroll state */}
      <Box hidden={tab !== 'overview'} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <OverviewSection />
        <AnalyticsSection />
      </Box>

      <Box hidden={tab !== 'resources'}>
        <ResourcesTab />
      </Box>

      <Box hidden={tab !== 'users'}>
        <UsersTab />
      </Box>

    </Box>
    </PageContainer>
  );
}