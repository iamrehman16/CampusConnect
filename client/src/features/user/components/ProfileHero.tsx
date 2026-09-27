import React from "react";
import { Box, Card, Chip, Divider, IconButton, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { PhotoCamera } from "@/shared/icons";
import { UserRole } from "@/shared/types/enums";
import { TierChip } from "@/features/reputation/components/TierChip";
import { BadgeStrip } from "@/features/reputation/components/BadgeStrip";
import UserAvatar from "@/shared/components/UserAvatar";
import { MentorProfileBlock } from "./MentorProfileBlock";
import type { ProfileStats, ProfileUserViewModel } from "../types/profile.types";

interface ProfileHeroProps {
  user: ProfileUserViewModel | null;
  stats?: ProfileStats;
  isLoading?: boolean;
  /** One action at most: Edit profile (own) or Request mentorship (public). */
  actions?: React.ReactNode;
  /** Own profile only: opens the avatar chooser. */
  onAvatarClick?: () => void;
}

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  [UserRole.CONTRIBUTOR]: "Contributor",
  [UserRole.ADMIN]: "Admin",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function TagRow({ label, tags }: { label: string; tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <Stack direction={{ xs: "column", sm: "row" }} gap={{ xs: 0.75, sm: 2 }} alignItems={{ sm: "baseline" }}>
      <Typography variant="caption" color="text.tertiary" fontWeight={600} sx={{ width: { sm: 72 }, flexShrink: 0 }}>
        {label}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        {tags.map((t) => (
          <Chip key={t} label={t} size="small" variant="outlined" />
        ))}
      </Stack>
    </Stack>
  );
}

/**
 * Profile header (BACKLOG.md D9): avatar, name + tier, one line of
 * programme · semester · joined, stats as a quiet inline line, one action.
 * Replaces four coloured stat tiles (Posts / Approved / Pending / Rejected)
 * that were meaningless for students and duplicated the Resources filter.
 */
const ProfileHero: React.FC<ProfileHeroProps> = ({ user, stats, isLoading, actions, onAvatarClick }) => {
  if (isLoading || !user) {
    return (
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" gap={2.5} alignItems="center">
          <Skeleton variant="circular" width={80} height={80} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width={200} height={32} />
            <Skeleton width={280} />
            <Skeleton width={160} />
          </Box>
        </Stack>
      </Card>
    );
  }

  const joined = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const meta = [
    user.academicInfo,
    user.semester ? `Semester ${user.semester}` : undefined,
    `Joined ${joined}`,
  ].filter(Boolean);
  const statParts = stats
    ? [
        plural(stats.posts, "post"),
        stats.resources !== undefined ? `${plural(stats.resources, "resource")} shared` : undefined,
        user.isOpenToMentor ? plural(user.activeMenteeCount, "mentee") : undefined,
      ].filter(Boolean)
    : [];
  const roleLabel = ROLE_LABEL[user.role];
  const hasDetails =
    Boolean(user.expertiseTags?.length) || Boolean(user.interests?.length) || user.isOpenToMentor;

  return (
    <Card sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} gap={{ xs: 1.5, sm: 2.5 }} alignItems={{ xs: "flex-start", sm: "center" }}>
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <UserAvatar name={user.name} avatar={user.avatar} size={80} />
          {onAvatarClick && (
            <Tooltip title="Change avatar">
              <IconButton
                onClick={onAvatarClick}
                aria-label="Change avatar"
                sx={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 28,
                  height: 28,
                  bgcolor: "surface.card",
                  border: "1px solid",
                  borderColor: "border.default",
                  "&:hover": { bgcolor: "surface.subtle" },
                }}
              >
                <PhotoCamera sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h5" component="h1" fontWeight={700} sx={{ letterSpacing: "-0.01em", lineHeight: 1.25 }}>
              {user.name}
            </Typography>
            <TierChip tier={user.tier} hideNewcomer />
            {roleLabel && <Chip size="small" label={roleLabel} color={user.role === UserRole.ADMIN ? "primary" : "default"} />}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {meta.join(" · ")}
          </Typography>
          {statParts.length > 0 && (
            <Typography variant="body2" color="text.tertiary" sx={{ mt: 0.25 }}>
              {statParts.join(" · ")}
            </Typography>
          )}
        </Box>

        {actions && <Box sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "center" } }}>{actions}</Box>}
      </Stack>

      <Box sx={{ mt: 1.5, "&:empty": { display: "none" } }}>
        <BadgeStrip userId={user.id} />
      </Box>

      {hasDetails && (
        <>
          <Divider sx={{ my: 2.5 }} />
          <Stack spacing={1.5}>
            <TagRow label="Skills" tags={user.expertiseTags} />
            <TagRow label="Interests" tags={user.interests} />
          </Stack>
          <MentorProfileBlock user={user} />
        </>
      )}
    </Card>
  );
};

export default ProfileHero;
