import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';
import {
  INTRO_MAX,
  INTRO_MIN,
  TOPIC_MAX,
  TOPIC_MIN,
} from '../mentorship.constants';

export class CreateMentorshipDto {
  @IsMongoId()
  mentorId: string;

  @IsString()
  @MinLength(TOPIC_MIN)
  @MaxLength(TOPIC_MAX)
  topic: string;

  @IsString()
  @MinLength(INTRO_MIN)
  @MaxLength(INTRO_MAX)
  introMessage: string;
}
