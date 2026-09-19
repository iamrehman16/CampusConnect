import { IsIn } from 'class-validator';

export class SetMessageFeedbackDto {
  @IsIn(['up', 'down', null])
  feedback: 'up' | 'down' | null;
}
