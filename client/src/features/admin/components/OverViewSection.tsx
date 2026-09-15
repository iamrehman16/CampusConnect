// features/admin/components/OverviewSection.tsx
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ForumIcon from "@mui/icons-material/Forum";
import StatCard from "./StatCard";
import { useOverviewStats } from "../hooks/admin-hooks";

export default function OverviewSection() {
  const { data, isLoading, isError } = useOverviewStats();

  if (isError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load overview stats.
      </Alert>
    );
  }

  const cards = [
    {
      label: "Total users",
      value: data?.users.total ?? 0,
      sub: `${data?.users.contributors ?? 0} contributors`,
      icon: PeopleIcon,
      iconColor: "primary.main",
    },
    {
      label: "Total resources",
      value: data?.resources.total ?? 0,
      sub: `${data?.resources.uploadedPastWeek ?? 0} uploaded this week`,
      icon: LibraryBooksIcon,
      iconColor: "secondary.main",
    },
    {
      label: "Pending approvals",
      value: data?.resources.pending ?? 0,
      sub: "awaiting review",
      icon: SchoolIcon,
      iconColor: "warning.main",
    },
    {
      label: "Community posts",
      value: data?.posts.total ?? 0,
      sub: `${data?.posts.recent ?? 0} in last 7 days`,
      icon: ForumIcon,
      iconColor: "info.main",
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.label}>
          <StatCard {...card} loading={isLoading} />
        </Grid>
      ))}
    </Grid>
  );
}
