import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectResourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
