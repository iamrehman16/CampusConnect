import { ReputationEventType } from '../enums/reputation-event-type.enum';

export interface ReputationEventDto {
  id: string;
  type: ReputationEventType;
  points: number;
  sourceId: string;
  createdAt: Date;
}

export interface BackfillResultDto {
  awarded: number;
  usersRecomputed: number;
}
