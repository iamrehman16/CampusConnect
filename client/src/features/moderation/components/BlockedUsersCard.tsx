import { Button, Card, Skeleton, Stack, Typography } from "@mui/material";
import UserAvatar from "@/shared/components/UserAvatar";
import { useBlockedUsers, useBlockToggle } from "../hooks/moderation.hooks";
import type { BlockedUser } from "../types/moderation.dto";

function BlockedRow({ user }: { user: BlockedUser }) {
  const { toggle, isPending } = useBlockToggle(user.id, user.name);
  return (
    <Stack direction="row" alignItems="center" gap={1.5}>
      <UserAvatar name={user.name} avatar={user.avatar} size={32} />
      <Typography variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0 }} noWrap>
        {user.name || "Unknown user"}
      </Typography>
      <Button size="small" variant="outlined" onClick={toggle} disabled={isPending}>
        Unblock
      </Button>
    </Stack>
  );
}

/** Settings: everyone you've blocked, with a way back (BACKLOG.md E16). */
export function BlockedUsersCard() {
  const { data, isLoading } = useBlockedUsers();

  return (
    <Card sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="subtitle1" fontWeight={600}>
        Blocked users
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Blocked people can't message you or send you mentorship requests, and you can't contact them.
      </Typography>
      {isLoading ? (
        <Skeleton variant="rounded" height={40} />
      ) : data && data.length > 0 ? (
        <Stack spacing={1.5}>
          {data.map((u) => (
            <BlockedRow key={u.id} user={u} />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          You haven't blocked anyone.
        </Typography>
      )}
    </Card>
  );
}
