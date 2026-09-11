import { createContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { chatSocketService } from "@/features/chat/services/chat-socket.service";
import { tokenStorage } from "@/shared/utils/storage";

type ChatSocketContextValue = {
  isConnected: boolean;
};

export const ChatSocketContext = createContext<ChatSocketContextValue | null>(
  null,
);

export function ChatSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = tokenStorage.getAccessToken();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      chatSocketService.disconnect();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnected(false);
      return;
    }

    const socket: Socket = chatSocketService.connect(token);
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      chatSocketService.disconnect();
      setIsConnected(false);
    };
  }, [token]);

  return (
    <ChatSocketContext.Provider value={{ isConnected }}>
      {children}
    </ChatSocketContext.Provider>
  );
}
