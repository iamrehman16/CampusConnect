import { MentorSummaryDto } from '../user/dto/mentor-summary.dto';

/**
 * What an answer was about, used to pick mentors for the "Ask a human"
 * handoff (BACKLOG.md E14). Subjects/courses come from the cited resources;
 * the question text is the fallback when nothing was retrieved.
 *
 * Interim matcher: E12 (recommended mentors) will replace this with a shared
 * scorer — keep it pure so it can be swapped or reused without moving code.
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
