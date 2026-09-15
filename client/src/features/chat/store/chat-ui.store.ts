import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ChatUIState {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;

  unreadCounts: Record<string, number>;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  getTotalUnread: () => number;
}

export const useChatUIStore = create<ChatUIState>()(
  devtools(
    (set, get) => ({
      unreadCounts: {},

      incrementUnread: (conversationId) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: (state.unreadCounts[conversationId] ?? 0) + 1,
          },
        })),

      activeConversationId: null,
      setActiveConversationId: (id) => set({ activeConversationId: id }),

      clearUnread: (conversationId) =>
        set((state) => {
          const { [conversationId]: _, ...rest } = state.unreadCounts;
          return { unreadCounts: rest };
        }),

      getTotalUnread: () =>
        Object.values(get().unreadCounts).reduce((sum, n) => sum + n, 0),
    }),
    { name: "chat-ui" },
  ),
);
