// ESM-only node-fetch (via DocumentParserService) can't load under Jest.
jest.mock('../ai/services/ingestion.service', () => ({
  IngestionService: class {},
}));

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ImpactService } from './impact.service';
import { CurrentUser } from '../auth/types/current-user';

describe('DashboardController', () => {
  const req = { user: { id: 'user-1' } as CurrentUser };

  // Regression: these used to read `.id` off the request object itself, which
  // is undefined, so every caller got someone else's (random) data.
  it('my stats are looked up for the signed-in user, not for the request object', async () => {
    const getMyStats = jest.fn().mockResolvedValue({});
    const controller = new DashboardController(
      { getMyStats } as unknown as DashboardService,
      {} as ImpactService,
    );

    await controller.getMyStats(req);

    expect(getMyStats).toHaveBeenCalledWith('user-1');
  });

  it('my impact is looked up for the signed-in user', async () => {
    const getMyImpact = jest.fn().mockResolvedValue({});
    const controller = new DashboardController(
      {} as DashboardService,
      { getMyImpact } as unknown as ImpactService,
    );

    await controller.getMyImpact(req);

    expect(getMyImpact).toHaveBeenCalledWith('user-1');
  });
});
