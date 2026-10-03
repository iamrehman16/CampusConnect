import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { MentorSuggestionService } from './mentor-suggestion.service';
import { AiConversationDocument } from '../schema/ai-conversation.schema';
import { AiMessageDocument } from '../schema/ai-message.schema';
import { ResourceDocument } from '../../resource/schemas/resource.schema';
import { UserService } from '../../user/user.service';
import { MentorSummaryDto } from '../../user/dto/mentor-summary.dto';
import { ReputationTier } from '../../reputation/tiers';

function chain(result: unknown) {
  const c = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
  return c;
}

const mentor = (id: string, topics: string[]): MentorSummaryDto => ({
  id,
  name: id,
  role: 'contributor' as MentorSummaryDto['role'],
  tier: ReputationTier.REGULAR,
  contributionScore: 10,
  expertise: [],
  mentorTopics: topics,
  maxActiveMentees: 3,
  slotsLeft: 1,
});

function build(opts: {
  conversation?: unknown;
  answer?: unknown;
  question?: unknown;
  resources?: unknown[];
  mentors?: MentorSummaryDto[];
}) {
  const conversationModel = {
    findOne: jest.fn().mockReturnValue(chain(opts.conversation ?? null)),
  };
  const messageModel = {
    findOne: jest
      .fn()
      .mockReturnValueOnce(chain(opts.answer ?? null))
      .mockReturnValueOnce(chain(opts.question ?? null)),
  };
  const resourceModel = {
    find: jest.fn().mockReturnValue(chain(opts.resources ?? [])),
  };
  const findMentors = jest.fn().mockResolvedValue({ data: opts.mentors ?? [] });
  const service = new MentorSuggestionService(
    conversationModel as unknown as Model<AiConversationDocument>,
    messageModel as unknown as Model<AiMessageDocument>,
    resourceModel as unknown as Model<ResourceDocument>,
    { findMentors } as unknown as UserService,
  );
  return { service, findMentors, resourceModel };
}

const cid = new Types.ObjectId();
const rid = new Types.ObjectId();
const answer = {
  _id: new Types.ObjectId(),
  createdAt: new Date(),
  citations: [{ resourceId: rid.toString(), course: 'CS-201' }],
};

describe('MentorSuggestionService', () => {
  it("404s when the conversation isn't the caller's", async () => {
    const { service } = build({ conversation: null });

    await expect(
      service.suggest('u1', cid.toString(), 'm'.padEnd(24, '0')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s when the assistant message does not exist', async () => {
    const { service } = build({ conversation: { _id: cid }, answer: null });

    await expect(
      service.suggest('u1', cid.toString(), 'm'.padEnd(24, '0')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('matches mentors on the cited resources’ subjects, capped at 3, with capacity required', async () => {
    const { service, findMentors, resourceModel } = build({
      conversation: { _id: cid },
      answer,
      question: { content: 'Explain linked lists' },
      resources: [{ subject: 'Data Structures', course: 'CS-201' }],
      mentors: [
        mentor('m1', ['Data Structures']),
        mentor('m2', ['Data Structures']),
        mentor('m3', ['Data Structures']),
        mentor('m4', ['Data Structures']),
        mentor('far', ['Painting']),
      ],
    });

    const result = await service.suggest('u1', cid.toString(), 'x');

    expect(resourceModel.find).toHaveBeenCalledTimes(1);
    expect(findMentors).toHaveBeenCalledWith(
      expect.objectContaining({ hasCapacity: true }),
      'u1',
    );
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id)).not.toContain('far');
    expect(result[0].matchedOn).toEqual(['Data Structures']);
    expect(result[0].suggestedTopic).toBe('Data Structures');
  });

  it('returns no suggestions when nobody matches', async () => {
    const { service } = build({
      conversation: { _id: cid },
      answer: { ...answer, citations: [] },
      question: { content: 'Explain quantum chromodynamics' },
      mentors: [mentor('m1', ['Painting'])],
    });

    expect(await service.suggest('u1', cid.toString(), 'x')).toEqual([]);
  });
});
