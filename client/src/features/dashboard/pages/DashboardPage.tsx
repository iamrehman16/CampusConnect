import { Box, Stack } from "@mui/material";
import { PageContainer } from "@/shared/components/PageContainer";
import { GreetingStatsCard } from "../components/GreetingStatsCard";
import { AiAssistantCTA } from "../components/AiAssistantCta";
import {
  CommunityWidget,
  ContinueWidget,
  MentorshipWidget,
  MessagesWidget,
  SemesterResourcesWidget,
} from "../components/HomeWidgets";

/**
 * Home (BACKLOG.md D6) — what *this* student should do next, not platform
 * vanity stats: ask the assistant, continue recent AI chats, resources for
 * their semester, their mentors, unread messages and recent discussions.
 */
export default function HomePage() {
  return (
    <PageContainer width="default">
      <Stack spacing={3}>
        <GreetingStatsCard />
        <AiAssistantCTA />
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.6fr) minmax(0, 1fr)" },
            alignItems: "start",
          }}
        >
          <Stack spacing={3}>
            <ContinueWidget />
            <SemesterResourcesWidget />
          </Stack>
          <Stack spacing={3}>
            <MentorshipWidget />
            <MessagesWidget />
            <CommunityWidget />
          </Stack>
        </Box>
      </Stack>
    </PageContainer>
  );
}
