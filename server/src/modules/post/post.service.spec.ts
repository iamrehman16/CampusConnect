import { Connection, Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostService } from './post.service';
import { PostDocument } from './schemas/post.schema';
import { CommentDocument } from './schemas/comment.schema';
import { PaginationService } from '../../common/services/pagination.service';

function build() {
  const paginateWithPopulate = jest
    .fn()
    .mockResolvedValue({ data: [], total: 0 });
  const service = new PostService(
    {} as Model<PostDocument>,
    {} as Model<CommentDocument>,
    {} as Connection,
    { paginateWithPopulate } as unknown as PaginationService,
    {} as EventEmitter2,
  );
  return { service, paginateWithPopulate };
}

describe('PostService — author fields on lists', () => {
  // Regression: comments populated only `name`, so every comment avatar
  // fell back to initials. Email must never be included.
  it('comment authors carry name and avatar, never email', async () => {
    const { service, paginateWithPopulate } = build();

    await service.getCommentsByPostId(new Types.ObjectId().toString(), {});

    const [, , , , populate] = paginateWithPopulate.mock.calls[0] as [
      unknown,
      unknown,
      unknown,
      unknown,
      { path: string; select: string },
    ];
    expect(populate.path).toBe('author');
    expect(populate.select.split(' ').sort()).toEqual(['avatar', 'name']);
  });
});
