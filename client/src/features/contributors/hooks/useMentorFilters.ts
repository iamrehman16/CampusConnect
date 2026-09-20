import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { MentorFilters, MentorSort } from "../types/mentor.dto";

const asSemester = (raw: string | null): number | undefined => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 8 ? n : undefined;
};

/**
 * Directory filters live in the URL (shareable, survives refresh, back button
 * works). Empty values are removed from the query string.
 */
export function useMentorFilters() {
  const [params, setParams] = useSearchParams();

  const filters: MentorFilters = useMemo(
    () => ({
      search: params.get("q") || undefined,
      department: params.get("dept") || undefined,
      topic: params.get("topic") || undefined,
      semesterMin: asSemester(params.get("semMin")),
      semesterMax: asSemester(params.get("semMax")),
      sort: (params.get("sort") === "active" ? "active" : "score") as MentorSort,
    }),
    [params],
  );

  const setFilters = useCallback(
    (patch: Partial<Record<"q" | "dept" | "topic" | "semMin" | "semMax" | "sort", string | undefined>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const reset = useCallback(() => setParams({}, { replace: true }), [setParams]);

  const hasActiveFilters =
    !!filters.search ||
    !!filters.department ||
    !!filters.topic ||
    !!filters.semesterMin ||
    !!filters.semesterMax;

  return { filters, setFilters, reset, hasActiveFilters };
}
