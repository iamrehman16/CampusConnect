import { MentorSummaryDto } from './dto/mentor-summary.dto';

/**
 * What an answer was about, used to pick mentors for the "Ask a human"
 * handoff (BACKLOG.md E14). Subjects/courses come from the cited resources;
 * the question text is the fallback when nothing was retrieved.
 *
 * Two pure scorers live here, both unit-tested, no ML:
 *   - `rankMentors`      — contextual: what an AI answer was about (E14)
 *   - `recommendMentors` — profile-based: who a student should meet (E12)
 */
export interface MatchTerms {
  subjects: string[];
  courses: string[];
  question: string;
}

export interface ScoredMentor {
  mentor: MentorSummaryDto;
  score: number;
  /** The mentor's own topic/expertise labels that matched, for display. */
  matchedOn: string[];
}

const SUBJECT_EXACT = 5;
const COURSE_CODE = 4;
const SUBJECT_PARTIAL = 3;
const QUESTION_PHRASE = 3;
const QUESTION_WORD = 1;
const QUESTION_WORD_CAP = 3;
const MIN_WORD_LENGTH = 4;

const STOPWORDS = new Set([
  'about',
  'what',
  'when',
  'where',
  'which',
  'who',
  'how',
  'why',
  'does',
  'with',
  'that',
  'this',
  'from',
  'explain',
  'difference',
  'between',
  'tell',
  'please',
  'give',
  'example',
  'examples',
  'help',
  'need',
  'want',
  'like',
  'into',
  'your',
  'have',
  'would',
  'could',
  'should',
  'there',
  'their',
  'them',
  'then',
  'than',
  'also',
  'some',
  'more',
  'most',
  'work',
  'works',
  'using',
  'used',
]);

const norm = (s: string) => s.trim().toLowerCase();

