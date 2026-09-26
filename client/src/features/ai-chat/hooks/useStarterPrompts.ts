import { useMemo } from "react";
import { useResources } from "@/features/resources/hooks/resource.hooks";
import { useMyProfile } from "@/features/user/hooks/profile-hooks";
import { ApprovalStatus, ResourceSort } from "@/shared/types/enums";

export interface StarterPrompt {
  /** Short text for a chip/card. */
  label: string;
  /** What gets sent (or prefilled) when picked. */
  prompt: string;
  /** Secondary line, e.g. the course code. */
  hint?: string;
}

// Used only when the library has nothing approved yet.
const FALLBACK: StarterPrompt[] = [
  { label: "Make me a revision plan for this week", prompt: "Make me a revision plan for this week" },
  { label: "Explain a topic I'm stuck on", prompt: "Can you explain a topic I'm stuck on step by step?" },
  { label: "Quiz me on my course", prompt: "Quiz me with 5 questions on my current course" },
];

/**
 * Starter questions for the assistant (BACKLOG.md D8), grounded in what's
 * actually in the library so the first answer comes back cited: the most
 * downloaded approved resources for the student's semester, falling back
 * to library-wide when their semester has none. The semester query is the
 * same one as Home's "Popular for semester N" list, so it's shared there.
 */
export function useStarterPrompts(limit: number): StarterPrompt[] {
  const { data: profile } = useMyProfile();
  const semester = profile?.semester;
  const base = { status: ApprovalStatus.APPROVED, sort: ResourceSort.POPULAR };
  const forSemester = useResources({ ...base, semester });
  const library = useResources(base);

  return useMemo(() => {
    // Nothing (rather than the fallback) while loading, so cards don't
    // swap under the user's cursor.
    if (!forSemester.data) return [];
    const semesterItems = forSemester.data.pages[0]?.data ?? [];
    if (semesterItems.length === 0 && !library.data) return [];
    const source =
      semesterItems.length > 0 ? semesterItems : (library.data?.pages[0]?.data ?? []);
    // One per course first, so four cards don't all say "CS-311"; then
    // fill any remaining slots in popularity order.
    const seenCourses = new Set<string>();
    const firstPerCourse = source.filter((r) => {
      if (seenCourses.has(r.course)) return false;
      seenCourses.add(r.course);
      return true;
    });
    const rest = source.filter((r) => !firstPerCourse.includes(r));
    const prompts: StarterPrompt[] = [...firstPerCourse, ...rest]
      .slice(0, limit)
      .map((r) => ({
        label: r.title,
        prompt: `Help me revise "${r.title}" (${r.course}): the key ideas and what to focus on.`,
        hint: `${r.course} · ${r.subject}`,
      }));
    return prompts.length > 0 ? prompts : FALLBACK.slice(0, limit);
  }, [forSemester.data, library.data, limit]);
}
