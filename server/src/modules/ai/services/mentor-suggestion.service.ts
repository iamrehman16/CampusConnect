import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AiConversation,
  AiConversationDocument,
} from '../schema/ai-conversation.schema';
import { AiMessage, AiMessageDocument } from '../schema/ai-message.schema';
import {
  Resource,
  ResourceDocument,
} from '../../resource/schemas/resource.schema';
import { UserService } from '../../user/user.service';
import { MentorQueryDto } from '../../user/dto/mentor-query.dto';
import { MentorSuggestionDto } from '../dto/mentor-suggestion.dto';
import { MatchTerms, rankMentors } from '../../user/mentor-matching';

/** At most this many mentors are suggested (BACKLOG.md E14). */
const SUGGESTION_LIMIT = 3;
/**
 * Mentors scored in-process per request. Fine at directory scale; E12 should
 * push matching into the query when the pool outgrows this.
 */
const CANDIDATE_POOL = 100;
const TOPIC_MAX_LENGTH = 100;

@Injectable()
export class MentorSuggestionService {
  constructor(
    @InjectModel(AiConversation.name)
    private readonly conversationModel: Model<AiConversationDocument>,
    @InjectModel(AiMessage.name)
    private readonly messageModel: Model<AiMessageDocument>,
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    private readonly userService: UserService,
  ) {}

  /**
   * Mentors with a free slot whose topics overlap what this assistant answer
   * was about. Ownership is checked through the parent conversation (the
   * message has no userId), like feedback (C1).
   */
  async suggest(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<MentorSuggestionDto[]> {
    const conversation = await this.conversationModel
      .findOne({ _id: conversationId, userId })
      .select('_id')
      .lean()
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const answer = await this.messageModel
      .findOne({
        _id: messageId,
        conversationId: conversation._id,
        role: 'assistant',
      })
      .lean()
      .exec();
    if (!answer) throw new NotFoundException('Message not found');

    const question = await this.messageModel
      .findOne({
        conversationId: conversation._id,
        role: 'user',
        createdAt: { $lte: answer.createdAt },
      })
      .sort({ createdAt: -1 })
      .select('content')
      .lean()
      .exec();

    const terms = await this.buildTerms(
      answer.citations?.map((c) => c.resourceId) ?? [],
      answer.citations?.map((c) => c.course) ?? [],
      question?.content ?? '',
    );

    const dto = Object.assign(new MentorQueryDto(), {
      page: 1,
      limit: CANDIDATE_POOL,
      hasCapacity: true,
    });
    const { data: mentors } = await this.userService.findMentors(dto, userId);

    const topicFallback = (question?.content ?? '').slice(0, TOPIC_MAX_LENGTH);
    return rankMentors(mentors, terms, SUGGESTION_LIMIT).map(
      ({ mentor, matchedOn }) => ({
        id: mentor.id,
        name: mentor.name,
        avatar: mentor.avatar,
        tier: mentor.tier,
        matchedOn,
        slotsLeft: mentor.slotsLeft,
        suggestedTopic: (matchedOn[0] ?? topicFallback).slice(
          0,
          TOPIC_MAX_LENGTH,
        ),
      }),
    );
  }

  /** Subjects come from one batched lookup of the cited resources. */
  private async buildTerms(
    resourceIds: string[],
    courses: string[],
    question: string,
  ): Promise<MatchTerms> {
    const ids = resourceIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const resources = ids.length
      ? await this.resourceModel
          .find({ _id: { $in: ids } })
          .select('subject course')
          .lean()
          .exec()
      : [];

    return {
      subjects: resources.map((r) => r.subject),
      courses: [...courses, ...resources.map((r) => r.course)],
      question,
    };
  }
}
