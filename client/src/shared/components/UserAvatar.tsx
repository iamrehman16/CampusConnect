import Avatar from "@mui/material/Avatar";
import type { SxProps, Theme } from "@mui/material/styles";
import { resolveAvatarSrc } from "@/shared/constants/avatars";

interface UserAvatarProps {
  name?: string | null;
  /** Stored `user.avatar`: a built-in key ("alpha1") or an image URL. */
  avatar?: string | null;
  /** Pixel size; font scales with it. */
  size?: number;
  sx?: SxProps<Theme>;
}

function initials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * The one way to render a person's avatar. Resolves built-in avatar keys
 * (users store "alpha1", not a URL — passing that straight to <Avatar src>
 * was why avatars showed as letters everywhere but onboarding) and falls
 * back to initials.
 */
export default function UserAvatar({ name, avatar, size = 36, sx }: UserAvatarProps) {
  return (
    <Avatar
      src={resolveAvatarSrc(avatar)}
      alt={name ?? undefined}
      sx={[
        {
          width: size,
          height: size,
          fontSize: Math.max(11, Math.round(size * 0.4)),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {initials(name)}
    </Avatar>
  );
}
