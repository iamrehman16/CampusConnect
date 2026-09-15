import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreatePostDto, PostStats, UpdatePostDto } from './dto/post.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { AdminUpdatePostDto } from './dto/admin-post.dto';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import {
  PaginationService,
  PaginatedResult,
} from '../../common/services/pagination.service';
import { Roles } from '../user/enums/user-role.enum';
import { PostQueryBuilder } from './queries/build-post-query';
import { PostQueryDto } from './dto/post-query.dto';

@Injectable()
export class PostService {
  private readonly queryBuilder = new PostQueryBuilder();

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly paginationService: PaginationService,
  ) {}

  async createPost(dto: CreatePostDto, userId: string) {
    const post = new this.postModel({
      ...dto,
      author: new Types.ObjectId(userId),
    });
    const savedPost = await post.save();

    const populatedPost = await savedPost.populate({
      path: 'author',
      select: 'name email',
    });

    return populatedPost.toObject();
  }

  async getAllPosts(dto: PostQueryDto): Promise<PaginatedResult<Post>> {
    return this.paginationService.paginateWithPopulate(
      this.postModel,
      dto,
      this.queryBuilder,
      { build: () => ({ createdAt: -1 }) },
      { path: 'author', select: 'name email' },
    );
  }

  async getPostById(id: string) {
    const post = await this.postModel
      .findOne({ _id: id, isDeleted: false })
      .populate('author', 'name email')
      .lean()
      .exec();

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async updatePost(
    id: string,
    dto: UpdatePostDto,
    userId: string,
    userRole: string,
  ) {
    const isAdmin = userRole === Roles.ADMIN;

    const updatedPost = await this.postModel
      .findOneAndUpdate(
        {
          _id: id,
          ...(isAdmin ? {} : { author: new Types.ObjectId(userId) }),
          isDeleted: false,
        },
        { $set: dto },
        { new: true },
      )
      .populate('author', 'name email')
      .lean()
      .exec();

    if (!updatedPost) {
      throw new ForbiddenException('Post not found or unauthorized');
    }
    return updatedPost;
  }

  async adminUpdatePost(id: string, dto: AdminUpdatePostDto) {
    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate('author', 'name email')
      .lean()
      .exec();

    if (!updatedPost) throw new NotFoundException('Post not found');
    return updatedPost;
  }

  async deletePost(id: string, userId: string, userRole: string) {
    const isAdmin = userRole === Roles.ADMIN;

    const result = await this.postModel
      .findOneAndUpdate(
        {
          _id: id,
          ...(isAdmin ? {} : { author: new Types.ObjectId(userId) }),
          isDeleted: false,
        },
        { $set: { isDeleted: true } },
        { new: true },
      )
      .populate('author', 'name email')
      .lean()
      .exec();

    if (!result) {
      throw new ForbiddenException('Post not found or unauthorized');
    }
    return result;
  }

  async adminDeletePost(id: string) {
    const result = await this.postModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true },
      )
      .populate('author', 'name email')
      .lean()
      .exec();

    if (!result) {
      throw new NotFoundException('Post is deleted or not found');
    }

    return result;
  }

  async togglePostUpvote(id: string, userId: string) {
    const uid = new Types.ObjectId(userId);
    const postId = new Types.ObjectId(id);

    let post = await this.postModel
      .findOneAndUpdate(
        { _id: postId, upvotes: uid, isDeleted: false },
        { $pull: { upvotes: uid } },
        { new: true },
      )
      .populate('author', 'name email')
      .lean()
      .exec();

    if (!post) {
      post = await this.postModel
        .findOneAndUpdate(
          { _id: postId, isDeleted: false },
          { $addToSet: { upvotes: uid } },
          { new: true },
        )
        .populate('author', 'name email')
        .lean()
        .exec();
    }

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async createComment(postId: string, dto: CreateCommentDto, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const [comment] = await this.commentModel.create(
        [
          {
            content: dto.content,
            postId: new Types.ObjectId(postId),
            author: new Types.ObjectId(userId),
          },
        ],
        { session },
      );

      const populatedComment = await comment.populate('author', 'name');

      const post = await this.postModel
        .findOneAndUpdate(
          { _id: postId, isDeleted: false },
          { $inc: { commentCount: 1 } },
          { session, new: true },
        )
        .lean()
        .exec();

      if (!post) throw new NotFoundException('Post not found');

      await session.commitTransaction();
      return populatedComment.toObject();
    } catch (error) {
      await session.abortTransaction();
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Comment failed');
    } finally {
      session.endSession();
    }
  }

  async getCommentsByPostId(
    postId: string,
    dto: BaseQueryDto,
  ): Promise<PaginatedResult<Comment>> {
    return this.paginationService.paginateWithPopulate(
      this.commentModel,
      dto,
      {
        build: () => ({ postId: new Types.ObjectId(postId), isDeleted: false }),
      },
      { build: () => ({ createdAt: 1 }) },
      { path: 'author', select: 'name' },
    );
  }

  async getPostStats() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const stats = await this.postModel.aggregate([
      { $match: { isDeleted: false } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          recent: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const postStats: PostStats = {
      total: stats[0].total[0]?.count || 0,
      recent: stats[0].recent[0]?.count || 0,
    };

    return postStats;
  }

  async updateComment(
    id: string,
    dto: UpdateCommentDto,
    userId: string,
    userRole: string,
  ) {
    const isAdmin = userRole === Roles.ADMIN;

    const updatedComment = await this.commentModel
      .findOneAndUpdate(
        {
          _id: id,
          ...(isAdmin ? {} : { author: new Types.ObjectId(userId) }),
          isDeleted: false,
        },
        { $set: dto },
        { new: true },
      )
      .populate('author', 'name')
      .lean()
      .exec();

    if (!updatedComment) {
      throw new ForbiddenException('You are forbidden or comment not found!');
    }

    return updatedComment;
  }

  async deleteComment(id: string, userId: string, userRole: string) {
    const isAdmin = userRole === Roles.ADMIN;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const deletedComment = await this.commentModel
        .findOneAndUpdate(
          {
            _id: id,
            ...(isAdmin ? {} : { author: new Types.ObjectId(userId) }),
            isDeleted: false,
          },
          { $set: { isDeleted: true } },
          { session, new: true },
        )
        .populate('author', 'name')
        .lean()
        .exec();

      if (!deletedComment) {
        throw new ForbiddenException('You are forbidden or comment not found!');
      }

      await this.postModel.updateOne(
        { _id: deletedComment.postId, isDeleted: false },
        { $inc: { commentCount: -1 } },
        { session },
      );

      await session.commitTransaction();
      return deletedComment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async adminUpdateComment(id: string, dto: UpdateCommentDto) {
    const updatedComment = await this.commentModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: dto },
        { new: true },
      )
      .populate('author', 'name')
      .lean()
      .populate('author', 'name')
      .exec();

    if (!updatedComment) {
      throw new NotFoundException('Comment is deleted or not found!');
    }

    return updatedComment;
  }

  async adminDeleteComment(id: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const deletedComment = await this.commentModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true } },
          { session, new: true },
        )
        .populate('author', 'name')
        .lean()
        .exec();

      if (!deletedComment) {
        throw new NotFoundException('Comment is deleted or not found!');
      }

      await this.postModel.updateOne(
        { _id: deletedComment.postId, isDeleted: false },
        { $inc: { commentCount: -1 } },
        { session },
      );

      await session.commitTransaction();
      return deletedComment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async countPostsDaysAgo(days: number) {
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    daysAgo.setHours(0, 0, 0, 0);

    return this.postModel.countDocuments({ createdAt: { $gte: daysAgo } });
  }
}
