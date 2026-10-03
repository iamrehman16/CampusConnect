import { MentorSummaryDto } from '../user/dto/mentor-summary.dto';
import { ReputationTier } from '../reputation/tiers';
import { rankMentors, scoreMentor } from './mentor-matching';

function mentor(
  id: string,
  topics: string[],
  extra: Partial<MentorSummaryDto> = {},
): MentorSummaryDto {
  return {
    id,
    name: id,
    role: 'contributor' as MentorSummaryDto['role'],
    tier: ReputationTier.NEWCOMER,
    contributionScore: 0,
    expertise: [],
    mentorTopics: topics,
    maxActiveMentees: 3,
    slotsLeft: 2,
    ...extra,
  };
}

const none = { subjects: [], courses: [], question: '' };

describe('scoreMentor', () => {
  it('scores an exact subject match highest', () => {
    const exact = scoreMentor(mentor('a', ['Data Structures']), {
      ...none,
      subjects: ['Data Structures'],
    });
    const partial = scoreMentor(
      mentor('b', ['Data Structures and Algorithms']),
      {
        ...none,
        subjects: ['Data Structures'],
      },
    );

    expect(exact.score).toBeGreaterThan(partial.score);
    expect(partial.score).toBeGreaterThan(0);
    expect(exact.matchedOn).toEqual(['Data Structures']);
  });

  it('matches a course code inside a topic label', () => {
    const s = scoreMentor(mentor('a', ['CS-201 labs']), {
      ...none,
      courses: ['CS-201'],
    });

    expect(s.score).toBeGreaterThan(0);
  });

  it('falls back to the question text when nothing was cited', () => {
    const s = scoreMentor(mentor('a', ['Database Systems', 'SQL']), {
      ...none,
      question: 'How do I write a join in SQL?',
    });

    expect(s.matchedOn).toContain('SQL');
  });

  it('ignores stopwords and short words in the question', () => {
    const s = scoreMentor(mentor('a', ['Tell me about things']), {
      ...none,
      question: 'tell me about it',
    });

    expect(s.score).toBe(0);
  });

  it('scores 0 for an unrelated mentor', () => {
    const s = scoreMentor(mentor('a', ['Graphic Design']), {
      ...none,
      subjects: ['Operating Systems'],
      question: 'What is a page fault?',
    });

    expect(s.score).toBe(0);
  });
});

describe('rankMentors', () => {
  const terms = { ...none, subjects: ['Data Structures'] };

  it('returns at most `limit` mentors, best first', () => {
    const ranked = rankMentors(
      [
        mentor('partial', ['Data Structures and Algorithms']),
        mentor('exact', ['Data Structures']),
        mentor('other', ['Painting']),
        mentor('exact2', ['Data Structures'], { contributionScore: 50 }),
      ],
      terms,
      2,
    );

    expect(ranked.map((r) => r.mentor.id)).toEqual(['exact2', 'exact']);
  });

  it('breaks match ties by reputation, then id, deterministically', () => {
    const ranked = rankMentors(
      [
        mentor('b', ['Data Structures'], { contributionScore: 10 }),
        mentor('a', ['Data Structures'], { contributionScore: 10 }),
        mentor('c', ['Data Structures'], { contributionScore: 99 }),
      ],
      terms,
      3,
    );

    expect(ranked.map((r) => r.mentor.id)).toEqual(['c', 'a', 'b']);
  });

  it('returns nothing when no mentor overlaps', () => {
    expect(rankMentors([mentor('x', ['Painting'])], terms, 3)).toEqual([]);
  });
});
