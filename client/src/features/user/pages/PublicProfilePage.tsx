import React from "react";
import { Box, Button, Card, Link, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowBack } from "@/shared/icons";
import { PageContainer } from "@/shared/components/PageContainer";
import { ROUTES } from "@/shared/constants/routes";
import { ApprovalStatus, UserRole } from "@/shared/types/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePostsByUser } from "@/features/community/hooks/community.hooks";
import { useResourcesByUser } from "@/features/resources/hooks/resource.hooks";
import { RequestMentorshipButton } from "@/features/mentorship/components/RequestMentorshipButton";
import ProfileHero from "../components/ProfileHero";
import ProfilePostsTab from "../components/ProfilePostsTab";
import ProfileResourcesTab from "../components/ProfileResourcesTab";
import { useUserProfile } from "../hooks/profile-hooks";
import { toProfileUserViewModel } from "../types/profile.types";

type ProfileTab = "posts" | "resources";

/** Someone else's profile (BACKLOG.md D9): same header as your own. */
const PublicProfilePage: React.FC = () => {
  const { userId = "" } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();

  const { data: profile, isLoading, isError } = useUserProfile(userId);
  const posts = usePostsByUser(userId);
  const resources = useResourcesByUser(userId, { status: ApprovalStatus.APPROVED });
  const user = toProfileUserViewModel(profile);

  if (me && userId === me._id) return <Navigate to={ROUTES.PROFILE} replace />;

  const resourceCount = resources.data?.pages[0]?.total ?? 0;
  const uploads = user?.role === UserRole.CONTRIBUTOR || user?.role === UserRole.ADMIN || resourceCount > 0;
  const tab: ProfileTab = uploads && params.get("tab") === "resources" ? "resources" : "posts";

  if (isError) {
    return (
      <PageContainer width="narrow">
        <Card sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            This profile isn't available
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate(ROUTES.MENTORS)}>
            Browse mentors
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      <Link
        component="button"
        onClick={() => navigate(-1)}
        underline="hover"
        color="text.secondary"
        variant="body2"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 2 }}
      >
        <ArrowBack sx={{ fontSize: 16 }} /> Back
      </Link>

      <Stack spacing={3}>
        <ProfileHero
          user={user}
          isLoading={isLoading}
          stats={{
            posts: posts.data?.pages[0]?.total ?? 0,
            resources: uploads ? resourceCount : undefined,
          }}
          actions={
            user?.isOpenToMentor ? (
              <RequestMentorshipButton
                mentorId={user.id}
                mentorName={user.name}
                slotsLeft={Math.max(0, user.maxActiveMentees - user.activeMenteeCount)}
                defaultTopic={user.mentorTopics[0]}
              />
            ) : undefined
          }
        />

        <Box>
          <Tabs
            value={tab}
            onChange={(_, v: ProfileTab) => setParams(v === "posts" ? {} : { tab: v }, { replace: true })}
            sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}
          >
            <Tab value="posts" label="Posts" />
            {uploads && <Tab value="resources" label="Resources" />}
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
              publicView
            />
          )}
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default PublicProfilePage;
