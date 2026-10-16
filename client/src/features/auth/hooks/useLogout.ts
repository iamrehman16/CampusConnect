import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // Or your preferred router
import authService from "../services/auth.service";
import toast from "react-hot-toast";
import { tokenStorage } from "@/shared/utils/storage";
import { clearOfflineApiCache } from "@/shared/lib/offlineCache";
import pushService from "@/features/notifications/services/push.service";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      // Before signout: the server half needs the session. A shared browser
      // must not keep receiving the previous user's notifications.
      try {
        await pushService.disable();
      } catch (err) {
        console.error("[Push] could not unsubscribe this device on sign-out:", err);
      }
      return authService.signout();
    },
    onSuccess: () => {
      queryClient.clear();
      void clearOfflineApiCache();
      toast.success("Logged out successfully");
      navigate("/login");
      tokenStorage.clearTokens();
    },
  });
};
