import {
  Controller,
  Body,
  Patch,
  Param,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from '../user/enums/user-role.enum';
import { RejectResourceDto } from './dto/reject-resource.dto';
import { ApprovalStatus } from './enums/approval-status.enum';
import { AdminResourceQueryDto } from './dto/admin-resource-query.dto';

@Controller('admin/resources')
@Role(Roles.ADMIN)
export class ResourceAdminController {
  constructor(private readonly resourceService: ResourceService) {}

  /**
   * Moderation queue — pending resources only.
   * Matches frontend: useAdminPendingResources → GET /admin/resources?status=pending
   */
  @Get('pending')
  getPending(@Query() query: AdminResourceQueryDto) {
    query.status = ApprovalStatus.PENDING;
    return this.resourceService.findAllPending(query);
  }

  @Patch(':id/approve')
  approve(@Param('id', ParseMongoIdPipe) id: string) {
    return this.resourceService.approve(id);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: RejectResourceDto,
  ) {
    return this.resourceService.reject(id, dto.reason);
  }
}
