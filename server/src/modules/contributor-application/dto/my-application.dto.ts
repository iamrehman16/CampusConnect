import { ContributorApplication } from '../schema/contributor-application.schema';

export interface MyApplicationDto {
  /** Most recent application, or null if the user never applied. */
  application: (ContributorApplication & { _id: string }) | null;
  score: number;
  threshold: number;
  eligible: boolean;
  /** Already a contributor/admin — nothing to apply for. */
  canApply: boolean;
}
