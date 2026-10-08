import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Cheap liveness probe; point the host's health check here. */
  @Get('live')
  live() {
    return this.health.live();
  }

  /**
   * Dependency report. 200 unless MongoDB is unreachable (503): a down Qdrant
   * or Groq degrades the AI but doesn't take the API down.
   */
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    const report = await this.health.check();
    if (report.status === 'down') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return report;
  }
}
