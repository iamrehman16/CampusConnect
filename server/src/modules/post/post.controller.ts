import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CurrentUser } from '../auth/types/current-user';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from '../user/enums/user-role.enum';
import { BaseQueryDto } from '../../common/dto/base-query.dto';

@Role(Roles.CONTRIBUTOR, Roles.STUDENT, Roles.ADMIN)
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  createPost(@Body() dto: CreatePostDto, @Req() req: { user: CurrentUser }) {
    return this.postService.createPost(dto, req.user.id);
  }

  @Get()
  getAllPosts(@Query() dto: BaseQueryDto) {
    return this.postService.getAllPosts({ ...dto, id: '' });
  }

  @Patch(':id')
  updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Req() req: { user: CurrentUser },
  ) {
    return this.postService.updatePost(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  deletePost(@Param('id') id: string, @Req() req: { user: CurrentUser }) {
    return this.postService.deletePost(id, req.user.id, req.user.role);
  }

  @Post(':id/upvote')
  togglePostUpvote(@Param('id') id: string, @Req() req: { user: CurrentUser }) {
    return this.postService.togglePostUpvote(id, req.user.id);
  }

  @Post(':id/comments')
  createComment(
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: { user: CurrentUser },
  ) {
    return this.postService.createComment(postId, dto, req.user.id);
  }

  @Get(':id/comments')
  getPostComments(@Param('id') id: string, @Query() dto: BaseQueryDto) {
    return this.postService.getCommentsByPostId(id, dto);
  }

  @Patch('comments/:commentId')
  updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: { user: CurrentUser },
  ) {
    return this.postService.updateComment(
      commentId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('comments/:commentId')
  deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: { user: CurrentUser },
  ) {
    return this.postService.deleteComment(
      commentId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('stats')
  getPostStats() {
    return this.postService.getPostStats();
  }

  @Get('my')
  async getMyPost(
    @Query() dto: BaseQueryDto,
    @Req() req: { user: CurrentUser },
  ) {
    const id = req.user.id;
    return this.postService.getAllPosts({ ...dto, id });
  }

  @Get(':id')
  getPostById(@Param('id') id: string) {
    return this.postService.getPostById(id);
  }

  @Get('user/:id')
  async getPostByUser(@Query() dto: BaseQueryDto, @Param('id') id: string) {
    return this.postService.getAllPosts({ ...dto, id });
  }
}
