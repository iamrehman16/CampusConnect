import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

/**
 * In-memory socket presence. A user is online while at least one of their
 * sockets is connected (multi-tab / multi-device safe).
 *
 * Single-instance only: state lives in this process. Scaling the gateway to
 * multiple instances needs a shared store (Redis via the socket.io adapter)
 * — deliberately out of scope until there is more than one instance.
 */
@Injectable()
export class PresenceService {
  private readonly socketsByUser = new Map<string, Set<string>>();

  constructor(private readonly userService: UserService) {}

  /** @returns true when this is the user's first live socket (offline -> online). */
  connect(userId: string, socketId: string): boolean {
    const sockets = this.socketsByUser.get(userId) ?? new Set<string>();
    const wasOffline = sockets.size === 0;
    sockets.add(socketId);
    this.socketsByUser.set(userId, sockets);
    return wasOffline;
  }

  /**
   * @returns the persisted last-seen time when this was the user's last live
   * socket (online -> offline), otherwise null.
   */
  async disconnect(userId: string, socketId: string): Promise<Date | null> {
    const sockets = this.socketsByUser.get(userId);
    if (!sockets?.delete(socketId) || sockets.size > 0) return null;

    this.socketsByUser.delete(userId);
    const lastSeenAt = new Date();
    await this.userService.touchLastSeen(userId, lastSeenAt);
    return lastSeenAt;
  }

  filterOnline(userIds: string[]): string[] {
    return userIds.filter((id) => this.socketsByUser.has(id));
  }
}
