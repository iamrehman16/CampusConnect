// features/admin/AdminDashboardPage.tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import { BarChart as BarChartIcon, LibraryBooks as LibraryBooksIcon, ManageAccounts as ManageAccountsIcon, HowToReg as HowToRegIcon, Flag as FlagIcon } from "@/shared/icons";
import OverviewSection from '../components/OverViewSection';
import AnalyticsSection from '../components/AnalyticsSection';
import ResourcesTab from '../components/ResourceTab';
import UsersTab from '../components/UserTab';
import ApplicationsTab from '../components/ApplicationsTab';
import ReportsTab from '../components/ReportsTab';
import { useAdminReports } from '@/features/moderation/hooks/moderation.hooks';
import { useAdminApplications } from '@/features/contributor-application/hooks/application.hooks';
import { useOverviewStats } from '../hooks/admin-hooks';
import { PageContainer } from '@/shared/components/PageContainer';

type TabValue = 'overview' | 'resources' | 'applications' | 'reports' | 'users';

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<TabValue>('overview');

  // Reuse the already-cached overview stats for the pending badge —
  // no extra fetch, staleTime means this is already in cache from OverviewSection
  const { data: stats } = useOverviewStats();
  const pendingCount = stats?.resources.pending ?? 0;
  const { data: pendingApplications } = useAdminApplications('Pending');
  const pendingApplicationCount = pendingApplications?.pages[0]?.total ?? 0;
  const { data: openReports } = useAdminReports('open');
  const openReportCount = openReports?.pages[0]?.total ?? 0;

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
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minHeight: 44, pr: 3 },
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
            value="applications"
            label={
              <Badge
                badgeContent={pendingApplicationCount}
                color="warning"
                max={99}
                sx={{ '& .MuiBadge-badge': { right: -10, top: 4 } }}
              >
                Applications
              </Badge>
            }
            icon={<HowToRegIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            value="reports"
            label={
              <Badge
                badgeContent={openReportCount}
                color="error"
                max={99}
                sx={{ '& .MuiBadge-badge': { right: -10, top: 4 } }}
              >
                Reports
              </Badge>
            }
            icon={<FlagIcon fontSize="small" />}
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
      {/* display is set explicitly: an sx `display: flex` overrides the `hidden`
          attribute, which left Overview showing above every other tab. */}
      <Box
        hidden={tab !== 'overview'}
        sx={{ display: tab === 'overview' ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}
      >
        <OverviewSection />
        <AnalyticsSection />
      </Box>

      <Box hidden={tab !== 'resources'}>
        <ResourcesTab />
      </Box>

      <Box hidden={tab !== 'applications'}>
        <ApplicationsTab />
      </Box>

      <Box hidden={tab !== 'reports'}>
        <ReportsTab />
      </Box>

      <Box hidden={tab !== 'users'}>
        <UsersTab />
      </Box>

    </Box>
    </PageContainer>
  );
}