import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { MentorEndorsementService } from './mentor-endorsement.service';
import { EndorseDto } from './dto/endorse.dto';
import { CurrentUser } from '../auth/types/current-user';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';

@Controller('endorsements')
export class EndorsementController {
  constructor(private readonly endorsements: MentorEndorsementService) {}

  /** A mentor's skills with endorsement counts, plus whether the caller may endorse. */
  @Get(':mentorId')
  summary(
    @Req() req: { user: CurrentUser },
    @Param('mentorId', ParseMongoIdPipe) mentorId: string,
  ) {
    return this.endorsements.summary(req.user.id, mentorId);
  }

  @Put(':mentorId')
  endorse(
    @Req() req: { user: CurrentUser },
    @Param('mentorId', ParseMongoIdPipe) mentorId: string,
    @Body() dto: EndorseDto,
  ) {
    return this.endorsements.endorse(req.user.id, mentorId, dto.tag);
  }

  @Delete(':mentorId')
  retract(
    @Req() req: { user: CurrentUser },
    @Param('mentorId', ParseMongoIdPipe) mentorId: string,
    @Query() dto: EndorseDto,
  ) {
    return this.endorsements.retract(req.user.id, mentorId, dto.tag);
  }
}
