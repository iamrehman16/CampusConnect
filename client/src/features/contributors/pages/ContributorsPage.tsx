import { Box, Typography } from "@mui/material";
import { ContributorGrid } from "../components/ContributorGrid";
import { useUsers } from "@/features/user/hooks/user-hooks";
import { PageContainer } from '@/shared/components/PageContainer';

export default function ContributorsPage() {
  const { data, isLoading } = useUsers({ role: "Contributor" }); // UserFilterParam

  return (
    <PageContainer>
      <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Contributors
      </Typography>
      <ContributorGrid users={data?.data ?? []} isLoading={isLoading} />
    </Box>
    </PageContainer>
  );
}
