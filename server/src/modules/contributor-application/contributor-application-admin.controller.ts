import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ContributorApplicationService } from './contributor-application.service';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from '../user/enums/user-role.enum';
import { CurrentUser } from '../auth/types/current-user';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';

@Controller('admin/contributor-applications')
@Role(Roles.ADMIN)
export class ContributorApplicationAdminController {
  constructor(private readonly service: ContributorApplicationService) {}

  @Get()
  list(@Query() query: ApplicationQueryDto) {
    return this.service.listForAdmin(query);
  }

  @Patch(':id/approve')
  approve(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.service.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  reject(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.service.reject(id, req.user.id, dto.reason);
  }
}
