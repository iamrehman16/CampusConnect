import { Box, Skeleton } from "@mui/material";
import { ContributorCard } from "./ContributorCard";
import type { User } from "@/shared/types/auth.types";

interface Props {
  users: User[];
  isLoading: boolean;
}

export function ContributorGrid({ users, isLoading }: Props) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 2,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={140} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 2,
      }}
    >
      {users.map((user) => (
        <ContributorCard key={user._id} user={user} />
      ))}
    </Box>
  );
}
