import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { BlockUserDto } from './dto/block-user.dto';
import { CurrentUser } from '../auth/types/current-user';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';

@Controller('blocks')
export class BlockController {
  constructor(private readonly blocks: BlockService) {}

  @Get()
  list(@Req() req: { user: CurrentUser }) {
    return this.blocks.listBlocked(req.user.id);
  }

  @Post()
  block(@Req() req: { user: CurrentUser }, @Body() dto: BlockUserDto) {
    return this.blocks.block(req.user.id, dto.userId);
  }

  @Delete(':userId')
  unblock(
    @Req() req: { user: CurrentUser },
    @Param('userId', ParseMongoIdPipe) userId: string,
  ) {
    return this.blocks.unblock(req.user.id, userId);
  }
}
