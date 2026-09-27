import { useState } from "react";
import { Button, Skeleton, Stack, Typography } from "@mui/material";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import UserAvatar from "@/shared/components/UserAvatar";
import ProfileAvatarDialog from "../components/ProfileAvatarDialog";
import ProfileSettingsForm from "../components/ProfileSettingsForm";
import { useMyProfile, useUpdateProfile } from "../hooks/profile-hooks";
import { toProfileUserViewModel } from "../types/profile.types";

/**
 * Account settings (BACKLOG.md D9) — moved out of a Profile tab so the
 * profile reads as a profile, and "Settings" in the account menu lands on
 * a page of its own.
 */
export default function SettingsPage() {
  const { data: profile, isLoading } = useMyProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const user = toProfileUserViewModel(profile);

  return (
    <PageContainer width="narrow">
      <PageHeader title="Settings" subtitle="Your profile details and mentoring preferences." />
      {isLoading || !user ? (
        <Stack spacing={3}>
          <Skeleton variant="rounded" height={320} />
          <Skeleton variant="rounded" height={140} />
        </Stack>
      ) : (
        <ProfileSettingsForm
          user={user}
          onSave={updateProfile}
          isSaving={isPending}
          avatarSlot={
            <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
              <UserAvatar name={user.name} avatar={user.avatar} size={56} />
              <Stack>
                <Typography variant="body2" fontWeight={600}>
                  Avatar
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setAvatarOpen(true)}
                  sx={{ alignSelf: "flex-start", px: 0, minWidth: 0 }}
                >
                  Change avatar
                </Button>
              </Stack>
            </Stack>
          }
        />
      )}
      <ProfileAvatarDialog
        open={avatarOpen}
        selectedAvatar={user?.avatar}
        onClose={() => setAvatarOpen(false)}
        onSelect={(avatar) => {
          setAvatarOpen(false);
          updateProfile({ avatar });
        }}
      />
    </PageContainer>
  );
}
