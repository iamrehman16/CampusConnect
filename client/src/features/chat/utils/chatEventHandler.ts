import type { Message } from "../types/chat-dto";
import type { chatCacheUpdaters } from "./chat-cache.updaters";

export const chatEventHandlers = (
  cache: ReturnType<typeof chatCacheUpdaters>,
) => ({
  handleIncomingMessage(message: Message, clearTimeout: (id: string) => void) {
    const isReplica = cache.isOwnReplica(
      message.conversationId,
      message.clientId,
    );

    if (isReplica) {
      clearTimeout(message.clientId!);
      cache.promoteMessage(message.conversationId, message);
    } else {
      cache.prependMessage(message);
    }
  },
});
