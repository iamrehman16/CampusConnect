/** Mirrors server `ReputationTier` (reputation/tiers.ts). The server decides the tier; the client only displays it. */
export type ReputationTier = "newcomer" | "regular" | "trusted" | "star";

export interface Badge {
  key: string;
  label: string;
  description: string;
}
