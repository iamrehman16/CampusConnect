import React, { useState } from "react";
import { Box, Button, Container, Tab, Tabs, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { ApprovalStatus } from "@/shared/types/enums";
import { PageContainer } from '@/shared/components/PageContainer';

import { useUserProfile } from "../hooks/profile-hooks";
import { usePostsByUser } from "@/features/community/hooks/community.hooks";
import { useResourcesByUser } from "@/features/resources/hooks/resource.hooks";

import ProfileHero from "../components/ProfileHero";
import ProfilePostsTab from "../components/ProfilePostsTab";
import ProfileResourcesTab from "../components/ProfileResourcesTab";
import { toProfileUserViewModel } from "../types/profile.types";

// ─── Tab panel wrapper ────────────────────────────────────────────────────────
const TabPanel = ({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    sx={{ pt: 3, display: value === index ? "block" : "none" }}
  >
    {value === index && children}
  </Box>
);

// ─── Component ────────────────────────────────────────────────────────────────
const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const profileUserId = userId ?? "";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } =
    useUserProfile(profileUserId);

  const {
    data: postsData,
    isLoading: postsLoading,
    isFetchingNextPage: postsFetchingNext,
    hasNextPage: postsHasNext,
    fetchNextPage: postsFetchNext,
  } = usePostsByUser(profileUserId);

  // Public view: only approved resources
  const {
    data: resourcesData,
    isLoading: resourcesLoading,
    isFetchingNextPage: resourcesFetchingNext,
    hasNextPage: resourcesHasNext,
    fetchNextPage: resourcesFetchNext,
  } = useResourcesByUser(profileUserId, { status: ApprovalStatus.APPROVED });
  const profileView = toProfileUserViewModel(profile);

  // ── Stats (approved resources only for public view) ─────────────────────────
  const allResources = resourcesData?.pages.flatMap((p) => p.data) ?? [];
  const stats = {
    totalPosts:
      postsData?.pages[0]?.total ??
      postsData?.pages.flatMap((p) => p.data).length ??
      0,
    approvedResources: resourcesData?.pages[0]?.total ?? allResources.length,
    pendingResources: 0,
    rejectedResources: 0,
  };

  if (!userId) {
    return (
      <PageContainer>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            color: "text.secondary",
          }}
        >
          <Typography>User not found.</Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Container maxWidth="md" disableGutters={{ xs: true, sm: false } as any}>
        {/* Back button */}
        <Box sx={{ px: { xs: 2, sm: 0 }, py: { xs: 1.5, sm: 2 } }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            size="small"
            sx={{
              textTransform: "none",
              color: "text.secondary",
              fontWeight: 500,
              "&:hover": { color: "text.primary" },
            }}
          >
            Back
          </Button>
        </Box>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <ProfileHero
          user={profileView}
          stats={stats}
          isLoading={profileLoading}
          // No actions on public view
        />

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Box sx={{ mt: { xs: 0, sm: 2 } }}>
          <Box
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: { xs: 2, sm: 0 },
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  color: "text.secondary",
                  minHeight: 48,
                  "&.Mui-selected": {
                    fontWeight: 700,
                  },
                },
                "& .MuiTabs-indicator": {
                  height: 2,
                  borderRadius: "2px 2px 0 0",
                },
              }}
            >
              <Tab label="Posts" />
              <Tab label="Resources" />
            </Tabs>
          </Box>

          <Box sx={{ px: { xs: 2, sm: 0 } }}>
            {/* Posts tab */}
            <TabPanel value={activeTab} index={0}>
              <ProfilePostsTab
                pages={postsData?.pages}
                isLoading={postsLoading}
                isFetchingNextPage={postsFetchingNext}
                hasNextPage={postsHasNext}
                fetchNextPage={postsFetchNext}
              />
            </TabPanel>

            {/* Resources tab — approved only, no filter chips */}
            <TabPanel value={activeTab} index={1}>
              <ProfileResourcesTab
                pages={resourcesData?.pages}
                isLoading={resourcesLoading}
                isFetchingNextPage={resourcesFetchingNext}
                hasNextPage={resourcesHasNext}
                fetchNextPage={resourcesFetchNext}
                publicView
              />
            </TabPanel>
          </Box>
        </Box>
      </Container>
      </Box>
    </PageContainer>
  );
};

export default PublicProfilePage;
