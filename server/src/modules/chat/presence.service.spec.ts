import { PresenceService } from './presence.service';
import { UserService } from '../user/user.service';

function build() {
  const touchLastSeen = jest.fn().mockResolvedValue(undefined);
  const service = new PresenceService({
    touchLastSeen,
  } as unknown as UserService);
  return { service, touchLastSeen };
}

describe('PresenceService', () => {
  it('reports offline->online only for the first socket of a user', () => {
    const { service } = build();

    expect(service.connect('u1', 's1')).toBe(true);
    expect(service.connect('u1', 's2')).toBe(false);
  });

  it('only persists last-seen and reports offline when the last socket disconnects', async () => {
    const { service, touchLastSeen } = build();
    service.connect('u1', 's1');
    service.connect('u1', 's2');

    expect(await service.disconnect('u1', 's1')).toBeNull();
    expect(touchLastSeen).not.toHaveBeenCalled();
    expect(service.filterOnline(['u1'])).toEqual(['u1']);

    const lastSeenAt = await service.disconnect('u1', 's2');
    expect(lastSeenAt).toBeInstanceOf(Date);
    expect(touchLastSeen).toHaveBeenCalledWith('u1', lastSeenAt);
    expect(service.filterOnline(['u1'])).toEqual([]);
  });

  it('ignores disconnects for unknown sockets', async () => {
    const { service, touchLastSeen } = build();

    expect(await service.disconnect('ghost', 's9')).toBeNull();
    expect(touchLastSeen).not.toHaveBeenCalled();
  });
});
