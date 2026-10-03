import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GoogleExchangeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  code: string;
}
