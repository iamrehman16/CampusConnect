/**
 * Built-in avatar set. Users store the *key* (e.g. "alpha1") in
 * `user.avatar`; resolve it with `resolveAvatarSrc` (UserAvatar does this).
 */
import alpha1 from "@/assets/avatars/alpha1.svg";
import alpha2 from "@/assets/avatars/alpha2.svg";
import alpha3 from "@/assets/avatars/alpha3.svg";
import alpha4 from "@/assets/avatars/alpha4.svg";
import beta1 from "@/assets/avatars/beta1.svg";
import beta2 from "@/assets/avatars/beta2.svg";
import beta3 from "@/assets/avatars/beta3.svg";
import beta4 from "@/assets/avatars/beta4.svg";

export const AVATARS = [
  "alpha1",
  "alpha2",
  "alpha3",
  "alpha4",
  "beta1",
  "beta2",
  "beta3",
  "beta4",
];

export const AVATAR_IMAGES: Record<string, string> = {
  alpha1,
  alpha2,
  alpha3,
  alpha4,
  beta1,
  beta2,
  beta3,
  beta4,
};

/** Maps a stored avatar value (built-in key or URL) to an image src. */
export function resolveAvatarSrc(avatar?: string | null): string | undefined {
  if (!avatar) return undefined;
  if (AVATAR_IMAGES[avatar]) return AVATAR_IMAGES[avatar];
  return /^(https?:|data:|blob:|\/)/.test(avatar) ? avatar : undefined;
}
