import { MentorSummaryDto } from './dto/mentor-summary.dto';
import { ReputationTier } from '../reputation/tiers';
import {
  rankMentors,
  recommendMentors,
  scoreForProfile,
  scoreMentor,
} from './mentor-matching';

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
    ratingAverage: null,
    ratingCount: 0,
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

describe('scoreForProfile (E12)', () => {
  const m = (extra: Partial<MentorSummaryDto> = {}) =>
    mentor('m', ['Data Structures'], extra);

  it('scores an interest overlap and explains it', () => {
    const r = scoreForProfile(m(), { interests: ['Data Structures'] });

    expect(r.score).toBe(4);
    expect(r.reasons).toEqual(['Helps with Data Structures']);
  });

  it('matches on a shared distinctive word but not on a generic one', () => {
    const real = scoreForProfile(mentor('a', ['Machine Learning']), {
      interests: ['Learning'],
    });
    const generic = scoreForProfile(mentor('b', ['Operating Systems']), {
      interests: ['Database Systems'],
    });

    expect(real.score).toBeGreaterThan(0);
    expect(generic.score).toBe(0); // "systems" alone is too generic
  });

  it('caps the interest score so one mentor with many topics cannot dominate', () => {
    const r = scoreForProfile(
      mentor('a', ['Graphs', 'Trees', 'Sorting', 'Hashing', 'Heaps']),
      { interests: ['Graphs', 'Trees', 'Sorting', 'Hashing', 'Heaps'] },
    );

    expect(r.score).toBe(12);
  });

  it('adds department and a seniority bonus on top of a real match', () => {
    const r = scoreForProfile(
      m({ department: 'Computer Science', semester: 8 }),
      {
        interests: ['Data Structures'],
        department: 'computer science',
        semester: 4,
      },
    );

    expect(r.score).toBe(4 + 3 + 2);
    expect(r.reasons).toEqual([
      'Helps with Data Structures',
      'Same department',
      'Senior (semester 8)',
    ]);
  });

  it('never qualifies a mentor on seniority alone', () => {
    const r = scoreForProfile(mentor('a', ['Painting'], { semester: 8 }), {
      interests: ['Data Structures'],
      semester: 2,
    });

    expect(r.score).toBe(0);
  });

  it("doesn't give a bonus to a mentor who is not further along", () => {
    const r = scoreForProfile(m({ semester: 3 }), {
      interests: ['Data Structures'],
      semester: 5,
    });

    expect(r.score).toBe(4);
  });
});

describe('scoreForProfile rating bonus (E11)', () => {
  const base = { interests: ['Data Structures'] };
  const rated = (average: number | null, count: number) =>
    mentor('m', ['Data Structures'], {
      ratingAverage: average,
      ratingCount: count,
    });

  it('adds a point for a well-rated mentor and says so', () => {
    const r = scoreForProfile(rated(4.8, 5), base);

    expect(r.score).toBe(4 + 1);
    expect(r.reasons).toContain('Rated 4.8/5');
  });

  it('needs at least 3 ratings, so one 5-star rating moves nothing', () => {
    expect(scoreForProfile(rated(5, 2), base).score).toBe(4);
  });

  it('needs an average of 4.5 or better', () => {
    expect(scoreForProfile(rated(4.4, 10), base).score).toBe(4);
    expect(scoreForProfile(rated(4.5, 10), base).score).toBe(5);
  });

  it('never qualifies a mentor on rating alone', () => {
    const r = scoreForProfile(
      mentor('m', ['Painting'], { ratingAverage: 5, ratingCount: 50 }),
      base,
    );

    expect(r.score).toBe(0);
  });
});

describe('recommendMentors (E12)', () => {
  const pool = [
    mentor('ds', ['Data Structures'], { contributionScore: 10 }),
    mentor('db', ['Database Systems'], { contributionScore: 90 }),
    mentor('art', ['Painting'], { contributionScore: 500 }),
  ];

  it('ranks by profile match and flags the result as personalized', () => {
    const r = recommendMentors(pool, { interests: ['Data Structures'] }, 3);

    expect(r.personalized).toBe(true);
    expect(r.mentors.map((x) => x.mentor.id)).toEqual(['ds']);
  });

  it('breaks equal scores by reputation, then id', () => {
    const r = recommendMentors(
      [
        mentor('b', ['Graphs'], { contributionScore: 5 }),
        mentor('a', ['Graphs'], { contributionScore: 5 }),
        mentor('c', ['Graphs'], { contributionScore: 50 }),
      ],
      { interests: ['Graphs'] },
      3,
    );

    expect(r.mentors.map((x) => x.mentor.id)).toEqual(['c', 'a', 'b']);
  });

  it('cold start: no interests -> top contributors, honestly labelled', () => {
    const r = recommendMentors(pool, { interests: [] }, 2);

    expect(r.personalized).toBe(false);
    expect(r.mentors.map((x) => x.mentor.id)).toEqual(['art', 'db']);
    expect(r.mentors[0].reasons).toEqual(['Top contributor']);
  });

  it('cold start also applies when interests exist but nothing matches', () => {
    const r = recommendMentors(pool, { interests: ['Underwater Basketry'] }, 1);

    expect(r.personalized).toBe(false);
  });

  it('a department alone is enough to personalize when interests are unset', () => {
    const r = recommendMentors(
      [mentor('cs', ['Painting'], { department: 'CS' })],
      { interests: [], department: 'CS' },
      3,
    );

    expect(r.personalized).toBe(true);
    expect(r.mentors[0].reasons).toEqual(['Same department']);
  });

  it('returns an empty list when there are no mentors at all', () => {
    expect(recommendMentors([], { interests: ['x'] }, 3)).toEqual({
      mentors: [],
      personalized: false,
    });
  });

  it('is deterministic: the same input gives the same order', () => {
    const a = recommendMentors(pool, { interests: ['Data Structures'] }, 3);
    const b = recommendMentors(
      [...pool].reverse(),
      { interests: ['Data Structures'] },
      3,
    );

    expect(a.mentors.map((x) => x.mentor.id)).toEqual(
      b.mentors.map((x) => x.mentor.id),
    );
  });
});
