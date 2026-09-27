import React, { useState } from "react";
import { Box, Button, Stack, Tab, Tabs } from "@mui/material";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Edit } from "@/shared/icons";
import { PageContainer } from "@/shared/components/PageContainer";
import { ROUTES } from "@/shared/constants/routes";
import { ApprovalStatus, UserRole } from "@/shared/types/enums";
import { useOwnPosts } from "@/features/community/hooks/community.hooks";
import { useDeleteResource, useMyResources } from "@/features/resources/hooks/resource.hooks";
import type { Resource } from "@/features/resources/types/resource.dto";
import { EditResourceModal } from "@/features/resources/components/EditResourceModal";
import { ContributorApplicationCard } from "@/features/contributor-application/components/ContributorApplicationCard";
import ProfileAvatarDialog from "../components/ProfileAvatarDialog";
import ProfileHero from "../components/ProfileHero";
import ProfilePostsTab from "../components/ProfilePostsTab";
import ProfileResourcesTab from "../components/ProfileResourcesTab";
import { useMyProfile, useUpdateProfile } from "../hooks/profile-hooks";
import { toProfileUserViewModel } from "../types/profile.types";

type ProfileTab = "posts" | "resources";

/** Your own profile (BACKLOG.md D9). Editing lives on the Settings page. */
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [resourceFilter, setResourceFilter] = useState<ApprovalStatus | "all">("all");
  const [editTarget, setEditTarget] = useState<Resource | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const posts = useOwnPosts();

  // Only uploaders have resources; /resources/my is Contributor/Admin only.
  const canUpload = profile?.role === UserRole.CONTRIBUTOR || profile?.role === UserRole.ADMIN;
  const resources = useMyResources(
    resourceFilter === "all" ? {} : { status: resourceFilter },
    { enabled: canUpload },
  );
  const approved = useMyResources({ status: ApprovalStatus.APPROVED }, { enabled: canUpload });

  const { mutate: updateProfile } = useUpdateProfile();
  const { mutate: deleteResource } = useDeleteResource();
  const user = toProfileUserViewModel(profile);

  // Pre-D9 links (account menu, bookmarks) pointed at a Settings tab here.
  if (params.get("tab") === "settings") {
    return <Navigate to={ROUTES.SETTINGS} replace />;
  }
  const tab: ProfileTab = canUpload && params.get("tab") === "resources" ? "resources" : "posts";

  const stats = {
    posts: posts.data?.pages[0]?.total ?? 0,
    resources: canUpload ? (approved.data?.pages[0]?.total ?? 0) : undefined,
  };

  return (
    <PageContainer width="narrow">
      <Stack spacing={3}>
        <ProfileHero
          user={user}
          stats={stats}
          isLoading={profileLoading}
          onAvatarClick={() => setAvatarDialogOpen(true)}
          actions={
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(ROUTES.SETTINGS)}
              fullWidth
            >
              Edit profile
            </Button>
          }
        />

        <ContributorApplicationCard />

        <Box>
          <Tabs
            value={tab}
            onChange={(_, v: ProfileTab) => setParams(v === "posts" ? {} : { tab: v }, { replace: true })}
            sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}
          >
            <Tab value="posts" label="Posts" />
            {canUpload && <Tab value="resources" label="Resources" />}
          </Tabs>

          {tab === "posts" ? (
            <ProfilePostsTab
              pages={posts.data?.pages}
              isLoading={posts.isLoading}
              isFetchingNextPage={posts.isFetchingNextPage}
              hasNextPage={posts.hasNextPage}
              fetchNextPage={posts.fetchNextPage}
            />
          ) : (
            <ProfileResourcesTab
              pages={resources.data?.pages}
              isLoading={resources.isLoading}
              isFetchingNextPage={resources.isFetchingNextPage}
              hasNextPage={resources.hasNextPage}
              fetchNextPage={resources.fetchNextPage}
              publicView={false}
              statusFilter={resourceFilter}
              onStatusFilterChange={setResourceFilter}
              onEditResource={setEditTarget}
              onDeleteResource={(r) => {
                if (window.confirm(`Delete "${r.title}"?`)) deleteResource(r._id);
              }}
            />
          )}
        </Box>
      </Stack>

      <ProfileAvatarDialog
        open={avatarDialogOpen}
        selectedAvatar={user?.avatar}
        onClose={() => setAvatarDialogOpen(false)}
        onSelect={(avatar) => {
          setAvatarDialogOpen(false);
          updateProfile({ avatar });
        }}
      />
      <EditResourceModal open={Boolean(editTarget)} resource={editTarget} onClose={() => setEditTarget(null)} />
    </PageContainer>
  );
};

export default ProfilePage;
