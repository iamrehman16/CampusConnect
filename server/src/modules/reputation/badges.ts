/**
 * Badge catalog. Badges are COMPUTED from current facts at read time (never
 * stored), so they can't drift from reality — delete your only resource and
 * "First resource" goes away. Pure and unit-tested.
 *
 * Deliberately no download-count badge: the download endpoint is anonymous
 * (see reputation.points.ts), so it would be trivially farmable.
 * Mentorship badges ("First mentee", ...) arrive with E10/E11 by adding a
 * stat and a definition here.
 */
export interface BadgeStats {
  approvedResources: number;
  posts: number;
  upvotesReceived: number;
}

export interface BadgeDefinition {
  key: string;
  label: string;
  description: string;
  earned: (stats: BadgeStats) => boolean;
}

export interface EarnedBadge {
  key: string;
  label: string;
  description: string;
}

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    key: 'first_resource',
    label: 'First resource',
    description: 'Had a resource approved',
    earned: (s) => s.approvedResources >= 1,
  },
  {
    key: 'resource_library',
    label: 'Resource library',
    description: 'Has 5 approved resources',
    earned: (s) => s.approvedResources >= 5,
  },
  {
    key: 'first_post',
    label: 'Conversation starter',
    description: 'Shared a post with the community',
    earned: (s) => s.posts >= 1,
  },
  {
    key: 'well_received',
    label: 'Well received',
    description: 'Earned upvotes from 10 different people',
    earned: (s) => s.upvotesReceived >= 10,
  },
];

export function evaluateBadges(stats: BadgeStats): EarnedBadge[] {
  return BADGE_DEFINITIONS.filter((b) => b.earned(stats)).map(
    ({ key, label, description }) => ({ key, label, description }),
  );
}
