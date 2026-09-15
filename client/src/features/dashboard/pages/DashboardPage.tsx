import { Box, Stack } from "@mui/material";
import { PageContainer } from "@/shared/components/PageContainer";
import { GreetingStatsCard } from "../components/GreetingStatsCard";
import { AiAssistantCTA } from "../components/AiAssistantCta";
import { TrendingResourcesRow } from "../components/TrendingResourcesRow";
import { PlatformStatsBar } from "../components/PlatformStatsBar";

export default function HomePage() {
  return (
    <PageContainer>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 1200, mx: "auto" }}>
        <Stack spacing={3}>
          <GreetingStatsCard />
          <AiAssistantCTA />
          <TrendingResourcesRow />
          <PlatformStatsBar />
        </Stack>
      </Box>
    </PageContainer>
  );
}
