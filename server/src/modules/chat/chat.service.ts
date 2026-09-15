import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationDocument,
} from './schema/conversation.schema';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schema/message.schema';
import { PaginationService } from '../../common/services/pagination.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesDto } from './dto/get-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly paginationService: PaginationService,
  ) {}

  async getMessageByClientId(clientId: string) {
    return this.messageModel.findOne({ clientId });
  }

  async findOrCreateConversation(
    currentUserId: string,
    dto: StartConversationDto,
  ) {
    const currentId = new Types.ObjectId(currentUserId);
    const participantId = new Types.ObjectId(dto.participantId);

    const sorted = [currentId, participantId].sort();

    const existing = await this.conversationModel
      .findOne({ participants: { $all: sorted } })
      .populate('participants', 'name email')
      .populate('lastMessage')
      .lean()
      .exec();

    if (existing) {
      return existing;
    }

    const newConversation = await this.conversationModel.create({
      participants: sorted,
    });

    return this.conversationModel
      .findById(newConversation._id)
      .populate('participants', 'name email')
      .lean()
      .exec();
  }

  async getUserConversations(userId: string) {
    return this.conversationModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'name email')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })
      .lean()
      .exec();
  }

  async getMessages(userId: string, dto: GetMessagesDto) {
    const conversationId = dto.conversationId;

    await this.verifyParticipant(conversationId, userId);

    return this.paginationService.paginate(
      this.messageModel,
      dto,
      {
        build: () => ({
          conversationId: new Types.ObjectId(conversationId),
          isDeleted: false,
          ...(dto.before && { createdAt: { $lt: new Date(dto.before) } }),
        }),
      },
      { build: () => ({ createdAt: -1 }) },
    );
  }

  private async verifyParticipant(conversationId: string, userId: string) {
    const conversation = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        participants: new Types.ObjectId(userId),
      })
      .exec();

    if (!conversation) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }
  }

  async createMessageIdempotent(dto: CreateMessageDto, senderId: string) {
    await this.verifyParticipant(dto.conversationId, senderId);

    try {
      const message = await this.messageModel.create({
        conversationId: new Types.ObjectId(dto.conversationId),
        sender: new Types.ObjectId(senderId),
        content: dto.content,
        clientId: dto.clientId,
      });

      await this.conversationModel.findByIdAndUpdate(dto.conversationId, {
        lastMessage: message._id,
        lastMessageAt: message.createdAt,
      });

      return message.toObject();
    } catch (err) {
      if (this.isDuplicateClientIdError(err)) {
        // fetch the already-created message
        return await this.messageModel
          .findOne({ clientId: dto.clientId })
          .lean()
          .exec();
      }

      throw err;
    }
  }

  async markSeen(conversationId: string, userId: string) {
    await this.verifyParticipant(conversationId, userId);

    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        sender: { $ne: new Types.ObjectId(userId) },
        seenAt: null,
      },
      {
        seenAt: new Date(),
      },
    );
  }

  async deleteMessage(
    messageId: string,
    conversationId: string,
    userId: string,
  ) {
    const message = await this.messageModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(messageId),
          conversationId: new Types.ObjectId(conversationId),
          sender: new Types.ObjectId(userId),
          isDeleted: false,
        },
        { isDeleted: true },
        { new: true },
      )
      .lean()
      .exec();

    if (!message) {
      throw new ForbiddenException(
        'Message not found or you are not the sender',
      );
    }

    return message;
  }

  async getReceiverIdFromConversation(
    conversationId: string,
    senderId: string,
  ) {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();

    if (!conversation) {
      throw new ForbiddenException('Conversation not found');
    }

    const receiverId = conversation.participants.find(
      (p) => p.toString() !== senderId,
    );

    if (!receiverId) {
      throw new NotFoundException('Receiver not found in conversation!');
    }

    return receiverId.toString();
  }

  private isDuplicateClientIdError(err: any): boolean {
    return err?.code === 11000 && err?.keyPattern?.clientId;
  }
}
