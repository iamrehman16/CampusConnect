import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Live, ephemeral presence — not server state worth caching. Seeded from the
// `presence_snapshot` on connect and updated by `presence` events.
interface ChatPresenceState {
  online: Record<string, boolean>;
  lastSeen: Record<string, string>;
  setSnapshot: (onlineIds: string[]) => void;
  setPresence: (userId: string, online: boolean, lastSeenAt?: string) => void;
  reset: () => void;
}

export const useChatPresenceStore = create<ChatPresenceState>()(
  devtools(
    (set) => ({
      online: {},
      lastSeen: {},
      setSnapshot: (onlineIds) =>
        set({
          online: Object.fromEntries(onlineIds.map((id) => [id, true])),
        }),
      setPresence: (userId, online, lastSeenAt) =>
        set((state) => ({
          online: { ...state.online, [userId]: online },
          lastSeen: lastSeenAt
            ? { ...state.lastSeen, [userId]: lastSeenAt }
            : state.lastSeen,
        })),
      reset: () => set({ online: {}, lastSeen: {} }),
    }),
    { name: "chat-presence" },
  ),
);
