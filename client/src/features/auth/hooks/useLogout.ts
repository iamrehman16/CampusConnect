import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // Or your preferred router
import authService from "../services/auth.service";
import toast from "react-hot-toast";
import { tokenStorage } from "@/shared/utils/storage";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.signout(),
    onSuccess: () => {
      queryClient.clear();
      toast.success("Logged out successfully");
      navigate("/login");
      tokenStorage.clearTokens();
    },
  });
};
