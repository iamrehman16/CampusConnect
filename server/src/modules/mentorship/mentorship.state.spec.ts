import {
  MentorshipAction,
  MentorshipRole,
  MentorshipStatus,
  OPEN_STATUSES,
  TRANSITIONS,
  resolveTransition,
} from './mentorship.state';

const ALL_STATUSES = Object.values(MentorshipStatus);
const ALL_ACTIONS = Object.values(MentorshipAction);
const ROLES: MentorshipRole[] = ['mentor', 'mentee'];

describe('resolveTransition — the allowed moves', () => {
  it.each([
    [
      MentorshipStatus.PENDING,
      MentorshipAction.ACCEPT,
      'mentor',
      MentorshipStatus.ACTIVE,
    ],
    [
      MentorshipStatus.PENDING,
      MentorshipAction.DECLINE,
      'mentor',
      MentorshipStatus.DECLINED,
    ],
    [
      MentorshipStatus.PENDING,
      MentorshipAction.CANCEL,
      'mentee',
      MentorshipStatus.CANCELLED,
    ],
    [
      MentorshipStatus.ACTIVE,
      MentorshipAction.COMPLETE,
      'mentor',
      MentorshipStatus.COMPLETED,
    ],
    [
      MentorshipStatus.ACTIVE,
      MentorshipAction.COMPLETE,
      'mentee',
      MentorshipStatus.COMPLETED,
    ],
  ] as const)('%s + %s by %s -> %s', (status, action, role, to) => {
    expect(resolveTransition(status, action, role)).toEqual({ ok: true, to });
  });
});

describe('resolveTransition — the denials', () => {
  it('the mentee cannot accept or decline their own request', () => {
    for (const action of [MentorshipAction.ACCEPT, MentorshipAction.DECLINE]) {
      expect(
        resolveTransition(MentorshipStatus.PENDING, action, 'mentee'),
      ).toEqual({
        ok: false,
        reason: 'wrong_role',
      });
    }
  });

  it('the mentor cannot cancel on the mentee’s behalf', () => {
    expect(
      resolveTransition(
        MentorshipStatus.PENDING,
        MentorshipAction.CANCEL,
        'mentor',
      ),
    ).toEqual({ ok: false, reason: 'wrong_role' });
  });

  it('cannot accept twice, or act on a finished mentorship', () => {
    for (const status of [
      MentorshipStatus.ACTIVE,
      MentorshipStatus.DECLINED,
      MentorshipStatus.CANCELLED,
      MentorshipStatus.COMPLETED,
    ]) {
      expect(
        resolveTransition(status, MentorshipAction.ACCEPT, 'mentor'),
      ).toEqual({
        ok: false,
        reason: 'wrong_status',
      });
    }
  });

  it('cannot complete something that was never accepted', () => {
    expect(
      resolveTransition(
        MentorshipStatus.PENDING,
        MentorshipAction.COMPLETE,
        'mentor',
      ),
    ).toEqual({ ok: false, reason: 'wrong_status' });
  });

  it('terminal statuses allow no action by anyone', () => {
    const terminal = [
      MentorshipStatus.DECLINED,
      MentorshipStatus.CANCELLED,
      MentorshipStatus.COMPLETED,
    ];
    for (const status of terminal) {
      for (const action of ALL_ACTIONS) {
        for (const role of ROLES) {
          expect(resolveTransition(status, action, role).ok).toBe(false);
        }
      }
    }
  });
});

describe('transition table invariants', () => {
  it('every rule moves to a status that is not one of its own sources', () => {
    for (const rule of Object.values(TRANSITIONS)) {
      expect(rule.from).not.toContain(rule.to);
    }
  });

  it('only pending and active count as open (one open mentorship per pair)', () => {
    expect([...OPEN_STATUSES].sort()).toEqual(
      [MentorshipStatus.ACTIVE, MentorshipStatus.PENDING].sort(),
    );
    // Every status is either open or reachable-to-and-terminal.
    for (const s of ALL_STATUSES) {
      const leavesOpen = Object.values(TRANSITIONS).some((r) =>
        r.from.includes(s),
      );
      expect(leavesOpen).toBe(OPEN_STATUSES.includes(s));
    }
  });
});
