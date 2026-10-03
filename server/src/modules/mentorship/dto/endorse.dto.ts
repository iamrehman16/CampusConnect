import { IsString, MaxLength, MinLength } from 'class-validator';

export class EndorseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  tag: string;
}
