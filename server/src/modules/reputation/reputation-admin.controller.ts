import { Controller, Post } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from '../user/enums/user-role.enum';

@Controller('admin/reputation')
@Role(Roles.ADMIN)
export class ReputationAdminController {
  constructor(private readonly reputationService: ReputationService) {}

  /** Idempotent: award pre-ledger history and rebuild all scores. */
  @Post('backfill')
  backfill() {
    return this.reputationService.backfill();
  }
}
