import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { chatSocketService } from "@/features/chat/services/chat-socket.service";
import { tokenStorage } from "@/shared/utils/storage";
import { ChatSocketContext } from "./ChatSocketContext";

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
      // isConnected is already false here: either it's the initial render
      // (useState default), or the previous effect's cleanup already reset
      // it when token changed — no synchronous set needed.
      return;
    }

    const socket: Socket = chatSocketService.connect(token);
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    // socket.connected can only be known after connect() runs as a side
    // effect (it may synchronously reuse an already-connected singleton),
    // so this can't be moved into useState's initializer.
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
