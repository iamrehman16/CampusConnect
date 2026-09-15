import { ChatSocketContext } from "@/app/providers/ChatSocketProvider";
import { useContext } from "react";

export function useChatSocketContext() {
  const context = useContext(ChatSocketContext);

  if (!context) {
    throw new Error(
      "useChatSocketContext must be used within a ChatSocketProvider",
    );
  }

  return context;
}