function wordsOf(text: string): string[] {
  return norm(text)
    .split(/[^a-z0-9+#]+/)
    .filter((w) => w.length >= MIN_WORD_LENGTH && !STOPWORDS.has(w));
}

/** Score one mentor against the terms; 0 means no relevant overlap. */
export function scoreMentor(
  mentor: MentorSummaryDto,
  terms: MatchTerms,
): ScoredMentor {
  const labels = [...mentor.mentorTopics, ...mentor.expertise];
  const subjects = terms.subjects.map(norm).filter(Boolean);
  const courses = terms.courses.map(norm).filter(Boolean);
  const question = norm(terms.question);
  const questionWords = new Set(wordsOf(terms.question));

  let score = 0;
  const matchedOn: string[] = [];

  for (const label of labels) {
    const l = norm(label);
    if (!l) continue;
    let labelScore = 0;

    for (const s of subjects) {
      if (l === s) labelScore = Math.max(labelScore, SUBJECT_EXACT);
      else if (l.includes(s) || s.includes(l))
        labelScore = Math.max(labelScore, SUBJECT_PARTIAL);
    }
    for (const c of courses) {
      if (l.includes(c)) labelScore = Math.max(labelScore, COURSE_CODE);
    }
    if (question && question.includes(l)) {
      labelScore = Math.max(labelScore, QUESTION_PHRASE);
    } else {
      const overlap = wordsOf(l).filter((w) => questionWords.has(w)).length;
      labelScore = Math.max(
        labelScore,
        Math.min(overlap * QUESTION_WORD, QUESTION_WORD_CAP),
      );
    }

    if (labelScore > 0) {
      score += labelScore;
      matchedOn.push(label);
    }
  }

  return { mentor, score, matchedOn };
}

/**
 * Best `limit` mentors with any overlap, ranked by match score, then
 * reputation, then id so the order is deterministic.
 */
export function rankMentors(
  mentors: MentorSummaryDto[],
  terms: MatchTerms,
  limit: number,
): ScoredMentor[] {
  return mentors
    .map((m) => scoreMentor(m, terms))
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.mentor.contributionScore - a.mentor.contributionScore ||
        a.mentor.id.localeCompare(b.mentor.id),
    )
    .slice(0, limit);
}

// ─── Profile-based recommendation (BACKLOG.md E12) ──────────────────────────

/** The mentee-side signals collected at onboarding. */
export interface MenteeProfile {
  interests: string[];
  department?: string;
  semester?: number;
}

/**
 * Scoring, in one place so it is easy to explain and to change:
 *
 *   +4  per mentor topic/expertise label that overlaps one of the student's
 *       interests (capped at 12). Overlap = same phrase, one contains the
 *       other, or a shared non-generic word ("development" or "systems"
 *       alone is too generic to count).
 *   +3  same department.
 *   +2  mentor is further along (semester greater)
 *   +1  well rated: average >= 4.5 from at least 3 ratings (E11)
 *
 * The last two are BONUSES only: neither qualifies a mentor on its own,
 * otherwise every senior (or one 5-star mentor) would match everyone. The
 * 3-rating minimum keeps a single rating from moving anyone. Capacity is a
 * precondition (callers pass only mentors with a free slot) and reputation
 * breaks ties.
 */
const INTEREST_OVERLAP = 4;
const INTEREST_CAP = 12;
const SAME_DEPARTMENT = 3;
const SENIOR_BONUS = 2;
const WELL_RATED_BONUS = 1;
const WELL_RATED_MIN_AVERAGE = 4.5;
const WELL_RATED_MIN_COUNT = 3;

/** Words too common in course/topic names to mean two labels are the same subject. */
const GENERIC_WORDS = new Set([
  'data',
  'development',
  'systems',
  'design',
  'engineering',
  'science',
  'introduction',
  'basics',
  'fundamentals',
  'advanced',
  'applied',
  'computer',
]);

function distinctiveWords(text: string): string[] {
  return wordsOf(text).filter((w) => !GENERIC_WORDS.has(w));
}

function labelsOverlap(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const yWords = new Set(distinctiveWords(y));
  return distinctiveWords(x).some((w) => yWords.has(w));
}

export interface RecommendedMentor {
  mentor: MentorSummaryDto;
  score: number;
  /** Short, human-readable reasons shown in the UI. */
  reasons: string[];
}

export function scoreForProfile(
  mentor: MentorSummaryDto,
  mentee: MenteeProfile,
): RecommendedMentor {
  const labels = [...mentor.mentorTopics, ...mentor.expertise];
  const matchedLabels = labels.filter((label) =>
    mentee.interests.some((interest) => labelsOverlap(label, interest)),
  );
  const topicScore = Math.min(
    matchedLabels.length * INTEREST_OVERLAP,
    INTEREST_CAP,
  );

  const sameDepartment =
    !!mentee.department &&
    !!mentor.department &&
    norm(mentee.department) === norm(mentor.department);
  const departmentScore = sameDepartment ? SAME_DEPARTMENT : 0;

  const qualifying = topicScore + departmentScore;
  const isSenior =
    qualifying > 0 &&
    !!mentee.semester &&
    !!mentor.semester &&
    mentor.semester > mentee.semester;
  const seniorScore = isSenior ? SENIOR_BONUS : 0;

  const isWellRated =
    qualifying > 0 &&
    mentor.ratingAverage !== null &&
    mentor.ratingAverage >= WELL_RATED_MIN_AVERAGE &&
    mentor.ratingCount >= WELL_RATED_MIN_COUNT;
  const ratingScore = isWellRated ? WELL_RATED_BONUS : 0;

  const reasons: string[] = [];
  if (matchedLabels.length > 0) {
    reasons.push(`Helps with ${matchedLabels.slice(0, 2).join(', ')}`);
  }
  if (sameDepartment) reasons.push('Same department');
  if (isSenior) reasons.push(`Senior (semester ${mentor.semester})`);
  if (isWellRated) reasons.push(`Rated ${mentor.ratingAverage}/5`);

  return { mentor, score: qualifying + seniorScore + ratingScore, reasons };
}

export interface RecommendationResult {
  mentors: RecommendedMentor[];
  /**
   * False when nothing matched the student's profile (or they've set no
   * interests / department yet) and these are the most reputable available
   * mentors instead — the UI says so instead of claiming it's "for you".
   */
  personalized: boolean;
}

const byReputation = (a: MentorSummaryDto, b: MentorSummaryDto) =>
  b.contributionScore - a.contributionScore || a.id.localeCompare(b.id);

/** Best `limit` mentors for a student; falls back gracefully on a cold start. */
export function recommendMentors(
  mentors: MentorSummaryDto[],
  mentee: MenteeProfile,
  limit: number,
): RecommendationResult {
  const matched = mentors
    .map((m) => scoreForProfile(m, mentee))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || byReputation(a.mentor, b.mentor));

  if (matched.length > 0) {
    return { mentors: matched.slice(0, limit), personalized: true };
  }

  return {
    mentors: [...mentors]
      .sort(byReputation)
      .slice(0, limit)
      .map((mentor) => ({
        mentor,
        score: 0,
        reasons: ['Top contributor'],
      })),
    personalized: false,
  };
}
