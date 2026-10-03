import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { MentorshipService } from './mentorship.service';
import { MentorFeedbackService } from './mentor-feedback.service';
import { RateMentorshipDto } from './dto/rate-mentorship.dto';
import { MentorRecommendationService } from './mentor-recommendation.service';
import { RecommendedMentorsQueryDto } from './dto/recommended-mentors-query.dto';
import { CreateMentorshipDto } from './dto/create-mentorship.dto';
import { DeclineMentorshipDto } from './dto/decline-mentorship.dto';
import { MentorshipQueryDto } from './dto/mentorship-query.dto';
import { CurrentUser } from '../auth/types/current-user';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';

@Controller('mentorships')
export class MentorshipController {
  constructor(
    private readonly service: MentorshipService,
    private readonly recommendations: MentorRecommendationService,
    private readonly feedback: MentorFeedbackService,
  ) {}

  @Post()
  request(@Req() req: { user: CurrentUser }, @Body() dto: CreateMentorshipDto) {
    return this.service.request(req.user.id, dto);
  }

  @Get()
  list(@Req() req: { user: CurrentUser }, @Query() query: MentorshipQueryDto) {
    return this.service.list(req.user.id, query);
  }

  /** "Recommended for you" mentors for the caller (BACKLOG.md E12). */
  @Get('recommended-mentors')
  recommendedMentors(
    @Req() req: { user: CurrentUser },
    @Query() query: RecommendedMentorsQueryDto,
  ) {
    return this.recommendations.recommend(req.user.id, query.limit);
  }

  /** Requests waiting for the caller (as a mentor) — for nav badges. */
  @Get('pending-count')
  pendingCount(@Req() req: { user: CurrentUser }) {
    return this.service.pendingCount(req.user.id);
  }

  /** The mentee rates a completed mentorship; editable for 24h (BACKLOG.md E11). */
  @Put(':id/rating')
  rate(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: RateMentorshipDto,
  ) {
    return this.feedback.rate(id, req.user.id, dto);
  }

  @Patch(':id/accept')
  accept(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.service.accept(id, req.user.id);
  }

  @Patch(':id/decline')
  decline(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: DeclineMentorshipDto,
  ) {
    return this.service.decline(id, req.user.id, dto.reason);
  }

  @Patch(':id/cancel')
  cancel(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.service.cancel(id, req.user.id);
  }

  @Patch(':id/complete')
  complete(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.service.complete(id, req.user.id);
  }
}
