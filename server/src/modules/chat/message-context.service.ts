import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Resource,
  ResourceDocument,
} from '../resource/schemas/resource.schema';
import { ApprovalStatus } from '../resource/enums/approval-status.enum';
import { Post, PostDocument } from '../post/schemas/post.schema';
import { MessageContext, MessageKind } from './types/message-context';

/**
 * Resolves the item a chat message points at (E13) so the stored snapshot is
 * trusted server data and dangling/forbidden references are rejected.
 */
@Injectable()
export class MessageContextService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  async resolve(
    kind: MessageKind,
    contextId: string,
  ): Promise<MessageContext | undefined> {
    const refId = new Types.ObjectId(contextId);

    switch (kind) {
      case MessageKind.TEXT:
        return undefined;

      case MessageKind.RESOURCE: {
        const resource = await this.resourceModel
          .findOne({
            _id: refId,
            isDeleted: false,
            approvalStatus: ApprovalStatus.APPROVED,
          })
          .select('title course subject')
          .lean()
          .exec();
        if (!resource) throw new NotFoundException('Resource not found');
        return {
          refId,
          title: resource.title,
          subtitle: `${resource.course} · ${resource.subject}`,
        };
      }

      case MessageKind.POST: {
        const post = await this.postModel
          .findOne({ _id: refId, isDeleted: false })
          .select('title')
          .lean()
          .exec();
        if (!post) throw new NotFoundException('Post not found');
        return { refId, title: post.title };
      }
    }
  }
}
