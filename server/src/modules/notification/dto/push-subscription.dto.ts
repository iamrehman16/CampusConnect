import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class PushKeysDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  auth: string;
}

export class PushEndpointDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint: string;
}

/** Shape of the browser's `PushSubscription.toJSON()`. */
export class PushSubscriptionDto extends PushEndpointDto {
  // ValidateNested skips an absent value; without this a body missing
  // `keys` passes and the service crashes reading keys.p256dh.
  @IsDefined()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys: PushKeysDto;

  /** Always sent by `toJSON()` (usually null); unused, push services expire via 404/410. */
  @IsOptional()
  @IsInt()
  expirationTime?: number | null;
}
