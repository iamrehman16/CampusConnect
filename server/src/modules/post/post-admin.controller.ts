import {
  Controller,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
  Post,
  Req,
} from '@nestjs/common';
import { PostService } from './post.service';
import { AdminUpdatePostDto } from './dto/admin-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from '../user/enums/user-role.enum';
import { UpdateCommentDto } from './dto/comment.dto';
import { CreatePostDto } from './dto/post.dto';
import { CurrentUser } from '../auth/types/current-user';

@Controller('admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Role(Roles.ADMIN)
export class PostAdminController {
  constructor(private readonly postService: PostService) {}

  @Post()
  createPost(@Body() dto: CreatePostDto, @Req() req: { user: CurrentUser }) {
    return this.postService.createPost(dto, req.user.id);
  }

  @Patch(':id')
  updatePost(@Param('id') id: string, @Body() dto: AdminUpdatePostDto) {
    return this.postService.adminUpdatePost(id, dto);
  }

  @Delete(':id')
  deletePost(@Param('id') id: string) {
    return this.postService.adminDeletePost(id);
  }

  @Patch('comments/:commentId')
  updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.postService.adminUpdateComment(commentId, dto);
  }

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string) {
    return this.postService.adminDeleteComment(commentId);
  }
}
