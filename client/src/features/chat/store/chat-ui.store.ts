import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Unread counts live in the TanStack Query conversations cache (server is
// the source of truth — see useTotalUnread / useChatUnreadSync). This store
// only holds ephemeral UI state.
interface ChatUIState {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

export const useChatUIStore = create<ChatUIState>()(
  devtools(
    (set) => ({
      activeConversationId: null,
      setActiveConversationId: (id) => set({ activeConversationId: id }),
    }),
    { name: "chat-ui" },
  ),
);
