import { createContext } from "react";

type ChatSocketContextValue = {
  isConnected: boolean;
};

export const ChatSocketContext = createContext<ChatSocketContextValue | null>(
  null,
);
