/**
 * Mentorship lifecycle as a pure, table-driven state machine. This is the ONE
 * place that says which action is allowed from which status by which party;
 * the service derives its atomic update filters from the same table, so the
 * rules can't drift between "is it allowed" and "what the DB enforces".
 *
 *   pending --accept(mentor)--> active --complete(either)--> completed
 *      |--decline(mentor)--> declined
 *      '--cancel(mentee)---> cancelled
 */
export enum MentorshipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum MentorshipAction {
  ACCEPT = 'accept',
  DECLINE = 'decline',
  CANCEL = 'cancel',
  COMPLETE = 'complete',
}

export type MentorshipRole = 'mentor' | 'mentee';

export interface TransitionRule {
  from: readonly MentorshipStatus[];
  to: MentorshipStatus;
  /** Parties allowed to perform the action. */
  roles: readonly MentorshipRole[];
}

export const TRANSITIONS: Readonly<Record<MentorshipAction, TransitionRule>> = {
  [MentorshipAction.ACCEPT]: {
    from: [MentorshipStatus.PENDING],
    to: MentorshipStatus.ACTIVE,
    roles: ['mentor'],
  },
  [MentorshipAction.DECLINE]: {
    from: [MentorshipStatus.PENDING],
    to: MentorshipStatus.DECLINED,
    roles: ['mentor'],
  },
  [MentorshipAction.CANCEL]: {
    from: [MentorshipStatus.PENDING],
    to: MentorshipStatus.CANCELLED,
    roles: ['mentee'],
  },
  [MentorshipAction.COMPLETE]: {
    from: [MentorshipStatus.ACTIVE],
    to: MentorshipStatus.COMPLETED,
    roles: ['mentor', 'mentee'],
  },
};

/** Statuses in which a mentor/mentee pair is "in progress" (one per pair). */
export const OPEN_STATUSES: readonly MentorshipStatus[] = [
  MentorshipStatus.PENDING,
  MentorshipStatus.ACTIVE,
];

export type TransitionDenial = 'wrong_role' | 'wrong_status';

export type TransitionResult =
  | { ok: true; to: MentorshipStatus }
  | { ok: false; reason: TransitionDenial };

/** Would `role` be allowed to perform `action` on a mentorship in `status`? */
export function resolveTransition(
  status: MentorshipStatus,
  action: MentorshipAction,
  role: MentorshipRole,
): TransitionResult {
  const rule = TRANSITIONS[action];
  if (!rule.roles.includes(role)) return { ok: false, reason: 'wrong_role' };
  if (!rule.from.includes(status)) return { ok: false, reason: 'wrong_status' };
  return { ok: true, to: rule.to };
}
